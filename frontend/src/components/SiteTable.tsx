import { Site, SiteStatus } from "../types";
import { useI18n } from "../i18n";
import Badge from "./Badge";

interface SiteTableProps {
  sites: Site[];
  onEdit: (site: Site) => void;
  onDelete: (id: number) => void;
  onOpen: (site: Site) => void;
  onManageAccounts: (site: Site) => void;
  onSetArchived: (site: Site, archived: boolean) => void;
}

export default function SiteTable({
  sites,
  onEdit,
  onDelete,
  onOpen,
  onManageAccounts,
  onSetArchived,
}: SiteTableProps) {
  const { t } = useI18n();

  if (sites.length === 0) {
    return (
      <div className="card p-12 text-center animate-fade-in">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
          <svg className="h-8 w-8 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-sm text-[var(--color-muted)]">{t.emptyState}</p>
      </div>
    );
  }

  const sections: Array<{ status: SiteStatus; title: string; subtitle: string }> = [
    { status: "active", title: t.activeSitesTitle, subtitle: t.activeSitesSubtitle },
    { status: "empty_quota", title: t.emptyQuotaSitesTitle, subtitle: t.emptyQuotaSitesSubtitle },
    { status: "archived", title: t.archivedSitesTitle, subtitle: t.archivedSitesSubtitle },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {sections.map((section) => {
        const sectionSites = sites.filter((site) => site.status === section.status);
        if (sectionSites.length === 0) {
          return null;
        }

        return (
          <section key={section.status} className="card overflow-visible px-4 py-4 md:px-5">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-[var(--color-border)]/70 pb-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  {section.title}
                </h2>
                <p className="text-sm text-[var(--color-foreground)]">{section.subtitle}</p>
              </div>
              <div className="glass-panel flex h-10 min-w-[44px] items-center justify-center rounded-full px-3 text-sm font-semibold text-[var(--color-foreground)]">
                {sectionSites.length}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {sectionSites.map((site) => (
                <article
                  key={site.id}
                  className={`site-card group ${
                    site.status === "empty_quota"
                      ? "site-card-empty"
                      : site.status === "archived"
                        ? "site-card-archived"
                        : ""
                  }`}
                >
                  <div className="flex h-full flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-semibold tracking-tight text-[var(--color-foreground)]">
                            {site.name}
                          </h3>
                          <SiteStatusBadge status={site.status} />
                          <Badge variant={site.type === "transit" ? "blue" : "green"} label={site.type === "transit" ? t.transit : t.public} />
                          <Badge variant={site.checkinEnabled ? "green" : "gray"} label={site.checkinEnabled ? t.checkinSupport : t.checkinNotSupport} />
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpen(site)}
                          title={site.url}
                          className="max-w-full truncate text-left text-sm text-[var(--color-primary)] hover:underline"
                        >
                          {site.url}
                        </button>

                        {site.note && (
                          <p className="line-clamp-2 text-sm text-[var(--color-muted)]">{site.note}</p>
                        )}
                      </div>

                      <div className="glass-panel flex min-w-[132px] flex-col rounded-2xl px-4 py-3">
                        <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          {t.accountCountLabel}
                        </span>
                        <span className="mt-1 text-2xl font-semibold text-[var(--color-foreground)]">
                          {site.accountCount}
                        </span>
                        <span className="mt-1 text-xs text-[var(--color-muted)]">
                          {site.quotaAccountCount} {t.hasQuota}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <MetricTile label={t.quotaAccountCountLabel} value={site.quotaAccountCount} accent="green" />
                      <MetricTile label={t.defaultAccountShort} value={site.normalAccountCount} accent="blue" />
                      <MetricTile label={t.lStationShort} value={site.lStationAccountCount} accent="violet" />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(site.tags || []).map((tag) => (
                        <Badge key={tag.id} label={tag.name} variant="gray" />
                      ))}
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)]/60 pt-4">
                      <div className="text-xs text-[var(--color-muted)]">
                        {t.colUpdated}: {site.updatedAt ? site.updatedAt.split("T")[0] : "-"}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => onManageAccounts(site)} className="btn-inline">
                          {t.manageAccounts}
                        </button>
                        <button type="button" onClick={() => onOpen(site)} className="btn-inline">
                          {t.open}
                        </button>
                        <button type="button" onClick={() => onEdit(site)} className="btn-inline">
                          {t.edit}
                        </button>
                        {site.status === "empty_quota" && (
                          <button
                            type="button"
                            onClick={() => onSetArchived(site, true)}
                            className="btn-inline border-amber-300/40 text-amber-700 dark:border-amber-700/40 dark:text-amber-300"
                          >
                            {t.archiveSite}
                          </button>
                        )}
                        {site.status === "archived" && (
                          <button type="button" onClick={() => onSetArchived(site, false)} className="btn-inline">
                            {t.unarchiveSite}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDelete(site.id)}
                          className="btn-inline border-red-300/35 text-red-600 dark:border-red-700/35 dark:text-red-300"
                        >
                          {t.delete}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function MetricTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "green" | "blue" | "violet";
}) {
  const accentClass =
    accent === "green"
      ? "text-emerald-300 bg-emerald-400/10 border-emerald-300/20"
      : accent === "violet"
        ? "text-violet-300 bg-violet-400/10 border-violet-300/20"
        : "text-sky-300 bg-sky-400/10 border-sky-300/20";

  return (
    <div className={`glass-panel rounded-2xl border px-4 py-3 ${accentClass}`}>
      <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-xl font-semibold text-[var(--color-foreground)]">{value}</p>
    </div>
  );
}

function SiteStatusBadge({ status }: { status: SiteStatus }) {
  const { t } = useI18n();

  if (status === "archived") {
    return <Badge variant="gray" label={t.archivedStatus} />;
  }
  if (status === "empty_quota") {
    return <Badge variant="amber" label={t.emptyQuotaStatus} />;
  }
  return <Badge variant="green" label={t.activeStatus} />;
}
