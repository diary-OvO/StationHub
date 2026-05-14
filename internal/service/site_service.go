package service

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"llm-station-hub/internal/model"
)

type SiteService struct {
	db     *sql.DB
	logger *AppLogger
}

func NewSiteService(db *sql.DB, logger *AppLogger) *SiteService {
	return &SiteService{db: db, logger: logger}
}

func (s *SiteService) CreateSite(input model.CreateSiteInput) error {
	now := time.Now().Format(time.RFC3339)

	tx, err := s.db.Begin()
	if err != nil {
		s.logger.Error("site.create", err, "begin transaction failed for %q", input.Name)
		return err
	}
	defer tx.Rollback()

	result, err := tx.Exec(
		"INSERT INTO sites (name, url, type, checkin_enabled, archived, note, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?)",
		input.Name, input.URL, input.Type, boolToInt(input.CheckinEnabled), input.Note, now, now,
	)
	if err != nil {
		s.logger.Error("site.create", err, "insert site failed for %q", input.Name)
		return err
	}

	siteID, err := result.LastInsertId()
	if err != nil {
		s.logger.Error("site.create", err, "read inserted id failed for %q", input.Name)
		return err
	}

	for _, tagID := range input.TagIDs {
		if _, err := tx.Exec("INSERT INTO site_tags (site_id, tag_id) VALUES (?, ?)", siteID, tagID); err != nil {
			s.logger.Error("site.create", err, "attach tag %d failed for site %d", tagID, siteID)
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		s.logger.Error("site.create", err, "commit site %d failed", siteID)
		return err
	}

	s.logger.Info("site.create", "created site %d name=%q", siteID, input.Name)
	return nil
}

func (s *SiteService) UpdateSite(id int64, input model.UpdateSiteInput) error {
	now := time.Now().Format(time.RFC3339)

	tx, err := s.db.Begin()
	if err != nil {
		s.logger.Error("site.update", err, "begin transaction failed for site %d", id)
		return err
	}
	defer tx.Rollback()

	result, err := tx.Exec(
		"UPDATE sites SET name=?, url=?, type=?, checkin_enabled=?, note=?, updated_at=? WHERE id=?",
		input.Name, input.URL, input.Type, boolToInt(input.CheckinEnabled), input.Note, now, id,
	)
	if err != nil {
		s.logger.Error("site.update", err, "update site %d failed", id)
		return err
	}
	if err := ensureRowsAffected(result, id, "site"); err != nil {
		s.logger.Error("site.update", err, "update site failed")
		return err
	}

	if _, err := tx.Exec("DELETE FROM site_tags WHERE site_id=?", id); err != nil {
		s.logger.Error("site.update", err, "clear tags failed for site %d", id)
		return err
	}

	for _, tagID := range input.TagIDs {
		if _, err := tx.Exec("INSERT INTO site_tags (site_id, tag_id) VALUES (?, ?)", id, tagID); err != nil {
			s.logger.Error("site.update", err, "attach tag %d failed for site %d", tagID, id)
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		s.logger.Error("site.update", err, "commit site %d failed", id)
		return err
	}

	s.logger.Info("site.update", "updated site %d name=%q", id, input.Name)
	return nil
}

func (s *SiteService) DeleteSite(id int64) error {
	result, err := s.db.Exec("DELETE FROM sites WHERE id=?", id)
	if err != nil {
		s.logger.Error("site.delete", err, "delete site %d failed", id)
		return err
	}
	if err := ensureRowsAffected(result, id, "site"); err != nil {
		s.logger.Error("site.delete", err, "delete site failed")
		return err
	}

	s.logger.Info("site.delete", "deleted site %d", id)
	return nil
}

func (s *SiteService) SetSiteArchived(id int64, archived bool) error {
	result, err := s.db.Exec(
		"UPDATE sites SET archived=?, updated_at=? WHERE id=?",
		boolToInt(archived),
		time.Now().Format(time.RFC3339),
		id,
	)
	if err != nil {
		s.logger.Error("site.archive", err, "update archived state failed for site %d", id)
		return err
	}
	if err := ensureRowsAffected(result, id, "site"); err != nil {
		s.logger.Error("site.archive", err, "update archived state failed")
		return err
	}

	s.logger.Info("site.archive", "set archived=%t for site %d", archived, id)
	return nil
}

func (s *SiteService) ListSites(filter model.SiteFilter) ([]model.SiteView, error) {
	query := "SELECT DISTINCT s.id, s.name, s.url, s.type, s.checkin_enabled, s.archived, s.note, s.created_at, s.updated_at FROM sites s"
	var conditions []string
	var args []interface{}

	if len(filter.TagIDs) > 0 {
		query += " JOIN site_tags st ON s.id = st.site_id"
		placeholders := make([]string, len(filter.TagIDs))
		for i, tagID := range filter.TagIDs {
			placeholders[i] = "?"
			args = append(args, tagID)
		}
		conditions = append(conditions, fmt.Sprintf("st.tag_id IN (%s)", strings.Join(placeholders, ",")))
	}

	if filter.Keyword != "" {
		kw := "%" + filter.Keyword + "%"
		conditions = append(conditions, "(s.name LIKE ? OR s.url LIKE ?)")
		args = append(args, kw, kw)
	}

	if filter.Type != "" && filter.Type != "all" {
		conditions = append(conditions, "s.type = ?")
		args = append(args, filter.Type)
	}

	if filter.CheckinEnabled == "true" {
		conditions = append(conditions, "s.checkin_enabled = 1")
	} else if filter.CheckinEnabled == "false" {
		conditions = append(conditions, "s.checkin_enabled = 0")
	}

	if filter.Archived == "archived" {
		conditions = append(conditions, "s.archived = 1")
	} else if filter.Archived == "active" {
		conditions = append(conditions, "s.archived = 0")
	}

	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}
	query += " ORDER BY s.archived ASC, s.updated_at DESC, s.id DESC"

	rows, err := s.db.Query(query, args...)
	if err != nil {
		s.logger.Error("site.list", err, "query sites failed")
		return nil, err
	}
	defer rows.Close()

	var sites []model.SiteView
	for rows.Next() {
		var site model.SiteView
		var checkinEnabled int
		var archived int
		if err := rows.Scan(
			&site.ID,
			&site.Name,
			&site.URL,
			&site.Type,
			&checkinEnabled,
			&archived,
			&site.Note,
			&site.CreatedAt,
			&site.UpdatedAt,
		); err != nil {
			s.logger.Error("site.list", err, "scan site row failed")
			return nil, err
		}
		site.CheckinEnabled = checkinEnabled == 1
		site.Archived = archived == 1
		site.Tags = []model.Tag{}
		sites = append(sites, site)
	}

	for i := range sites {
		if err := s.populateSiteTags(&sites[i]); err != nil {
			return nil, err
		}
		if err := s.populateSiteAccountSummary(&sites[i]); err != nil {
			return nil, err
		}
		sites[i].Status = buildSiteStatus(sites[i])
	}

	if sites == nil {
		sites = []model.SiteView{}
	}

	s.logger.Info("site.list", "loaded %d sites", len(sites))
	return sites, nil
}

func (s *SiteService) ListSiteAccounts(siteID int64) ([]model.SiteAccountView, error) {
	rows, err := s.db.Query(
		"SELECT id, site_id, account_type, username, password_encrypted, has_quota, note, created_at, updated_at FROM site_accounts WHERE site_id = ? ORDER BY has_quota DESC, updated_at DESC, id DESC",
		siteID,
	)
	if err != nil {
		s.logger.Error("account.list", err, "query accounts failed for site %d", siteID)
		return nil, err
	}
	defer rows.Close()

	var accounts []model.SiteAccountView
	for rows.Next() {
		var account model.SiteAccountView
		var encrypted string
		var hasQuota int
		if err := rows.Scan(
			&account.ID,
			&account.SiteID,
			&account.AccountType,
			&account.Username,
			&encrypted,
			&hasQuota,
			&account.Note,
			&account.CreatedAt,
			&account.UpdatedAt,
		); err != nil {
			s.logger.Error("account.list", err, "scan account failed for site %d", siteID)
			return nil, err
		}
		applyAccountCredentialPolicy(&account, encrypted)
		account.HasQuota = hasQuota == 1
		accounts = append(accounts, account)
	}

	if accounts == nil {
		accounts = []model.SiteAccountView{}
	}

	s.logger.Info("account.list", "loaded %d accounts for site %d", len(accounts), siteID)
	return accounts, nil
}

func (s *SiteService) CreateSiteAccount(input model.CreateSiteAccountInput) (model.SiteAccountView, error) {
	username := normalizeAccountUsername(input.AccountType, input.Username)
	password := normalizeAccountPassword(input.AccountType, input.Password)

	if err := validateAccountInput(input.SiteID, input.AccountType, username); err != nil {
		return model.SiteAccountView{}, err
	}

	passwordEncrypted, err := s.encryptAccountPassword(password)
	if err != nil {
		s.logger.Error("account.create", err, "encrypt password failed for site %d", input.SiteID)
		return model.SiteAccountView{}, err
	}

	now := time.Now().Format(time.RFC3339)
	result, err := s.db.Exec(
		"INSERT INTO site_accounts (site_id, account_type, username, password_encrypted, has_quota, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		input.SiteID,
		input.AccountType,
		username,
		passwordEncrypted,
		boolToInt(input.HasQuota),
		input.Note,
		now,
		now,
	)
	if err != nil {
		s.logger.Error("account.create", err, "create account failed for site %d", input.SiteID)
		return model.SiteAccountView{}, err
	}

	accountID, err := result.LastInsertId()
	if err != nil {
		s.logger.Error("account.create", err, "read new account id failed")
		return model.SiteAccountView{}, err
	}

	s.logger.Info("account.create", "created account %d for site %d", accountID, input.SiteID)
	return s.getSiteAccount(accountID)
}

func (s *SiteService) UpdateSiteAccount(id int64, input model.UpdateSiteAccountInput) (model.SiteAccountView, error) {
	username := normalizeAccountUsername(input.AccountType, input.Username)
	password := normalizeAccountPassword(input.AccountType, input.Password)

	if err := validateAccountInput(input.SiteID, input.AccountType, username); err != nil {
		return model.SiteAccountView{}, err
	}

	var existingEncrypted string
	err := s.db.QueryRow("SELECT password_encrypted FROM site_accounts WHERE id = ?", id).Scan(&existingEncrypted)
	if err != nil {
		if err == sql.ErrNoRows {
			return model.SiteAccountView{}, fmt.Errorf("account %d not found", id)
		}
		return model.SiteAccountView{}, err
	}

	passwordEncrypted := existingEncrypted
	if input.AccountType == model.SiteAccountTypeLStation {
		passwordEncrypted = ""
	} else if password != "" {
		passwordEncrypted, err = s.encryptAccountPassword(password)
		if err != nil {
			s.logger.Error("account.update", err, "encrypt password failed for account %d", id)
			return model.SiteAccountView{}, err
		}
	}

	result, err := s.db.Exec(
		"UPDATE site_accounts SET site_id=?, account_type=?, username=?, password_encrypted=?, has_quota=?, note=?, updated_at=? WHERE id=?",
		input.SiteID,
		input.AccountType,
		username,
		passwordEncrypted,
		boolToInt(input.HasQuota),
		input.Note,
		time.Now().Format(time.RFC3339),
		id,
	)
	if err != nil {
		s.logger.Error("account.update", err, "update account %d failed", id)
		return model.SiteAccountView{}, err
	}
	if err := ensureRowsAffected(result, id, "account"); err != nil {
		s.logger.Error("account.update", err, "update account failed")
		return model.SiteAccountView{}, err
	}

	s.logger.Info("account.update", "updated account %d", id)
	return s.getSiteAccount(id)
}

func (s *SiteService) DeleteSiteAccount(id int64) error {
	result, err := s.db.Exec("DELETE FROM site_accounts WHERE id = ?", id)
	if err != nil {
		s.logger.Error("account.delete", err, "delete account %d failed", id)
		return err
	}
	if err := ensureRowsAffected(result, id, "account"); err != nil {
		s.logger.Error("account.delete", err, "delete account failed")
		return err
	}

	s.logger.Info("account.delete", "deleted account %d", id)
	return nil
}

func (s *SiteService) ListTags() ([]model.Tag, error) {
	rows, err := s.db.Query("SELECT id, name, created_at FROM tags ORDER BY name")
	if err != nil {
		s.logger.Error("tag.list", err, "query tags failed")
		return nil, err
	}
	defer rows.Close()

	var tags []model.Tag
	for rows.Next() {
		var tag model.Tag
		if err := rows.Scan(&tag.ID, &tag.Name, &tag.CreatedAt); err != nil {
			s.logger.Error("tag.list", err, "scan tag failed")
			return nil, err
		}
		tags = append(tags, tag)
	}

	if tags == nil {
		tags = []model.Tag{}
	}

	s.logger.Info("tag.list", "loaded %d tags", len(tags))
	return tags, nil
}

func (s *SiteService) CreateTag(name string) error {
	_, err := s.db.Exec("INSERT INTO tags (name, created_at) VALUES (?, ?)", name, time.Now().Format(time.RFC3339))
	if err != nil {
		s.logger.Error("tag.create", err, "create tag %q failed", name)
		return err
	}

	s.logger.Info("tag.create", "created tag %q", name)
	return nil
}

func (s *SiteService) DeleteTag(id int64) error {
	result, err := s.db.Exec("DELETE FROM tags WHERE id = ?", id)
	if err != nil {
		s.logger.Error("tag.delete", err, "delete tag %d failed", id)
		return err
	}
	if err := ensureRowsAffected(result, id, "tag"); err != nil {
		s.logger.Error("tag.delete", err, "delete tag failed")
		return err
	}

	s.logger.Info("tag.delete", "deleted tag %d", id)
	return nil
}

func (s *SiteService) populateSiteTags(site *model.SiteView) error {
	rows, err := s.db.Query(
		"SELECT t.id, t.name, t.created_at FROM tags t JOIN site_tags st ON t.id = st.tag_id WHERE st.site_id = ? ORDER BY t.name",
		site.ID,
	)
	if err != nil {
		s.logger.Error("site.list", err, "query tags failed for site %d", site.ID)
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var tag model.Tag
		if err := rows.Scan(&tag.ID, &tag.Name, &tag.CreatedAt); err != nil {
			s.logger.Error("site.list", err, "scan tag failed for site %d", site.ID)
			return err
		}
		site.Tags = append(site.Tags, tag)
	}

	return rows.Err()
}

func (s *SiteService) populateSiteAccountSummary(site *model.SiteView) error {
	var accountCount int
	var quotaCount sql.NullInt64
	var normalCount sql.NullInt64
	var lStationCount sql.NullInt64

	err := s.db.QueryRow(
		`SELECT 
			COUNT(*),
			COALESCE(SUM(CASE WHEN has_quota = 1 THEN 1 ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN account_type = 'default' THEN 1 ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN account_type = 'lstation' THEN 1 ELSE 0 END), 0)
		FROM site_accounts
		WHERE site_id = ?`,
		site.ID,
	).Scan(&accountCount, &quotaCount, &normalCount, &lStationCount)
	if err != nil {
		s.logger.Error("site.list", err, "query account summary failed for site %d", site.ID)
		return err
	}

	site.AccountCount = accountCount
	site.QuotaAccountCount = int(quotaCount.Int64)
	site.NormalAccountCount = int(normalCount.Int64)
	site.LStationAccountCount = int(lStationCount.Int64)
	site.HasQuotaAccount = site.QuotaAccountCount > 0
	return nil
}

func (s *SiteService) getSiteAccount(id int64) (model.SiteAccountView, error) {
	var account model.SiteAccountView
	var encrypted string
	var hasQuota int
	err := s.db.QueryRow(
		"SELECT id, site_id, account_type, username, password_encrypted, has_quota, note, created_at, updated_at FROM site_accounts WHERE id = ?",
		id,
	).Scan(
		&account.ID,
		&account.SiteID,
		&account.AccountType,
		&account.Username,
		&encrypted,
		&hasQuota,
		&account.Note,
		&account.CreatedAt,
		&account.UpdatedAt,
	)
	if err != nil {
		return model.SiteAccountView{}, err
	}

	applyAccountCredentialPolicy(&account, encrypted)
	account.HasQuota = hasQuota == 1
	return account, nil
}

func applyAccountCredentialPolicy(account *model.SiteAccountView, encrypted string) {
	if account.AccountType == model.SiteAccountTypeLStation {
		account.Username = ""
		account.PasswordSet = false
		return
	}
	account.PasswordSet = encrypted != ""
}

func buildSiteStatus(site model.SiteView) model.SiteStatus {
	if site.Archived {
		return model.SiteStatusArchived
	}
	if site.AccountCount > 0 && !site.HasQuotaAccount {
		return model.SiteStatusEmptyQuota
	}
	return model.SiteStatusActive
}

func normalizeAccountUsername(accountType model.SiteAccountType, username string) string {
	if accountType == model.SiteAccountTypeLStation {
		return ""
	}
	return strings.TrimSpace(username)
}

func normalizeAccountPassword(accountType model.SiteAccountType, password string) string {
	if accountType == model.SiteAccountTypeLStation {
		return ""
	}
	return password
}

func validateAccountInput(siteID int64, accountType model.SiteAccountType, username string) error {
	if siteID <= 0 {
		return fmt.Errorf("site id is required")
	}
	if accountType != model.SiteAccountTypeDefault && accountType != model.SiteAccountTypeLStation {
		return fmt.Errorf("invalid account type")
	}
	if accountType == model.SiteAccountTypeDefault && strings.TrimSpace(username) == "" {
		return fmt.Errorf("account username is required")
	}
	return nil
}

func ensureRowsAffected(result sql.Result, id int64, label string) error {
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return fmt.Errorf("%s %d not found", label, id)
	}
	return nil
}

func boolToInt(value bool) int {
	if value {
		return 1
	}
	return 0
}
