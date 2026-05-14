package service

import (
	"path/filepath"
	"testing"

	"llm-station-hub/internal/db"
	"llm-station-hub/internal/model"
)

func TestListSitesTreatsAllTypeAsNoTypeFilter(t *testing.T) {
	service := newTestSiteService(t)

	if err := service.CreateSite(model.CreateSiteInput{
		Name: "Example",
		URL:  "https://example.com",
		Type: "transit",
	}); err != nil {
		t.Fatalf("CreateSite failed: %v", err)
	}

	sites, err := service.ListSites(model.SiteFilter{Type: "all", CheckinEnabled: "all"})
	if err != nil {
		t.Fatalf("ListSites failed: %v", err)
	}
	if len(sites) != 1 {
		t.Fatalf("expected 1 site with type=all, got %d", len(sites))
	}
	if sites[0].Status != model.SiteStatusActive {
		t.Fatalf("expected active status, got %s", sites[0].Status)
	}
}

func TestSiteAccountPasswordRequiresSecondaryPassword(t *testing.T) {
	service := newTestSiteService(t)

	if err := service.CreateSite(model.CreateSiteInput{
		Name: "Account Site",
		URL:  "https://account.example.com",
		Type: "public",
	}); err != nil {
		t.Fatalf("CreateSite failed: %v", err)
	}

	sites, err := service.ListSites(model.SiteFilter{Type: "all", CheckinEnabled: "all"})
	if err != nil {
		t.Fatalf("ListSites failed: %v", err)
	}
	siteID := sites[0].ID

	account, err := service.CreateSiteAccount(model.CreateSiteAccountInput{
		SiteID:      siteID,
		AccountType: model.SiteAccountTypeDefault,
		Username:    "demo-user",
		Password:    "secret-pass",
		HasQuota:    false,
		Note:        "test account",
	})
	if err != nil {
		t.Fatalf("CreateSiteAccount failed: %v", err)
	}
	if !account.PasswordSet {
		t.Fatalf("expected passwordSet to be true")
	}

	if _, err := service.RevealSiteAccountPassword(account.ID, "secret-2nd"); err == nil {
		t.Fatalf("expected reveal without secondary password configuration to fail")
	}

	if err := service.SetSecondaryPassword(model.SetSecondaryPasswordInput{NewPassword: "secret-2nd"}); err != nil {
		t.Fatalf("SetSecondaryPassword failed: %v", err)
	}

	revealed, err := service.RevealSiteAccountPassword(account.ID, "secret-2nd")
	if err != nil {
		t.Fatalf("RevealSiteAccountPassword failed: %v", err)
	}
	if revealed != "secret-pass" {
		t.Fatalf("expected revealed password to match, got %q", revealed)
	}

	accounts, err := service.ListSiteAccounts(siteID)
	if err != nil {
		t.Fatalf("ListSiteAccounts failed: %v", err)
	}
	if len(accounts) != 1 {
		t.Fatalf("expected 1 account, got %d", len(accounts))
	}
	if accounts[0].AccountType != model.SiteAccountTypeDefault {
		t.Fatalf("expected default account type, got %s", accounts[0].AccountType)
	}

	if err := service.SetSiteArchived(siteID, true); err != nil {
		t.Fatalf("SetSiteArchived failed: %v", err)
	}

	sites, err = service.ListSites(model.SiteFilter{Type: "all", CheckinEnabled: "all", Archived: "archived"})
	if err != nil {
		t.Fatalf("ListSites after archive failed: %v", err)
	}
	if len(sites) != 1 || sites[0].Status != model.SiteStatusArchived {
		t.Fatalf("expected archived site status, got %+v", sites)
	}
}

func TestLStationAccountDoesNotRequireOrStoreCredentials(t *testing.T) {
	service := newTestSiteService(t)

	if err := service.CreateSite(model.CreateSiteInput{
		Name: "L Station",
		URL:  "https://l.example.com",
		Type: "public",
	}); err != nil {
		t.Fatalf("CreateSite failed: %v", err)
	}

	sites, err := service.ListSites(model.SiteFilter{Type: "all", CheckinEnabled: "all"})
	if err != nil {
		t.Fatalf("ListSites failed: %v", err)
	}
	siteID := sites[0].ID

	account, err := service.CreateSiteAccount(model.CreateSiteAccountInput{
		SiteID:      siteID,
		AccountType: model.SiteAccountTypeLStation,
		Username:    "should-be-cleared",
		Password:    "should-not-be-stored",
		HasQuota:    true,
		Note:        "L station marker",
	})
	if err != nil {
		t.Fatalf("CreateSiteAccount failed: %v", err)
	}
	if account.Username != "" {
		t.Fatalf("expected lstation username to be cleared, got %q", account.Username)
	}
	if account.PasswordSet {
		t.Fatalf("expected lstation passwordSet to be false")
	}

	updated, err := service.UpdateSiteAccount(account.ID, model.UpdateSiteAccountInput{
		SiteID:      siteID,
		AccountType: model.SiteAccountTypeLStation,
		Username:    "",
		Password:    "still-ignored",
		HasQuota:    false,
		Note:        "updated marker",
	})
	if err != nil {
		t.Fatalf("UpdateSiteAccount failed: %v", err)
	}
	if updated.Username != "" || updated.PasswordSet {
		t.Fatalf("expected lstation credentials to remain empty, got username=%q passwordSet=%t", updated.Username, updated.PasswordSet)
	}

	if err := service.SetSecondaryPassword(model.SetSecondaryPasswordInput{NewPassword: "secret-2nd"}); err != nil {
		t.Fatalf("SetSecondaryPassword failed: %v", err)
	}
	if _, err := service.RevealSiteAccountPassword(account.ID, "secret-2nd"); err == nil {
		t.Fatalf("expected lstation password reveal to fail")
	}
}

func newTestSiteService(t *testing.T) *SiteService {
	t.Helper()

	database, err := db.InitDB(filepath.Join(t.TempDir(), "llm-station-hub-test.db"))
	if err != nil {
		t.Fatalf("InitDB failed: %v", err)
	}
	t.Cleanup(func() {
		database.Close()
	})

	if err := db.RunMigrations(database); err != nil {
		t.Fatalf("RunMigrations failed: %v", err)
	}

	return NewSiteService(database, NewAppLogger())
}
