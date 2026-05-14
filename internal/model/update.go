package model

type AppVersion struct {
	Version string `json:"version"`
}

type AppAboutInfo struct {
	ProjectName string `json:"projectName"`
	Version     string `json:"version"`
	ExePath     string `json:"exePath"`
	ReleaseURL  string `json:"releaseUrl"`
}

type UpdateInfo struct {
	CurrentVersion string `json:"currentVersion"`
	LatestVersion  string `json:"latestVersion"`
	HasUpdate      bool   `json:"hasUpdate"`
	CanInstall     bool   `json:"canInstall"`
	ReleaseName    string `json:"releaseName"`
	ReleaseURL     string `json:"releaseUrl"`
	PublishedAt    string `json:"publishedAt"`
	Body           string `json:"body"`
	AssetName      string `json:"assetName"`
	AssetURL       string `json:"assetUrl"`
	AssetSize      int64  `json:"assetSize"`
	Message        string `json:"message"`
}

type UpdateInstallResult struct {
	Version      string `json:"version"`
	AssetName    string `json:"assetName"`
	DownloadPath string `json:"downloadPath"`
	ScriptPath   string `json:"scriptPath"`
	SHA256       string `json:"sha256"`
}
