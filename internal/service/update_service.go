package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"time"

	"llm-station-hub/internal/model"
)

const (
	projectName             = "llm-station-hub"
	repositoryReleaseURL    = "https://github.com/diary-OvO/llm-station-hub/releases"
	defaultLatestReleaseURL = "https://api.github.com/repos/diary-OvO/llm-station-hub/releases/latest"
	maxUpdateDownloadBytes  = 300 * 1024 * 1024
)

type UpdateService struct {
	currentVersion   string
	latestReleaseURL string
	httpClient       *http.Client
	logger           *AppLogger
}

type githubRelease struct {
	TagName     string               `json:"tag_name"`
	Name        string               `json:"name"`
	HTMLURL     string               `json:"html_url"`
	Body        string               `json:"body"`
	PublishedAt string               `json:"published_at"`
	Assets      []githubReleaseAsset `json:"assets"`
}

type githubReleaseAsset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
	Size               int64  `json:"size"`
}

func NewUpdateService(currentVersion string, logger *AppLogger) *UpdateService {
	return &UpdateService{
		currentVersion:   strings.TrimSpace(currentVersion),
		latestReleaseURL: defaultLatestReleaseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		logger: logger,
	}
}

func (s *UpdateService) CurrentVersion() model.AppVersion {
	version := s.currentVersion
	if version == "" {
		version = "dev"
	}
	return model.AppVersion{Version: version}
}

func (s *UpdateService) AboutInfo(executablePath string) model.AppAboutInfo {
	version := s.CurrentVersion().Version
	return model.AppAboutInfo{
		ProjectName: projectName,
		Version:     version,
		ExePath:     executablePath,
		ReleaseURL:  releaseURLForVersion(version),
	}
}

func (s *UpdateService) Check(ctx context.Context) (model.UpdateInfo, error) {
	release, err := s.fetchLatestRelease(ctx)
	if err != nil {
		if s.logger != nil {
			s.logger.Error("update.check", err, "check latest release failed")
		}
		return model.UpdateInfo{}, err
	}

	info := s.buildUpdateInfo(release)
	if s.logger != nil {
		if info.HasUpdate {
			s.logger.Info("update.check", "new release %q is available", info.LatestVersion)
		} else {
			s.logger.Info("update.check", "no update available; current=%q latest=%q", info.CurrentVersion, info.LatestVersion)
		}
	}
	return info, nil
}

func (s *UpdateService) DownloadAndPrepareUpdate(ctx context.Context) (model.UpdateInstallResult, error) {
	info, err := s.Check(ctx)
	if err != nil {
		return model.UpdateInstallResult{}, err
	}
	if !info.HasUpdate {
		return model.UpdateInstallResult{}, fmt.Errorf("current version %s is already up to date", info.CurrentVersion)
	}
	if !info.CanInstall {
		if info.Message != "" {
			return model.UpdateInstallResult{}, fmt.Errorf("%s", info.Message)
		}
		return model.UpdateInstallResult{}, fmt.Errorf("this update cannot be installed automatically")
	}

	executablePath, err := os.Executable()
	if err != nil {
		return model.UpdateInstallResult{}, fmt.Errorf("resolve current executable path: %w", err)
	}
	executablePath, err = filepath.Abs(executablePath)
	if err != nil {
		return model.UpdateInstallResult{}, fmt.Errorf("resolve absolute executable path: %w", err)
	}

	workDir, err := updateWorkDir(info.LatestVersion)
	if err != nil {
		return model.UpdateInstallResult{}, err
	}

	downloadPath := filepath.Join(workDir, "llm-station-hub-"+safeFilePart(info.LatestVersion)+".exe")
	sha, err := s.downloadAsset(ctx, info.AssetURL, downloadPath, info.AssetSize)
	if err != nil {
		return model.UpdateInstallResult{}, err
	}

	if err := validateWindowsExecutable(downloadPath); err != nil {
		return model.UpdateInstallResult{}, err
	}

	scriptPath := filepath.Join(workDir, "apply-update.cmd")
	if err := writeWindowsUpdateScript(scriptPath, downloadPath, executablePath, os.Getpid()); err != nil {
		return model.UpdateInstallResult{}, err
	}

	if err := startDetachedScript(scriptPath); err != nil {
		return model.UpdateInstallResult{}, fmt.Errorf("start update script: %w", err)
	}

	if s.logger != nil {
		s.logger.Info("update.install", "downloaded %q and started update script", info.AssetName)
	}

	return model.UpdateInstallResult{
		Version:      info.LatestVersion,
		AssetName:    info.AssetName,
		DownloadPath: downloadPath,
		ScriptPath:   scriptPath,
		SHA256:       sha,
	}, nil
}

func (s *UpdateService) fetchLatestRelease(ctx context.Context) (githubRelease, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, s.latestReleaseURL, nil)
	if err != nil {
		return githubRelease{}, fmt.Errorf("build release request: %w", err)
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", "llm-station-hub-updater")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return githubRelease{}, fmt.Errorf("request latest release: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return githubRelease{}, fmt.Errorf("request latest release failed with HTTP %d", resp.StatusCode)
	}

	var release githubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return githubRelease{}, fmt.Errorf("decode latest release: %w", err)
	}
	if strings.TrimSpace(release.TagName) == "" {
		return githubRelease{}, fmt.Errorf("latest release does not contain a tag")
	}
	return release, nil
}

func (s *UpdateService) buildUpdateInfo(release githubRelease) model.UpdateInfo {
	currentVersion := s.CurrentVersion().Version
	latestVersion := strings.TrimSpace(release.TagName)
	asset, hasAsset := selectWindowsExecutableAsset(release.Assets)
	compare, comparable := compareVersions(currentVersion, latestVersion)

	hasUpdate := comparable && compare < 0
	message := ""
	canInstall := hasUpdate && hasAsset && runtime.GOOS == "windows"
	if isDevVersion(currentVersion) {
		hasUpdate = false
		canInstall = false
		message = "development builds cannot be updated automatically"
	} else if !comparable {
		message = "current or latest version is not a valid release tag"
	} else if hasUpdate && !hasAsset {
		message = "latest release does not contain a Windows exe asset"
	} else if hasUpdate && runtime.GOOS != "windows" {
		message = "automatic installation is only supported on Windows"
	}

	info := model.UpdateInfo{
		CurrentVersion: currentVersion,
		LatestVersion:  latestVersion,
		HasUpdate:      hasUpdate,
		CanInstall:     canInstall,
		ReleaseName:    strings.TrimSpace(release.Name),
		ReleaseURL:     strings.TrimSpace(release.HTMLURL),
		PublishedAt:    strings.TrimSpace(release.PublishedAt),
		Body:           strings.TrimSpace(release.Body),
		Message:        message,
	}
	if hasAsset {
		info.AssetName = asset.Name
		info.AssetURL = asset.BrowserDownloadURL
		info.AssetSize = asset.Size
	}
	return info
}

func selectWindowsExecutableAsset(assets []githubReleaseAsset) (githubReleaseAsset, bool) {
	for _, asset := range assets {
		name := strings.ToLower(strings.TrimSpace(asset.Name))
		if !strings.HasSuffix(name, ".exe") {
			continue
		}
		if strings.Contains(name, "llm-station-hub") && isWindowsAMD64Asset(name) {
			return asset, true
		}
	}
	for _, asset := range assets {
		name := strings.ToLower(strings.TrimSpace(asset.Name))
		if strings.HasSuffix(name, ".exe") && strings.Contains(name, "llm-station-hub") {
			return asset, true
		}
	}
	for _, asset := range assets {
		name := strings.ToLower(strings.TrimSpace(asset.Name))
		if strings.HasSuffix(name, ".exe") {
			return asset, true
		}
	}
	return githubReleaseAsset{}, false
}

func isWindowsAMD64Asset(name string) bool {
	return strings.Contains(name, "windows") && (strings.Contains(name, "amd64") || strings.Contains(name, "x64"))
}

func compareVersions(current string, latest string) (int, bool) {
	currentParts, ok := parseVersionParts(current)
	if !ok {
		return 0, false
	}
	latestParts, ok := parseVersionParts(latest)
	if !ok {
		return 0, false
	}
	for i := 0; i < len(currentParts); i++ {
		if currentParts[i] < latestParts[i] {
			return -1, true
		}
		if currentParts[i] > latestParts[i] {
			return 1, true
		}
	}
	return 0, true
}

func parseVersionParts(version string) ([3]int, bool) {
	var result [3]int
	normalized := strings.TrimSpace(version)
	normalized = strings.TrimPrefix(normalized, "refs/tags/")
	normalized = strings.TrimPrefix(normalized, "v")
	normalized = strings.TrimPrefix(normalized, "V")
	if idx := strings.IndexAny(normalized, "+-"); idx >= 0 {
		normalized = normalized[:idx]
	}
	parts := strings.Split(normalized, ".")
	if len(parts) != 3 {
		return result, false
	}
	for i, part := range parts {
		if part == "" {
			return result, false
		}
		value, err := strconv.Atoi(part)
		if err != nil || value < 0 {
			return result, false
		}
		result[i] = value
	}
	return result, true
}

func isDevVersion(version string) bool {
	trimmed := strings.TrimSpace(strings.ToLower(version))
	return trimmed == "" || trimmed == "dev" || trimmed == "development"
}

func releaseURLForVersion(version string) string {
	version = strings.TrimSpace(version)
	if isDevVersion(version) {
		return repositoryReleaseURL
	}
	return repositoryReleaseURL + "/tag/" + version
}

func updateWorkDir(version string) (string, error) {
	cacheDir, err := os.UserCacheDir()
	if err != nil {
		return "", fmt.Errorf("resolve user cache directory: %w", err)
	}
	dir := filepath.Join(cacheDir, "llm-station-hub", "updates", safeFilePart(version)+"-"+time.Now().Format("20060102150405"))
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("create update directory: %w", err)
	}
	return dir, nil
}

func safeFilePart(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return "unknown"
	}
	replacer := strings.NewReplacer("\\", "-", "/", "-", ":", "-", "*", "-", "?", "-", "\"", "-", "<", "-", ">", "-", "|", "-")
	return replacer.Replace(value)
}

func (s *UpdateService) downloadAsset(ctx context.Context, assetURL string, destination string, expectedSize int64) (string, error) {
	if strings.TrimSpace(assetURL) == "" {
		return "", fmt.Errorf("release asset does not contain a download URL")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, assetURL, nil)
	if err != nil {
		return "", fmt.Errorf("build asset request: %w", err)
	}
	req.Header.Set("User-Agent", "llm-station-hub-updater")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("download update asset: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("download update asset failed with HTTP %d", resp.StatusCode)
	}
	if resp.ContentLength > maxUpdateDownloadBytes {
		return "", fmt.Errorf("update asset is too large")
	}

	output, err := os.Create(destination)
	if err != nil {
		return "", fmt.Errorf("create downloaded update file: %w", err)
	}
	defer output.Close()

	hash := sha256.New()
	limitedReader := io.LimitReader(resp.Body, maxUpdateDownloadBytes+1)
	written, err := io.Copy(io.MultiWriter(output, hash), limitedReader)
	if err != nil {
		return "", fmt.Errorf("write downloaded update file: %w", err)
	}
	if written > maxUpdateDownloadBytes {
		return "", fmt.Errorf("update asset is too large")
	}
	if expectedSize > 0 && written != expectedSize {
		return "", fmt.Errorf("downloaded update size mismatch: got %d bytes, expected %d bytes", written, expectedSize)
	}
	if written == 0 {
		return "", fmt.Errorf("downloaded update is empty")
	}

	return hex.EncodeToString(hash.Sum(nil)), nil
}

func validateWindowsExecutable(path string) error {
	file, err := os.Open(path)
	if err != nil {
		return fmt.Errorf("open downloaded update for validation: %w", err)
	}
	defer file.Close()

	header := make([]byte, 2)
	if _, err := io.ReadFull(file, header); err != nil {
		return fmt.Errorf("read downloaded update header: %w", err)
	}
	if string(header) != "MZ" {
		return fmt.Errorf("downloaded update is not a Windows executable")
	}
	return nil
}

func writeWindowsUpdateScript(scriptPath string, sourcePath string, targetPath string, pid int) error {
	logPath := filepath.Join(filepath.Dir(scriptPath), "apply-update.log")
	backupPath := targetPath + ".old"
	newPath := targetPath + ".new"

	script := fmt.Sprintf(`@echo off
setlocal
set "SOURCE=%s"
set "TARGET=%s"
set "NEWFILE=%s"
set "BACKUP=%s"
set "PID=%d"
set "LOG=%s"

echo Starting llm-station-hub update at %%DATE%% %%TIME%% > "%%LOG%%"

for /l %%%%i in (1,1,90) do (
  tasklist /FI "PID eq %%PID%%" 2>NUL | findstr /R /C:"%%PID%%" >NUL
  if errorlevel 1 goto replace
  timeout /t 1 /nobreak >NUL
)

echo Timed out waiting for current process to exit. >> "%%LOG%%"
goto fail

:replace
if exist "%%NEWFILE%%" del /f /q "%%NEWFILE%%" >NUL 2>NUL
copy /y "%%SOURCE%%" "%%NEWFILE%%" >NUL 2>NUL
if errorlevel 1 (
  echo Failed to stage new executable. >> "%%LOG%%"
  goto fail
)

if exist "%%BACKUP%%" del /f /q "%%BACKUP%%" >NUL 2>NUL
move /y "%%TARGET%%" "%%BACKUP%%" >NUL 2>NUL
if errorlevel 1 (
  echo Failed to back up current executable. >> "%%LOG%%"
  del /f /q "%%NEWFILE%%" >NUL 2>NUL
  goto fail
)

move /y "%%NEWFILE%%" "%%TARGET%%" >NUL 2>NUL
if errorlevel 1 (
  echo Failed to move new executable into place. >> "%%LOG%%"
  if exist "%%BACKUP%%" move /y "%%BACKUP%%" "%%TARGET%%" >NUL 2>NUL
  goto fail
)

start "" "%%TARGET%%"
echo Update completed. >> "%%LOG%%"
exit /b 0

:fail
echo Update failed. >> "%%LOG%%"
exit /b 1
`, sourcePath, targetPath, newPath, backupPath, pid, logPath)

	if err := os.WriteFile(scriptPath, []byte(script), 0755); err != nil {
		return fmt.Errorf("write update script: %w", err)
	}
	return nil
}
