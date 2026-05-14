import { useState } from "react";
import { Tag } from "../types";
import { useI18n } from "../i18n";
import Modal from "./Modal";
import Badge from "./Badge";
import ConfirmDialog from "./ConfirmDialog";

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
  tags: Tag[];
  onCreateTag: (name: string) => Promise<void>;
  onDeleteTag: (id: number) => Promise<void>;
}

export default function TagManager({
  isOpen,
  onClose,
  tags,
  onCreateTag,
  onDeleteTag,
}: TagManagerProps) {
  const { t } = useI18n();
  const [newTagName, setNewTagName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleCreate() {
    const trimmed = newTagName.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      await onCreateTag(trimmed);
      setNewTagName("");
    } catch (err) {
      console.error("Failed to create tag:", err);
    } finally {
      setCreating(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await onDeleteTag(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete tag:", err);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={t.tagManagerTitle}>
        <div className="space-y-5">
          <div className="card overflow-visible px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder={t.newTagPlaceholder}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
                className="input-field flex-1"
              />
              <button
                onClick={handleCreate}
                disabled={creating || !newTagName.trim()}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.addTag}
              </button>
            </div>
          </div>

          {tags.length === 0 ? (
            <div className="glass-panel rounded-3xl px-4 py-10 text-center text-sm text-[var(--color-muted)]">
              {t.noTags}
            </div>
          ) : (
            <div className="card overflow-visible px-4 py-4">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div key={tag.id} className="group relative">
                    <Badge>
                      <span className="mr-1">{tag.name}</span>
                      <button
                        onClick={() => setDeleteTarget(tag)}
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[var(--color-muted)] opacity-0 transition-opacity hover:text-[var(--color-destructive)] group-hover:opacity-100"
                        aria-label={`Delete tag ${tag.name}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                      </button>
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={t.confirmDeleteTitle}
        message={t.deleteTagWarning}
        confirmText={t.confirmBtn}
        confirmVariant="danger"
        loading={deleting}
      />
    </>
  );
}
