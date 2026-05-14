package model

type SecondaryPasswordStatus struct {
	IsSet bool `json:"isSet"`
}

type SetSecondaryPasswordInput struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}
