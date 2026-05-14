package service

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"

	"llm-station-hub/internal/model"
)

const (
	settingAppSecret             = "app_secret"
	settingSecondaryPasswordHash = "secondary_password_hash"
	settingSecondaryPasswordSalt = "secondary_password_salt"
)

func (s *SiteService) GetSecondaryPasswordStatus() (model.SecondaryPasswordStatus, error) {
	hashValue, err := s.getSetting(settingSecondaryPasswordHash)
	if err != nil {
		s.logger.Error("security.status", err, "load secondary password status failed")
		return model.SecondaryPasswordStatus{}, err
	}

	return model.SecondaryPasswordStatus{IsSet: hashValue != ""}, nil
}

func (s *SiteService) SetSecondaryPassword(input model.SetSecondaryPasswordInput) error {
	if input.NewPassword == "" {
		return fmt.Errorf("new secondary password is required")
	}

	status, err := s.GetSecondaryPasswordStatus()
	if err != nil {
		return err
	}
	if status.IsSet {
		if err := s.validateSecondaryPassword(input.CurrentPassword); err != nil {
			s.logger.Error("security.set", err, "update secondary password failed")
			return err
		}
	}

	salt, err := randomBase64(16)
	if err != nil {
		s.logger.Error("security.set", err, "generate password salt failed")
		return err
	}
	hashValue := hashSecondaryPassword(input.NewPassword, salt)

	tx, err := s.db.Begin()
	if err != nil {
		s.logger.Error("security.set", err, "begin transaction failed")
		return err
	}
	defer tx.Rollback()

	if err := upsertSetting(tx, settingSecondaryPasswordSalt, salt); err != nil {
		s.logger.Error("security.set", err, "save password salt failed")
		return err
	}
	if err := upsertSetting(tx, settingSecondaryPasswordHash, hashValue); err != nil {
		s.logger.Error("security.set", err, "save password hash failed")
		return err
	}
	if err := tx.Commit(); err != nil {
		s.logger.Error("security.set", err, "commit secondary password failed")
		return err
	}

	s.logger.Info("security.set", "secondary password configured")
	return nil
}

func (s *SiteService) RevealSiteAccountPassword(accountID int64, secondaryPassword string) (string, error) {
	var accountType model.SiteAccountType
	var encrypted string
	err := s.db.QueryRow("SELECT account_type, password_encrypted FROM site_accounts WHERE id = ?", accountID).Scan(&accountType, &encrypted)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", fmt.Errorf("account %d not found", accountID)
		}
		s.logger.Error("security.reveal", err, "load encrypted password failed for account %d", accountID)
		return "", err
	}
	if accountType == model.SiteAccountTypeLStation {
		return "", fmt.Errorf("L station login does not use an account password")
	}

	if err := s.validateSecondaryPassword(secondaryPassword); err != nil {
		s.logger.Error("security.reveal", err, "secondary password validation failed for account %d", accountID)
		return "", err
	}
	if encrypted == "" {
		return "", fmt.Errorf("account password is empty")
	}

	password, err := s.decryptAccountPassword(encrypted)
	if err != nil {
		s.logger.Error("security.reveal", err, "decrypt password failed for account %d", accountID)
		return "", err
	}

	s.logger.Info("security.reveal", "revealed password for account %d", accountID)
	return password, nil
}

func (s *SiteService) encryptAccountPassword(password string) (string, error) {
	if password == "" {
		return "", nil
	}

	key, err := s.getOrCreateAppSecret()
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nil, nonce, []byte(password), nil)
	payload := append(nonce, ciphertext...)
	return base64.StdEncoding.EncodeToString(payload), nil
}

func (s *SiteService) decryptAccountPassword(encrypted string) (string, error) {
	key, err := s.getOrCreateAppSecret()
	if err != nil {
		return "", err
	}

	payload, err := base64.StdEncoding.DecodeString(encrypted)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(payload) < nonceSize {
		return "", fmt.Errorf("invalid encrypted payload")
	}

	nonce := payload[:nonceSize]
	ciphertext := payload[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

func (s *SiteService) validateSecondaryPassword(password string) error {
	hashValue, err := s.getSetting(settingSecondaryPasswordHash)
	if err != nil {
		return err
	}
	salt, err := s.getSetting(settingSecondaryPasswordSalt)
	if err != nil {
		return err
	}
	if hashValue == "" || salt == "" {
		return fmt.Errorf("secondary password is not configured")
	}
	if hashSecondaryPassword(password, salt) != hashValue {
		return fmt.Errorf("secondary password is invalid")
	}
	return nil
}

func (s *SiteService) getOrCreateAppSecret() ([]byte, error) {
	value, err := s.getSetting(settingAppSecret)
	if err != nil {
		return nil, err
	}
	if value == "" {
		value, err = randomBase64(32)
		if err != nil {
			return nil, err
		}
		if err := upsertSetting(s.db, settingAppSecret, value); err != nil {
			return nil, err
		}
	}

	key, err := base64.StdEncoding.DecodeString(value)
	if err != nil {
		return nil, err
	}
	if len(key) != 32 {
		return nil, fmt.Errorf("invalid app secret length")
	}
	return key, nil
}

func (s *SiteService) getSetting(key string) (string, error) {
	var value string
	err := s.db.QueryRow("SELECT value FROM settings WHERE key = ?", key).Scan(&value)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return value, err
}

type settingWriter interface {
	Exec(query string, args ...interface{}) (sql.Result, error)
}

func upsertSetting(writer settingWriter, key string, value string) error {
	_, err := writer.Exec("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", key, value)
	return err
}

func randomBase64(size int) (string, error) {
	buffer := make([]byte, size)
	if _, err := io.ReadFull(rand.Reader, buffer); err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(buffer), nil
}

func hashSecondaryPassword(password string, salt string) string {
	sum := sha256.Sum256([]byte(salt + ":" + password))
	return hex.EncodeToString(sum[:])
}
