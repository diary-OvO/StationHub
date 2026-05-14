import { FormEvent, useEffect, useState } from "react";
import {
  CreateSiteAccountInput,
  SecondaryPasswordStatus,
  SetSecondaryPasswordInput,
  Site,
  SiteAccount,
  SiteAccountType,
  UpdateSiteAccountInput,
} from "../types";
import { useI18n } from "../i18n";
import Badge from "./Badge";
import ConfirmDialog from "./ConfirmDialog";
import Modal from "./Modal";

interface SiteAccountManagerProps {
  isOpen: boolean;
  site: Site | null;
  securityStatus: SecondaryPasswordStatus;
  onClose: () => void;
  onLoadAccounts: (siteId: number) => Promise<SiteAccount[]>;
  onCreateAccount: (input: CreateSiteAccountInput) => Promise<SiteAccount>;
  onUpdateAccount: (id: number, input: UpdateSiteAccountInput) => Promise<SiteAccount>;
  onDeleteAccount: (id: number) => Promise<void>;
  onRevealPassword: (accountId: number, secondaryPassword: string) => Promise<string>;
  onSetSecondaryPassword: (input: SetSecondaryPasswordInput) => Promise<SecondaryPasswordStatus>;
  onSetSiteArchived: (siteId: number, archived: boolean) => Promise<void>;
}

const defaultForm = {
  accountType: "default" as SiteAccountType,
  username: "",
  password: "",
  hasQuota: true,
  note: "",
};

export default function SiteAccountManager({
  isOpen,
  site,
  securityStatus,
  onClose,
  onLoadAccounts,
  onCreateAccount,
  onUpdateAccount,
  onDeleteAccount,
  onRevealPassword,
  onSetSecondaryPassword,
  onSetSiteArchived,
}: SiteAccountManagerProps) {
  const { t } = useI18n();
  const [accounts, setAccounts] = useState<SiteAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [editingAccount, setEditingAccount] = useState<SiteAccount | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteTarget, setDeleteTarget] = useState<SiteAccount | null>(null);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [securityError, setSecurityError] = useState("");
  const [revealedPassword, setRevealedPassword] = useState("");
  const [secondaryPassword, setSecondaryPassword] = useState("");
  const [currentSecondaryPassword, setCurrentSecondaryPassword] = useState("");
  const [newSecondaryPassword, setNewSecondaryPassword] = useState("");
  const [revealTarget, setRevealTarget] = useState<SiteAccount | null>(null);

  useEffect(() => {
    if (!isOpen || !site) {
      return;
    }
    void loadAccounts(site.id);
    resetForm();
  }, [isOpen, site?.id]);

  async function loadAccounts(siteId: number) {
    setLoading(true);
    try {
      const result = await onLoadAccounts(siteId);
      setAccounts(result);
    } catch (err) {
      setSubmitError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingAccount(null);
    setForm(defaultForm);
    setSubmitError("");
  }

  function startEdit(account: SiteAccount) {
    setEditingAccount(account);
    setForm({
      accountType: account.accountType,
      username: account.accountType === "lstation" ? "" : account.username,
      password: "",
      hasQuota: account.hasQuota,
      note: account.note,
    });
    setSubmitError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!site) {
      return;
    }
    const isLStation = form.accountType === "lstation";
    if (!isLStation && !form.username.trim()) {
      setSubmitError(t.accountNameRequired);
      return;
    }

    setSaving(true);
    setSubmitError("");
    const payload = {
      siteId: site.id,
      accountType: form.accountType,
      username: isLStation ? "" : form.username.trim(),
      password: isLStation ? "" : form.password,
      hasQuota: form.hasQuota,
      note: form.note.trim(),
    };

    try {
      if (editingAccount) {
        await onUpdateAccount(editingAccount.id, payload);
      } else {
        await onCreateAccount(payload);
      }
      await loadAccounts(site.id);
      resetForm();
    } catch (err) {
      setSubmitError(toErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!deleteTarget || !site) {
      return;
    }
    try {
      await onDeleteAccount(deleteTarget.id);
      setDeleteTarget(null);
      await loadAccounts(site.id);
    } catch (err) {
      setSubmitError(toErrorMessage(err));
    }
  }

  function handleViewPassword(account: SiteAccount) {
    if (account.accountType === "lstation") {
      return;
    }
    if (!securityStatus.isSet) {
      setShowSecurityModal(true);
      setSecurityError(t.secondaryPasswordRequiredFirst);
      return;
    }
    setRevealTarget(account);
    setRevealedPassword("");
    setSecondaryPassword("");
    setSecurityError("");
    setShowRevealModal(true);
  }

  async function submitRevealPassword(e: FormEvent) {
    e.preventDefault();
    if (!revealTarget) {
      return;
    }
    try {
      const password = await onRevealPassword(revealTarget.id, secondaryPassword);
      setRevealedPassword(password);
      setSecurityError("");
    } catch (err) {
      setSecurityError(toErrorMessage(err));
    }
  }

  async function submitSecondaryPassword(e: FormEvent) {
    e.preventDefault();
    try {
      await onSetSecondaryPassword({
        currentPassword: currentSecondaryPassword,
        newPassword: newSecondaryPassword,
      });
      setShowSecurityModal(false);
      setSecurityError("");
      setCurrentSecondaryPassword("");
      setNewSecondaryPassword("");
    } catch (err) {
      setSecurityError(toErrorMessage(err));
    }
  }

  async function toggleArchive() {
    if (!site) {
      return;
    }
    try {
      await onSetSiteArchived(site.id, !site.archived);
    } catch (err) {
      setSubmitError(toErrorMessage(err));
    }
  }

  const canArchive = !!site && (site.status === "empty_quota" || site.archived);
  const isLStationForm = form.accountType === "lstation";

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={site ? `${site.name} · ${t.accountManagerTitle}` : t.accountManagerTitle}>
        {!site ? null : (
          <div className="space-y-5">
            <div className="card overflow-visible px-5 py-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge site={site} />
                    <Badge variant="gray" label={`${t.accountCountLabel}: ${site.accountCount}`} />
                    <Badge variant="green" label={`${t.quotaAccountCountLabel}: ${site.quotaAccountCount}`} />
                    <Badge variant="violet" label={`${t.lStationShort}: ${site.lStationAccountCount}`} />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-[var(--color-foreground)]">{site.url}</p>
                    {site.note && <p className="mt-1 text-sm text-[var(--color-muted)]">{site.note}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setShowSecurityModal(true)} className="btn-secondary">
                    {securityStatus.isSet ? t.updateSecondaryPassword : t.setupSecondaryPassword}
                  </button>
                  {canArchive && (
                    <button
                      type="button"
                      onClick={toggleArchive}
                      className={`btn-inline ${site.archived ? "" : "border-amber-300/35 text-amber-700 dark:border-amber-700/35 dark:text-amber-300"}`}
                    >
                      {site.archived ? t.unarchiveSite : t.archiveSite}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.92fr)]">
              <div className="card overflow-visible px-5 py-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">{t.accountListTitle}</h3>
                    <p className="mt-1 text-sm text-[var(--color-foreground)]">{t.accountFormHint}</p>
                  </div>
                  <button type="button" onClick={resetForm} className="btn-secondary">
                    {t.addAccount}
                  </button>
                </div>

                <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
                  {loading ? (
                    <div className="glass-panel rounded-3xl px-4 py-12 text-center text-sm text-[var(--color-muted)]">
                      {t.loadingAccounts}
                    </div>
                  ) : accounts.length === 0 ? (
                    <div className="glass-panel rounded-3xl border-dashed px-4 py-12 text-center text-sm text-[var(--color-muted)]">
                      {t.noAccounts}
                    </div>
                  ) : (
                    accounts.map((account) => {
                      const isLStationAccount = account.accountType === "lstation";

                      return (
                        <div
                          key={account.id}
                          className={`glass-panel rounded-[24px] p-4 ${
                            account.hasQuota
                              ? ""
                              : "border-amber-300/35 bg-[linear-gradient(180deg,rgba(255,205,121,0.18),rgba(255,255,255,0.05))] dark:border-amber-700/30"
                          }`}
                        >
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant={isLStationAccount ? "violet" : "blue"}
                                  label={isLStationAccount ? t.lStationLogin : t.defaultAccount}
                                />
                                <Badge variant={account.hasQuota ? "green" : "amber"} label={account.hasQuota ? t.hasQuota : t.noQuota} />
                              </div>
                              <div>
                                <p className="text-base font-semibold text-[var(--color-foreground)]">
                                  {isLStationAccount ? t.lStationNoCredentialTitle : account.username}
                                </p>
                                <p className="mt-1 text-xs text-[var(--color-muted)]">
                                  {isLStationAccount
                                    ? t.lStationCredentialStatus
                                    : account.passwordSet
                                      ? t.passwordStored
                                      : t.passwordEmpty}
                                </p>
                              </div>
                              {account.note && <p className="text-sm text-[var(--color-muted)]">{account.note}</p>}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {!isLStationAccount && (
                                <button
                                  type="button"
                                  onClick={() => handleViewPassword(account)}
                                  disabled={!account.passwordSet}
                                  className="btn-inline disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {t.viewPassword}
                                </button>
                              )}
                              <button type="button" onClick={() => startEdit(account)} className="btn-inline">
                                {t.edit}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(account)}
                                className="btn-inline border-red-300/35 text-red-600 dark:border-red-700/35 dark:text-red-300"
                              >
                                {t.delete}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="card overflow-visible px-5 py-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                      {editingAccount ? t.editAccountTitle : t.addAccountTitle}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--color-foreground)]">
                      {isLStationForm ? t.lStationLoginDescription : t.accountFormHint}
                    </p>
                  </div>
                  {editingAccount && (
                    <button type="button" onClick={resetForm} className="btn-inline">
                      {t.cancelEdit}
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--color-foreground)]">{t.accountTypeLabel}</label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, accountType: "default" }))}
                        className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                          form.accountType === "default"
                            ? "glass-panel border-sky-300/40 shadow-[0_20px_48px_rgba(55,114,255,0.14)]"
                            : "bg-white/5 text-[var(--color-muted)]"
                        }`}
                      >
                        <p className="text-sm font-semibold text-[var(--color-foreground)]">{t.defaultAccount}</p>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">{t.accountTypeLabel}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, accountType: "lstation", username: "", password: "" }))}
                        className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                          form.accountType === "lstation"
                            ? "glass-panel border-violet-300/40 shadow-[0_20px_48px_rgba(130,103,255,0.16)]"
                            : "bg-white/5 text-[var(--color-muted)]"
                        }`}
                      >
                        <p className="text-sm font-semibold text-[var(--color-foreground)]">{t.lStationLogin}</p>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">{t.accountTypeLabel}</p>
                      </button>
                    </div>
                  </div>

                  {isLStationForm ? (
                    <div className="glass-panel rounded-3xl border-violet-300/30 bg-[linear-gradient(135deg,rgba(130,103,255,0.16),rgba(255,255,255,0.05))] px-4 py-4">
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-400/16 text-sm font-semibold text-violet-700 dark:text-violet-200">
                          L
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-foreground)]">{t.lStationNoCredentialTitle}</p>
                          <p className="mt-1 text-sm text-[var(--color-muted)]">{t.lStationNoCredentialHint}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">{t.accountNameLabel}</label>
                        <input
                          type="text"
                          value={form.username}
                          onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                          className="input-field"
                          placeholder={t.accountNamePlaceholder}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">{t.accountPasswordLabel}</label>
                        <input
                          type="password"
                          value={form.password}
                          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                          className="input-field"
                          placeholder={editingAccount ? t.accountPasswordPlaceholderUpdate : t.accountPasswordPlaceholder}
                        />
                      </div>
                    </>
                  )}

                  <div className="glass-panel flex items-center justify-between rounded-2xl px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-foreground)]">{t.hasQuota}</p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">{t.hasQuotaHint}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.hasQuota}
                      onClick={() => setForm((prev) => ({ ...prev, hasQuota: !prev.hasQuota }))}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        form.hasQuota ? "bg-emerald-500" : "bg-slate-400/60 dark:bg-slate-600"
                      }`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                          form.hasQuota ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">{t.note}</label>
                    <textarea
                      value={form.note}
                      onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                      rows={4}
                      className="input-field resize-none"
                      placeholder={t.accountNotePlaceholder}
                    />
                  </div>

                  {submitError && (
                    <p className="rounded-2xl border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                      {submitError}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)]/70 pt-4">
                    <button type="button" onClick={resetForm} className="btn-secondary">
                      {t.cancelEdit}
                    </button>
                    <button type="submit" disabled={saving} className="btn-primary min-w-[132px] disabled:opacity-50">
                      {saving ? "..." : editingAccount ? t.saveAccountChanges : t.saveAccount}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showSecurityModal}
        onClose={() => {
          setShowSecurityModal(false);
          setSecurityError("");
          setCurrentSecondaryPassword("");
          setNewSecondaryPassword("");
        }}
        title={securityStatus.isSet ? t.updateSecondaryPassword : t.setupSecondaryPassword}
      >
        <form onSubmit={submitSecondaryPassword} className="space-y-4">
          {securityStatus.isSet && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">{t.currentSecondaryPassword}</label>
              <input
                type="password"
                value={currentSecondaryPassword}
                onChange={(e) => setCurrentSecondaryPassword(e.target.value)}
                className="input-field"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">{t.newSecondaryPassword}</label>
            <input
              type="password"
              value={newSecondaryPassword}
              onChange={(e) => setNewSecondaryPassword(e.target.value)}
              className="input-field"
            />
          </div>
          {securityError && (
            <p className="rounded-2xl border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
              {securityError}
            </p>
          )}
          <div className="flex justify-end">
            <button type="submit" className="btn-primary min-w-[170px]">
              {t.saveSecondaryPassword}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showRevealModal}
        onClose={() => {
          setShowRevealModal(false);
          setRevealTarget(null);
          setSecondaryPassword("");
          setSecurityError("");
          setRevealedPassword("");
        }}
        title={t.viewPassword}
      >
        <form onSubmit={submitRevealPassword} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">{t.secondaryPasswordLabel}</label>
            <input
              type="password"
              value={secondaryPassword}
              onChange={(e) => setSecondaryPassword(e.target.value)}
              className="input-field"
            />
          </div>
          {revealedPassword && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">{t.accountPasswordLabel}</label>
              <input type="text" value={revealedPassword} readOnly className="input-field font-mono" />
            </div>
          )}
          {securityError && (
            <p className="rounded-2xl border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
              {securityError}
            </p>
          )}
          <div className="flex justify-end">
            <button type="submit" className="btn-primary min-w-[170px]">
              {revealedPassword ? t.refreshPasswordView : t.unlockPassword}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteTarget(null)}
        title={t.confirmDeleteTitle}
        message={t.confirmDeleteAccountMessage}
      />
    </>
  );
}

function StatusBadge({ site }: { site: Site }) {
  const { t } = useI18n();

  switch (site.status) {
    case "archived":
      return <Badge variant="gray" label={t.archivedStatus} />;
    case "empty_quota":
      return <Badge variant="amber" label={t.emptyQuotaStatus} />;
    default:
      return <Badge variant="green" label={t.activeStatus} />;
  }
}

function toErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}
