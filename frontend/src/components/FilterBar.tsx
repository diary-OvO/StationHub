import { SiteFilter, SiteType, Tag } from "../types";
import { useI18n } from "../i18n";

interface FilterBarProps {
  filter: SiteFilter;
  tags: Tag[];
  onFilterChange: (update: Partial<SiteFilter>) => void;
}

export default function FilterBar({ filter, tags, onFilterChange }: FilterBarProps) {
  const { t } = useI18n();

  return (
    <div className="card overflow-visible p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-muted)]">
            StationHub
          </p>
          <p className="text-sm text-[var(--color-foreground)]">
            {t.searchPlaceholder}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(260px,1.5fr)_repeat(4,minmax(120px,0.75fr))]">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={filter.keyword}
              onChange={(e) => onFilterChange({ keyword: e.target.value })}
              placeholder={t.searchPlaceholder}
              className="input-field w-full pl-9"
            />
          </div>

          <select
            value={filter.type}
            onChange={(e) => onFilterChange({ type: e.target.value as SiteType | "all" })}
            className="input-field w-full cursor-pointer"
            aria-label={t.allTypes}
          >
            <option value="all">{t.allTypes}</option>
            <option value="transit">{t.transit}</option>
            <option value="public">{t.public}</option>
          </select>

          <select
            value={filter.checkinEnabled}
            onChange={(e) => onFilterChange({ checkinEnabled: e.target.value as "all" | "true" | "false" })}
            className="input-field w-full cursor-pointer"
            aria-label={t.allCheckin}
          >
            <option value="all">{t.allCheckin}</option>
            <option value="true">{t.checkinYes}</option>
            <option value="false">{t.checkinNo}</option>
          </select>

          <select
            value={filter.tagIds.length > 0 ? String(filter.tagIds[0]) : ""}
            onChange={(e) => {
              const val = e.target.value;
              onFilterChange({ tagIds: val ? [Number(val)] : [] });
            }}
            className="input-field w-full cursor-pointer"
            aria-label={t.allTags}
          >
            <option value="">{t.allTags}</option>
            {tags.map((tag) => (
              <option key={tag.id} value={String(tag.id)}>{tag.name}</option>
            ))}
          </select>

          <select
            value={filter.archived}
            onChange={(e) => onFilterChange({ archived: e.target.value as SiteFilter["archived"] })}
            className="input-field w-full cursor-pointer"
            aria-label={t.allArchiveStates}
          >
            <option value="all">{t.allArchiveStates}</option>
            <option value="active">{t.onlyActiveSites}</option>
            <option value="archived">{t.onlyArchivedSites}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
