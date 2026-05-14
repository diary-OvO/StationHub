import React from "react";
import { useI18n } from "../i18n";
import Modal from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: "danger" | "default";
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  onClose,
  title,
  message,
  confirmText,
  confirmVariant = "danger",
  loading = false,
}) => {
  const { t } = useI18n();
  const handleClose = onCancel ?? onClose ?? (() => {});

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="flex flex-col items-center text-center">
        <div className="glass-panel mb-4 flex h-14 w-14 items-center justify-center rounded-full border-red-300/30 bg-red-500/10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--color-destructive)]" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="mb-6 text-sm text-[var(--color-muted)]">{message}</p>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)]/70 pt-4">
        <button
          onClick={handleClose}
          disabled={loading}
          className="btn-secondary disabled:opacity-50"
        >
          {t.cancelBtn}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`disabled:cursor-not-allowed disabled:opacity-50 ${
            confirmVariant === "danger"
              ? "btn-danger"
              : "btn-primary"
          }`}
        >
          {loading ? "..." : (confirmText ?? t.confirmBtn)}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
