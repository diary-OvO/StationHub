import React from "react";
import { useI18n } from "../i18n";
import { AppAboutInfo } from "../types";
import Modal from "./Modal";

interface AboutDialogProps {
  isOpen: boolean;
  aboutInfo: AppAboutInfo | null;
  loading: boolean;
  error: string;
  checkingUpdates: boolean;
  onCheckUpdates: () => void;
  onOpenReleaseLink: (url: string) => void;
  onClose: () => void;
}

const AboutDialog: React.FC<AboutDialogProps> = ({
  isOpen,
  aboutInfo,
  loading,
  error,
  checkingUpdates,
  onCheckUpdates,
  onOpenReleaseLink,
  onClose,
}) => {
  const { t } = useI18n();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.aboutTitle}>
      <div className="space-y-5 text-left">
        <div className="glass-panel rounded-2xl p-5">
          <p className="text-xl font-semibold text-[var(--color-foreground)]">
            {aboutInfo?.projectName ?? t.appName}
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{t.appSubtitle}</p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-[var(--color-destructive)]">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="rounded-2xl border border-[var(--color-border)]/70 bg-white/10 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
              {t.aboutCurrentVersion}
            </p>
            <p className="mt-1 break-all text-sm font-semibold text-[var(--color-foreground)]">
              {loading ? "..." : aboutInfo?.version ?? "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)]/70 bg-white/10 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
              {t.aboutExePath}
            </p>
            <p className="mt-1 break-all text-sm text-[var(--color-foreground)]">
              {loading ? "..." : aboutInfo?.exePath ?? "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)]/70 bg-white/10 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
              {t.aboutReleaseLink}
            </p>
            {aboutInfo?.releaseUrl ? (
              <a
                href={aboutInfo.releaseUrl}
                onClick={(event) => {
                  event.preventDefault();
                  onOpenReleaseLink(aboutInfo.releaseUrl);
                }}
                className="mt-1 block break-all text-sm font-medium text-[var(--color-primary)] hover:underline"
              >
                {aboutInfo.releaseUrl}
              </a>
            ) : (
              <p className="mt-1 text-sm text-[var(--color-foreground)]">-</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--color-border)]/70 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={checkingUpdates}
            className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.cancelBtn}
          </button>
          <button
            type="button"
            onClick={onCheckUpdates}
            disabled={loading || checkingUpdates}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checkingUpdates ? t.checkingUpdates : t.checkUpdates}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AboutDialog;
