//go:build !windows

package service

import "fmt"

func startDetachedScript(scriptPath string) error {
	return fmt.Errorf("update script execution is only supported on Windows: %s", scriptPath)
}
