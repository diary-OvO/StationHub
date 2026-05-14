//go:build windows

package service

import (
	"os/exec"
	"syscall"
)

func startDetachedScript(scriptPath string) error {
	cmd := exec.Command("cmd", "/C", "start", "", "/MIN", scriptPath)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	return cmd.Start()
}
