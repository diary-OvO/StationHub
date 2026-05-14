import { useState, useEffect, FormEvent } from "react";
import { Tag, Site, CreateSiteInput, UpdateSiteInput, SiteType } from "../types";
import { useI18n } from "../i18n";
import Modal from "./Modal";

interface SiteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSiteInput | UpdateSiteInput) => Promise<void>;
  tags: Tag[];
  editingSite: Site | null;
  onCreateTag: (name: string) => Promise<void>;
}

const URL_PATTERN = /^https?:\/\/.+/i;

function toErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

export default function SiteForm({
  isOpen,
  onClose,
  onSubmit,
  tags,
  editingSite,
  onCreateTag,
}: SiteFormProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<SiteType | "">("");
  const [checkinEnabled, setCheckinEnabled] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [note, setNote] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingSite) {
      setName(editingSite.name);
      setUrl(editingSite.url);
      setType(editingSite.type);
      setCheckinEnabled(editingSite.checkinEnabled);
      setSelectedTagIds((editingSite.tags || []).map((t) => t.id));
      setNote(editingSite.note);
    } else {
      resetForm();
    }
    setErrors({});
    setSubmitError("");
  }, [editingSite, isOpen]);

  function resetForm() {
    setName("");
    setUrl("");
    setType("");
    setCheckinEnabled(false);
    setSelectedTagIds([]);
    setNote("");
    setNewTagName("");
    setErrors({});
    setSubmitError("");
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = t.nameRequired;
    if (!url.trim()) {
      newErrors.url = t.urlRequired;
    } else if (!URL_PATTERN.test(url.trim())) {
      newErrors.url = t.urlInvalid;
    }
    if (!type) newErrors.type = t.typeRequired;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        url: url.trim(),
        type: type as SiteType,
        checkinEnabled,
        note: note.trim(),
        tagIds: selectedTagIds,
      });
      onClose();
      resetForm();
    } catch (err) {
      console.error("Submit failed:", err);
      setSubmitError(toErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function toggleTag(tagId: number) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  async function handleCreateTag() {
    if (!newTagName.trim()) return;
    try {
      await onCreateTag(newTagName.trim());
      setNewTagName("");
      setSubmitError("");
    } catch (err) {
      console.error("Create tag failed:", err);
      setSubmitError(toErrorMessage(err));
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSite ? t.editSiteTitle : t.addSiteTitle}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="site-name" className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
              {t.siteName} <span className="text-[var(--color-destructive)]">*</span>
            </label>
            <input
              id="site-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.siteNamePlaceholder}
              className="input-field"
            />
            {errors.name && <p className="mt-1 text-xs text-[var(--color-destructive)]">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="site-url" className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
              {t.siteUrl} <span className="text-[var(--color-destructive)]">*</span>
            </label>
            <input
              id="site-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t.siteUrlPlaceholder}
              className="input-field"
            />
            {errors.url && <p className="mt-1 text-xs text-[var(--color-destructive)]">{errors.url}</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-background)]/60 p-4">
          <label className="mb-3 block text-sm font-medium text-[var(--color-foreground)]">
            {t.siteType} <span className="text-[var(--color-destructive)]">*</span>
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setType("transit")}
              className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                type === "transit"
                  ? "border-blue-400/70 bg-blue-500/12 text-[var(--color-foreground)] shadow-[0_12px_30px_rgba(37,99,235,0.14)]"
                  : "border-[var(--color-border)]/70 bg-[var(--color-surface)]/65 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              <p className="text-sm font-semibold">{t.transit}</p>
              <p className="mt-1 text-xs opacity-80">{t.siteType}</p>
            </button>
            <button
              type="button"
              onClick={() => setType("public")}
              className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                type === "public"
                  ? "border-emerald-400/70 bg-emerald-500/12 text-[var(--color-foreground)] shadow-[0_12px_30px_rgba(16,185,129,0.14)]"
                  : "border-[var(--color-border)]/70 bg-[var(--color-surface)]/65 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              <p className="text-sm font-semibold">{t.public}</p>
              <p className="mt-1 text-xs opacity-80">{t.siteType}</p>
            </button>
          </div>
          {errors.type && <p className="mt-2 text-xs text-[var(--color-destructive)]">{errors.type}</p>}
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-background)]/60 px-4 py-3">
          <div>
            <label className="text-sm font-medium text-[var(--color-foreground)]">{t.checkinEnabled}</label>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{t.checkinYes} / {t.checkinNo}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={checkinEnabled}
            onClick={() => setCheckinEnabled(!checkinEnabled)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              checkinEnabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                checkinEnabled ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-background)]/60 p-4">
          <label className="mb-2 block text-sm font-medium text-[var(--color-foreground)]">
            {t.tags}
          </label>
          <div className="mb-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedTagIds.includes(tag.id)
                    ? "bg-[var(--color-primary)] text-white shadow-[0_10px_26px_rgba(37,99,235,0.22)]"
                    : "bg-[var(--color-surface)]/70 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreateTag(); } }}
              placeholder={t.newTagPlaceholder}
              className="input-field flex-1"
            />
            <button
              type="button"
              onClick={handleCreateTag}
              className="btn-inline shrink-0"
            >
              {t.createTagInline}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="site-note" className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">{t.note}</label>
          <textarea
            id="site-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.notePlaceholder}
            rows={3}
            className="input-field resize-none"
          />
        </div>

        {submitError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {submitError}
          </p>
        )}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)]/70 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary border border-[var(--color-border)]">
            {t.cancelBtn}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary min-w-[120px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "..." : t.save}
          </button>
        </div>
      </form>
    </Modal>
  );
}
