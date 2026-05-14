import { AppLog } from "../types";
import { useI18n } from "../i18n";
import Modal from "./Modal";

interface LogViewerProps {
  isOpen: boolean;
  logs: AppLog[];
  loading: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function LogViewer({
  isOpen,
  logs,
  loading,
  onClose,
  onRefresh,
}: LogViewerProps) {
  const { t } = useI18n();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.logsTitle}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="max-w-xl text-xs text-[var(--color-muted)]">{t.logsSubtitle}</p>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="btn-secondary disabled:opacity-50"
          >
            {loading ? "..." : t.refreshLogs}
          </button>
        </div>

        <div className="card max-h-[55vh] overflow-y-auto rounded-[26px]">
          {logs.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--color-muted)]">
              {t.noLogs}
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]/70">
              {logs.map((log) => (
                <li key={log.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                        log.level === "error"
                          ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      }`}
                    >
                      {log.level}
                    </span>
                    <span className="font-mono text-xs text-[var(--color-muted)]">
                      {formatLogTime(log.time)}
                    </span>
                    <span className="font-mono text-xs text-[var(--color-primary)]">
                      {log.action}
                    </span>
                  </div>
                  <p className="mt-1 break-words text-sm text-[var(--color-foreground)]">
                    {log.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

function formatLogTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}
