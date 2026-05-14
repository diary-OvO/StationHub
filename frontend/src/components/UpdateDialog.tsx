import React from "react";
import { useI18n } from "../i18n";
import { UpdateInfo } from "../types";
import Modal from "./Modal";

interface UpdateDialogProps {
  isOpen: boolean;
  updateInfo: UpdateInfo | null;
  loading: boolean;
  installing: boolean;
  error: string;
  onCheck: () => void;
  onInstall: () => void;
  onClose: () => void;
}

function formatAssetSize(size: number) {
  if (!size || size <= 0) {
    return "";
  }
  const mb = size / 1024 / 1024;
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
}

const UpdateDialog: React.FC<UpdateDialogProps> = ({
  isOpen,
  updateInfo,
  loading,
  installing,
  error,
  onCheck,
  onInstall,
  onClose,
}) => {
  const { t } = useI18n();
  const hasUpdate = Boolean(updateInfo?.hasUpdate);
  const canInstall = Boolean(updateInfo?.canInstall);
  const isDevBuild = updateInfo?.currentVersion === "dev";
  const assetSize = formatAssetSize(updateInfo?.assetSize ?? 0);
  const statusMessage = installing
    ? t.updateRestarting
    : isDevBuild
      ? t.updateDevBuild
      : hasUpdate && !canInstall
        ? t.updateCannotInstall
        : t.updateInstallHint;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.updateDialogTitle}>
      <div className="space-y-5 text-left">
        <div className="glass-panel rounded-2xl p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-foreground)]">
                {loading
                  ? t.checkingUpdates
                  : hasUpdate
                    ? t.updateAvailable
                    : updateInfo && !isDevBuild
                      ? t.updateUpToDate
                      : t.updateUnavailable}
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {statusMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={onCheck}
              disabled={loading || installing}
              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "..." : t.refreshLogs}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-[var(--color-destructive)]">
            {t.updateCheckFailed}: {error}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--color-border)]/70 bg-white/10 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
              {t.updateCurrentVersion}
            </p>
            <p className="mt-1 break-all text-sm font-semibold text-[var(--color-foreground)]">
              {updateInfo?.currentVersion ?? "-"}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)]/70 bg-white/10 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
              {t.updateLatestVersion}
            </p>
            <p className="mt-1 break-all text-sm font-semibold text-[var(--color-foreground)]">
              {updateInfo?.latestVersion ?? "-"}
            </p>
          </div>
        </div>

        {updateInfo?.assetName && (
          <div className="rounded-2xl border border-[var(--color-border)]/70 bg-white/10 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
              {t.updateAsset}
            </p>
            <p className="mt-1 break-all text-sm text-[var(--color-foreground)]">
              {updateInfo.assetName}{assetSize ? ` · ${assetSize}` : ""}
            </p>
          </div>
        )}

        {updateInfo && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--color-foreground)]">{t.updateReleaseNotes}</p>
            <div className="max-h-52 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-[var(--color-border)]/70 bg-white/10 px-4 py-3 text-sm leading-6 text-[var(--color-muted)]">
              {updateInfo.body || t.updateNoReleaseNotes}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--color-border)]/70 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={installing}
            className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.cancelBtn}
          </button>
          <button
            type="button"
            onClick={onInstall}
            disabled={!canInstall || installing || loading}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {installing ? t.installingUpdate : t.installUpdate}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UpdateDialog;
