import { useCallback, useEffect, useRef, useState } from "react";
import { useSites } from "./hooks/useSites";
import { useI18n } from "./i18n";
import { AppLog, CreateSiteInput, Site, UpdateInfo, UpdateSiteInput } from "./types";
import { CheckForUpdate, DownloadAndInstallUpdate } from "../wailsjs/go/main/App";
import ConfirmDialog from "./components/ConfirmDialog";
import FilterBar from "./components/FilterBar";
import LogViewer from "./components/LogViewer";
import SiteAccountManager from "./components/SiteAccountManager";
import SiteForm from "./components/SiteForm";
import SiteTable from "./components/SiteTable";
import TagManager from "./components/TagManager";
import UpdateDialog from "./components/UpdateDialog";

function getErrorMessage(err: unknown) {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

function App() {
  const { t, toggleLocale } = useI18n();
  const {
    sites,
    tags,
    filter,
    loading,
    securityStatus,
    createSite,
    updateSite,
    deleteSite,
    setSiteArchived,
    createTag,
    deleteTag,
    loadSiteAccounts,
    createSiteAccount,
    updateSiteAccount,
    deleteSiteAccount,
    setSecondaryPassword,
    revealSiteAccountPassword,
    openSiteUrl,
    listLogs,
    setFilter,
  } = useSites();

  const [showSiteForm, setShowSiteForm] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showAccountManager, setShowAccountManager] = useState(false);
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [accountSite, setAccountSite] = useState<Site | null>(null);
  const [deletingSiteId, setDeletingSiteId] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("llm-station-hub-theme") === "dark");
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateInstalling, setUpdateInstalling] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const autoUpdateChecked = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("llm-station-hub-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (!accountSite) {
      return;
    }
    const refreshed = sites.find((site) => site.id === accountSite.id);
    if (refreshed) {
      setAccountSite(refreshed);
    }
  }, [sites, accountSite]);

  const handleEdit = (site: Site) => {
    setEditingSite(site);
    setShowSiteForm(true);
  };

  const handleDelete = (id: number) => {
    setDeletingSiteId(id);
  };

  const handleOpenSite = async (site: Site) => {
    try {
      await openSiteUrl(site.url);
    } catch (err) {
      console.error("Failed to open site:", err);
    }
  };

  const handleManageAccounts = (site: Site) => {
    setAccountSite(site);
    setShowAccountManager(true);
  };

  const handleFormSubmit = async (data: CreateSiteInput | UpdateSiteInput) => {
    if (editingSite) {
      await updateSite(editingSite.id, data as UpdateSiteInput);
    } else {
      await createSite(data as CreateSiteInput);
    }
  };

  const handleFormClose = () => {
    setShowSiteForm(false);
    setEditingSite(null);
  };

  const handleConfirmDelete = async () => {
    if (deletingSiteId === null) {
      return;
    }
    await deleteSite(deletingSiteId);
    setDeletingSiteId(null);
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const result = await listLogs();
      setLogs(result);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleOpenLogs = () => {
    setShowLogs(true);
    loadLogs().catch(console.error);
  };

  const handleCheckUpdate = useCallback(async (openDialog = true) => {
    setUpdateLoading(true);
    setUpdateError("");
    if (openDialog) {
      setShowUpdateDialog(true);
    }
    try {
      const result = await CheckForUpdate();
      const nextInfo = result as unknown as UpdateInfo;
      setUpdateInfo(nextInfo);
      if (nextInfo.hasUpdate) {
        setShowUpdateDialog(true);
      }
      return nextInfo;
    } catch (err) {
      const message = getErrorMessage(err);
      setUpdateError(message);
      if (openDialog) {
        setShowUpdateDialog(true);
      }
      console.error("Failed to check for updates:", err);
      return null;
    } finally {
      setUpdateLoading(false);
    }
  }, []);

  const handleInstallUpdate = useCallback(async () => {
    setUpdateInstalling(true);
    setUpdateError("");
    try {
      await DownloadAndInstallUpdate();
    } catch (err) {
      setUpdateError(getErrorMessage(err));
      setUpdateInstalling(false);
      console.error("Failed to install update:", err);
    }
  }, []);

  useEffect(() => {
    if (autoUpdateChecked.current) {
      return;
    }
    autoUpdateChecked.current = true;
    handleCheckUpdate(false).catch(() => {});
  }, [handleCheckUpdate]);

  return (
    <div className="relative min-h-screen overflow-hidden text-[var(--color-foreground)]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-6%] top-[-10%] h-[260px] w-[260px] rounded-full bg-sky-400/14 blur-3xl dark:bg-sky-500/14" />
        <div className="absolute right-[-8%] top-[8%] h-[220px] w-[220px] rounded-full bg-cyan-300/12 blur-3xl dark:bg-cyan-300/10" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 pb-8 pt-4 md:px-6">
        <header className="card mb-5 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="glass-panel flex h-14 w-14 items-center justify-center rounded-2xl">
                <svg className="h-7 w-7 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-2xl font-semibold tracking-tight">{t.appName}</p>
                  <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Glass Workspace
                  </span>
                </div>
                <p className="max-w-2xl text-sm text-[var(--color-muted)]">{t.appSubtitle}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  handleCheckUpdate(true).catch(console.error);
                }}
                className={updateInfo?.hasUpdate ? "btn-primary" : "btn-secondary"}
                aria-label={t.checkUpdates}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M5.5 9A7.5 7.5 0 0118 6.5M18.5 15A7.5 7.5 0 016 17.5" />
                </svg>
                {updateInfo?.hasUpdate ? t.updateAvailableShort : t.checkUpdates}
              </button>
              <button onClick={handleOpenLogs} className="btn-secondary">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M8 4h8l4 4v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2z" />
                </svg>
                {t.logs}
              </button>
              <button onClick={toggleLocale} className="btn-secondary" aria-label="Toggle language">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                {t.language}
              </button>
              <button onClick={() => setDarkMode((prev) => !prev)} className="btn-secondary" aria-label="Toggle dark mode">
                {darkMode ? (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {t.lightMode}
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    {t.darkMode}
                  </>
                )}
              </button>
              <button onClick={() => setShowTagManager(true)} className="btn-secondary">
                {t.tagManager}
              </button>
              <button
                onClick={() => {
                  setEditingSite(null);
                  setShowSiteForm(true);
                }}
                className="btn-primary"
              >
                {t.addSite}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-5">
          <FilterBar filter={filter} tags={tags} onFilterChange={setFilter} />

          {loading ? (
            <div className="card flex min-h-[320px] items-center justify-center">
              <div className="glass-panel flex h-14 w-14 items-center justify-center rounded-full">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
              </div>
            </div>
          ) : (
            <SiteTable
              sites={sites}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onOpen={handleOpenSite}
              onManageAccounts={handleManageAccounts}
              onSetArchived={(site, archived) => {
                void setSiteArchived(site.id, archived).catch((err) => {
                  console.error("Failed to update archive status:", err);
                });
              }}
            />
          )}
        </main>
      </div>

      <SiteForm
        isOpen={showSiteForm}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        tags={tags}
        editingSite={editingSite}
        onCreateTag={createTag}
      />

      <SiteAccountManager
        isOpen={showAccountManager}
        site={accountSite}
        securityStatus={securityStatus}
        onClose={() => {
          setShowAccountManager(false);
          setAccountSite(null);
        }}
        onLoadAccounts={loadSiteAccounts}
        onCreateAccount={createSiteAccount}
        onUpdateAccount={updateSiteAccount}
        onDeleteAccount={deleteSiteAccount}
        onRevealPassword={revealSiteAccountPassword}
        onSetSecondaryPassword={setSecondaryPassword}
        onSetSiteArchived={setSiteArchived}
      />

      <TagManager
        isOpen={showTagManager}
        onClose={() => setShowTagManager(false)}
        tags={tags}
        onCreateTag={createTag}
        onDeleteTag={deleteTag}
      />

      <LogViewer
        isOpen={showLogs}
        logs={logs}
        loading={logsLoading}
        onClose={() => setShowLogs(false)}
        onRefresh={() => {
          loadLogs().catch(console.error);
        }}
      />

      <UpdateDialog
        isOpen={showUpdateDialog}
        updateInfo={updateInfo}
        loading={updateLoading}
        installing={updateInstalling}
        error={updateError}
        onCheck={() => {
          handleCheckUpdate(true).catch(console.error);
        }}
        onInstall={handleInstallUpdate}
        onClose={() => setShowUpdateDialog(false)}
      />

      <ConfirmDialog
        isOpen={deletingSiteId !== null}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingSiteId(null)}
        title={t.confirmDeleteTitle}
        message={t.confirmDeleteMessage}
      />
    </div>
  );
}

export default App;
