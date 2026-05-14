package service

import (
	"fmt"
	"sync"
	"time"

	"stationhub/internal/model"
)

type AppLogger struct {
	mu      sync.Mutex
	nextID  int64
	entries []model.AppLog
}

func NewAppLogger() *AppLogger {
	return &AppLogger{
		nextID:  1,
		entries: []model.AppLog{},
	}
}

func (l *AppLogger) Info(action string, format string, args ...interface{}) {
	l.add("info", action, fmt.Sprintf(format, args...))
}

func (l *AppLogger) Error(action string, err error, format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	if err != nil {
		message = fmt.Sprintf("%s: %v", message, err)
	}
	l.add("error", action, message)
}

func (l *AppLogger) Entries() []model.AppLog {
	l.mu.Lock()
	defer l.mu.Unlock()

	entries := make([]model.AppLog, len(l.entries))
	copy(entries, l.entries)
	return entries
}

func (l *AppLogger) add(level string, action string, message string) {
	l.mu.Lock()
	defer l.mu.Unlock()

	entry := model.AppLog{
		ID:      l.nextID,
		Time:    time.Now().Format(time.RFC3339),
		Level:   level,
		Action:  action,
		Message: message,
	}
	l.nextID++
	l.entries = append(l.entries, entry)
	fmt.Printf("[%s] %s - %s\n", entry.Level, entry.Action, entry.Message)
}
