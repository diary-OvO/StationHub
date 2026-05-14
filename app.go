package main

import (
	"context"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"llm-station-hub/internal/db"
	"llm-station-hub/internal/model"
	"llm-station-hub/internal/service"
)

var appVersion = "dev"

// App struct
type App struct {
	ctx           context.Context
	siteService   *service.SiteService
	updateService *service.UpdateService
	logger        *service.AppLogger
}

// NewApp creates a new App application struct
func NewApp() *App {
	logger := service.NewAppLogger()
	return &App{
		logger:        logger,
		updateService: service.NewUpdateService(appVersion, logger),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.logger.Info("app.startup", "application startup")

	configDir, err := os.UserConfigDir()
	if err != nil {
		a.logger.Error("db.load", err, "get user config directory failed")
		return
	}

	dbDir := filepath.Join(configDir, "llm-station-hub")
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		a.logger.Error("db.load", err, "create database directory %q failed", dbDir)
		return
	}

	dbPath := filepath.Join(dbDir, "llm-station-hub.db")
	a.logger.Info("db.load", "database path %q", dbPath)

	database, err := db.InitDB(dbPath)
	if err != nil {
		a.logger.Error("db.load", err, "initialize database failed")
		return
	}
	a.logger.Info("db.load", "database opened and pragmas applied")

	if err := db.RunMigrations(database); err != nil {
		a.logger.Error("db.migration", err, "run migrations failed")
		return
	}
	a.logger.Info("db.migration", "schema migrations applied")

	a.siteService = service.NewSiteService(database, a.logger)
	a.logger.Info("app.startup", "site service initialized")
}

func (a *App) CreateSite(input model.CreateSiteInput) error {
	if err := a.ensureSiteService("site.create"); err != nil {
		return err
	}
	return a.siteService.CreateSite(input)
}

func (a *App) UpdateSite(id int64, input model.UpdateSiteInput) error {
	if err := a.ensureSiteService("site.update"); err != nil {
		return err
	}
	return a.siteService.UpdateSite(id, input)
}

func (a *App) DeleteSite(id int64) error {
	if err := a.ensureSiteService("site.delete"); err != nil {
		return err
	}
	return a.siteService.DeleteSite(id)
}

func (a *App) SetSiteArchived(id int64, archived bool) error {
	if err := a.ensureSiteService("site.archive"); err != nil {
		return err
	}
	return a.siteService.SetSiteArchived(id, archived)
}

func (a *App) ListSites(filter model.SiteFilter) ([]model.SiteView, error) {
	if err := a.ensureSiteService("site.list"); err != nil {
		return nil, err
	}
	return a.siteService.ListSites(filter)
}

func (a *App) ListSiteAccounts(siteID int64) ([]model.SiteAccountView, error) {
	if err := a.ensureSiteService("account.list"); err != nil {
		return nil, err
	}
	return a.siteService.ListSiteAccounts(siteID)
}

func (a *App) CreateSiteAccount(input model.CreateSiteAccountInput) (model.SiteAccountView, error) {
	if err := a.ensureSiteService("account.create"); err != nil {
		return model.SiteAccountView{}, err
	}
	return a.siteService.CreateSiteAccount(input)
}

func (a *App) UpdateSiteAccount(id int64, input model.UpdateSiteAccountInput) (model.SiteAccountView, error) {
	if err := a.ensureSiteService("account.update"); err != nil {
		return model.SiteAccountView{}, err
	}
	return a.siteService.UpdateSiteAccount(id, input)
}

func (a *App) DeleteSiteAccount(id int64) error {
	if err := a.ensureSiteService("account.delete"); err != nil {
		return err
	}
	return a.siteService.DeleteSiteAccount(id)
}

func (a *App) ListTags() ([]model.Tag, error) {
	if err := a.ensureSiteService("tag.list"); err != nil {
		return nil, err
	}
	return a.siteService.ListTags()
}

func (a *App) CreateTag(name string) error {
	if err := a.ensureSiteService("tag.create"); err != nil {
		return err
	}
	return a.siteService.CreateTag(name)
}

func (a *App) DeleteTag(id int64) error {
	if err := a.ensureSiteService("tag.delete"); err != nil {
		return err
	}
	return a.siteService.DeleteTag(id)
}

func (a *App) GetSecondaryPasswordStatus() (model.SecondaryPasswordStatus, error) {
	if err := a.ensureSiteService("security.status"); err != nil {
		return model.SecondaryPasswordStatus{}, err
	}
	return a.siteService.GetSecondaryPasswordStatus()
}

func (a *App) SetSecondaryPassword(input model.SetSecondaryPasswordInput) error {
	if err := a.ensureSiteService("security.set"); err != nil {
		return err
	}
	return a.siteService.SetSecondaryPassword(input)
}

func (a *App) RevealSiteAccountPassword(accountID int64, secondaryPassword string) (string, error) {
	if err := a.ensureSiteService("security.reveal"); err != nil {
		return "", err
	}
	return a.siteService.RevealSiteAccountPassword(accountID, secondaryPassword)
}

func (a *App) OpenSiteURL(rawURL string) error {
	trimmedURL := strings.TrimSpace(rawURL)
	parsedURL, err := url.ParseRequestURI(trimmedURL)
	if err != nil {
		a.logger.Error("site.open", err, "invalid site URL %q", trimmedURL)
		return fmt.Errorf("invalid URL: %w", err)
	}
	if parsedURL.Scheme != "http" && parsedURL.Scheme != "https" {
		err := fmt.Errorf("unsupported URL scheme %q", parsedURL.Scheme)
		a.logger.Error("site.open", err, "open site failed for %q", trimmedURL)
		return err
	}
	if a.ctx == nil {
		err := fmt.Errorf("application context is not ready")
		a.logger.Error("site.open", err, "open site failed for %q", trimmedURL)
		return err
	}

	runtime.BrowserOpenURL(a.ctx, trimmedURL)
	a.logger.Info("site.open", "opened %q in default browser", trimmedURL)
	return nil
}

func (a *App) GetAppVersion() model.AppVersion {
	return a.updateService.CurrentVersion()
}

func (a *App) CheckForUpdate() (model.UpdateInfo, error) {
	return a.updateService.Check(a.callContext())
}

func (a *App) DownloadAndInstallUpdate() (model.UpdateInstallResult, error) {
	result, err := a.updateService.DownloadAndPrepareUpdate(a.callContext())
	if err != nil {
		return model.UpdateInstallResult{}, err
	}
	if a.ctx != nil {
		go func() {
			time.Sleep(350 * time.Millisecond)
			runtime.Quit(a.ctx)
		}()
	}
	return result, nil
}

func (a *App) ListLogs() []model.AppLog {
	return a.logger.Entries()
}

func (a *App) callContext() context.Context {
	if a.ctx != nil {
		return a.ctx
	}
	return context.Background()
}

func (a *App) ensureSiteService(action string) error {
	if a.siteService != nil {
		return nil
	}
	err := fmt.Errorf("site service is not initialized")
	a.logger.Error(action, err, "operation blocked")
	return err
}
