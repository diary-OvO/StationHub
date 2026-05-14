package model

type SiteAccountType string

const (
	SiteAccountTypeDefault  SiteAccountType = "default"
	SiteAccountTypeLStation SiteAccountType = "lstation"
)

type SiteAccount struct {
	ID                int64           `json:"id"`
	SiteID            int64           `json:"siteId"`
	AccountType       SiteAccountType `json:"accountType"`
	Username          string          `json:"username"`
	PasswordEncrypted string          `json:"-"`
	HasQuota          bool            `json:"hasQuota"`
	Note              string          `json:"note"`
	CreatedAt         string          `json:"createdAt"`
	UpdatedAt         string          `json:"updatedAt"`
}

type SiteAccountView struct {
	ID          int64           `json:"id"`
	SiteID      int64           `json:"siteId"`
	AccountType SiteAccountType `json:"accountType"`
	Username    string          `json:"username"`
	PasswordSet bool            `json:"passwordSet"`
	HasQuota    bool            `json:"hasQuota"`
	Note        string          `json:"note"`
	CreatedAt   string          `json:"createdAt"`
	UpdatedAt   string          `json:"updatedAt"`
}

type CreateSiteAccountInput struct {
	SiteID      int64           `json:"siteId"`
	AccountType SiteAccountType `json:"accountType"`
	Username    string          `json:"username"`
	Password    string          `json:"password"`
	HasQuota    bool            `json:"hasQuota"`
	Note        string          `json:"note"`
}

type UpdateSiteAccountInput struct {
	SiteID      int64           `json:"siteId"`
	AccountType SiteAccountType `json:"accountType"`
	Username    string          `json:"username"`
	Password    string          `json:"password"`
	HasQuota    bool            `json:"hasQuota"`
	Note        string          `json:"note"`
}
