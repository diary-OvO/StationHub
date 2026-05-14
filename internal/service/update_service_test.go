package service

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCompareVersionsUsesSemanticParts(t *testing.T) {
	tests := []struct {
		current string
		latest  string
		want    int
	}{
		{current: "v0.1.2", latest: "v0.1.3", want: -1},
		{current: "v0.10.0", latest: "v0.9.0", want: 1},
		{current: "0.1.3", latest: "v0.1.3", want: 0},
	}

	for _, tt := range tests {
		t.Run(fmt.Sprintf("%s_to_%s", tt.current, tt.latest), func(t *testing.T) {
			got, ok := compareVersions(tt.current, tt.latest)
			if !ok {
				t.Fatalf("compareVersions returned not comparable")
			}
			if got != tt.want {
				t.Fatalf("compareVersions() = %d, want %d", got, tt.want)
			}
		})
	}
}

func TestCheckSelectsWindowsExeAsset(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"tag_name": "v0.1.4",
			"name": "v0.1.4",
			"html_url": "https://github.com/diary-OvO/llm-station-hub/releases/tag/v0.1.4",
			"published_at": "2026-05-14T00:00:00Z",
			"body": "release notes",
			"assets": [
				{"name": "llm-station-hub-v0.1.4-windows-amd64.zip", "browser_download_url": "https://example.com/app.zip", "size": 123},
				{"name": "llm-station-hub-v0.1.4-windows-amd64.exe", "browser_download_url": "https://example.com/app.exe", "size": 456}
			]
		}`))
	}))
	defer server.Close()

	service := NewUpdateService("v0.1.3", nil)
	service.latestReleaseURL = server.URL

	info, err := service.Check(context.Background())
	if err != nil {
		t.Fatalf("Check failed: %v", err)
	}
	if !info.HasUpdate {
		t.Fatalf("expected an update")
	}
	if info.AssetName != "llm-station-hub-v0.1.4-windows-amd64.exe" {
		t.Fatalf("expected exe asset, got %q", info.AssetName)
	}
	if info.AssetSize != 456 {
		t.Fatalf("expected exe asset size, got %d", info.AssetSize)
	}
}

func TestCheckReportsNoUpdateWhenCurrentMatchesLatest(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"tag_name": "v0.1.3",
			"name": "v0.1.3",
			"html_url": "https://github.com/diary-OvO/llm-station-hub/releases/tag/v0.1.3",
			"assets": [
				{"name": "llm-station-hub-v0.1.3-windows-amd64.exe", "browser_download_url": "https://example.com/app.exe", "size": 456}
			]
		}`))
	}))
	defer server.Close()

	service := NewUpdateService("v0.1.3", nil)
	service.latestReleaseURL = server.URL

	info, err := service.Check(context.Background())
	if err != nil {
		t.Fatalf("Check failed: %v", err)
	}
	if info.HasUpdate {
		t.Fatalf("expected no update")
	}
	if info.CanInstall {
		t.Fatalf("expected CanInstall=false when no update is available")
	}
}

func TestAboutInfoUsesCurrentVersionSource(t *testing.T) {
	service := NewUpdateService("v0.3.0", nil)

	info := service.AboutInfo(`C:\Apps\llm-station-hub.exe`)
	if info.ProjectName != "llm-station-hub" {
		t.Fatalf("unexpected project name: %q", info.ProjectName)
	}
	if info.Version != "v0.3.0" {
		t.Fatalf("expected version from UpdateService, got %q", info.Version)
	}
	if info.ReleaseURL != "https://github.com/diary-OvO/llm-station-hub/releases/tag/v0.3.0" {
		t.Fatalf("unexpected release URL: %q", info.ReleaseURL)
	}
}
