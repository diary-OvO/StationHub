package model

type SiteStatus string

const (
	SiteStatusActive     SiteStatus = "active"
	SiteStatusEmptyQuota SiteStatus = "empty_quota"
	SiteStatusArchived   SiteStatus = "archived"
)

type Site struct {
	ID             int64  `json:"id"`
	Name           string `json:"name"`
	URL            string `json:"url"`
	Type           string `json:"type"`
	CheckinEnabled bool   `json:"checkinEnabled"`
	Archived       bool   `json:"archived"`
	Note           string `json:"note"`
	CreatedAt      string `json:"createdAt"`
	UpdatedAt      string `json:"updatedAt"`
}

type SiteView struct {
	ID                   int64      `json:"id"`
	Name                 string     `json:"name"`
	URL                  string     `json:"url"`
	Type                 string     `json:"type"`
	CheckinEnabled       bool       `json:"checkinEnabled"`
	Archived             bool       `json:"archived"`
	Status               SiteStatus `json:"status"`
	Note                 string     `json:"note"`
	AccountCount         int        `json:"accountCount"`
	QuotaAccountCount    int        `json:"quotaAccountCount"`
	NormalAccountCount   int        `json:"normalAccountCount"`
	LStationAccountCount int        `json:"lStationAccountCount"`
	HasQuotaAccount      bool       `json:"hasQuotaAccount"`
	Tags                 []Tag      `json:"tags"`
	CreatedAt            string     `json:"createdAt"`
	UpdatedAt            string     `json:"updatedAt"`
}

type CreateSiteInput struct {
	Name           string  `json:"name"`
	URL            string  `json:"url"`
	Type           string  `json:"type"`
	CheckinEnabled bool    `json:"checkinEnabled"`
	Note           string  `json:"note"`
	TagIDs         []int64 `json:"tagIds"`
}

type UpdateSiteInput struct {
	Name           string  `json:"name"`
	URL            string  `json:"url"`
	Type           string  `json:"type"`
	CheckinEnabled bool    `json:"checkinEnabled"`
	Note           string  `json:"note"`
	TagIDs         []int64 `json:"tagIds"`
}

type SiteFilter struct {
	Keyword        string  `json:"keyword"`
	Type           string  `json:"type"`
	CheckinEnabled string  `json:"checkinEnabled"`
	Archived       string  `json:"archived"`
	TagIDs         []int64 `json:"tagIds"`
}
