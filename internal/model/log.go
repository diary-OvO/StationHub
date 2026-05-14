package model

type AppLog struct {
	ID      int64  `json:"id"`
	Time    string `json:"time"`
	Level   string `json:"level"`
	Action  string `json:"action"`
	Message string `json:"message"`
}
