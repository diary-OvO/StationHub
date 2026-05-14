import { useCallback, useEffect, useState } from "react";
import {
  AppLog,
  CreateSiteAccountInput,
  CreateSiteInput,
  SecondaryPasswordStatus,
  SetSecondaryPasswordInput,
  Site,
  SiteAccount,
  SiteFilter,
  Tag,
  UpdateSiteAccountInput,
  UpdateSiteInput,
} from "../types";
import {
  CreateSite,
  CreateSiteAccount,
  CreateTag,
  DeleteSite,
  DeleteSiteAccount,
  DeleteTag,
  GetSecondaryPasswordStatus,
  ListLogs,
  ListSiteAccounts,
  ListSites,
  ListTags,
  OpenSiteURL,
  RevealSiteAccountPassword,
  SetSecondaryPassword,
  SetSiteArchived,
  UpdateSite,
  UpdateSiteAccount,
} from "../../wailsjs/go/main/App";

const defaultFilter: SiteFilter = {
  keyword: "",
  type: "all",
  checkinEnabled: "all",
  archived: "all",
  tagIds: [],
};

export function useSites() {
  const [sites, setSites] = useState<Site[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [filter, setFilterState] = useState<SiteFilter>(defaultFilter);
  const [loading, setLoading] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<SecondaryPasswordStatus>({ isSet: false });

  const loadSites = useCallback(async (currentFilter?: SiteFilter) => {
    setLoading(true);
    try {
      const result = await ListSites(currentFilter ?? filter);
      setSites(result as unknown as Site[]);
    } catch (err) {
      console.error("Failed to load sites:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const loadTags = useCallback(async () => {
    try {
      const result = await ListTags();
      setTags(result);
    } catch (err) {
      console.error("Failed to load tags:", err);
      throw err;
    }
  }, []);

  const loadSecurityStatus = useCallback(async () => {
    try {
      const result = await GetSecondaryPasswordStatus();
      setSecurityStatus(result);
      return result as SecondaryPasswordStatus;
    } catch (err) {
      console.error("Failed to load secondary password status:", err);
      throw err;
    }
  }, []);

  const createSite = useCallback(async (input: CreateSiteInput) => {
    try {
      await CreateSite(input);
      await loadSites();
    } catch (err) {
      console.error("Failed to create site:", err);
      throw err;
    }
  }, [loadSites]);

  const updateSite = useCallback(async (id: number, input: UpdateSiteInput) => {
    try {
      await UpdateSite(id, input);
      await loadSites();
    } catch (err) {
      console.error("Failed to update site:", err);
      throw err;
    }
  }, [loadSites]);

  const deleteSite = useCallback(async (id: number) => {
    try {
      await DeleteSite(id);
      await loadSites();
    } catch (err) {
      console.error("Failed to delete site:", err);
      throw err;
    }
  }, [loadSites]);

  const setSiteArchived = useCallback(async (id: number, archived: boolean) => {
    try {
      await SetSiteArchived(id, archived);
      await loadSites();
    } catch (err) {
      console.error("Failed to update site archive status:", err);
      throw err;
    }
  }, [loadSites]);

  const createTag = useCallback(async (name: string) => {
    try {
      await CreateTag(name);
      await loadTags();
    } catch (err) {
      console.error("Failed to create tag:", err);
      throw err;
    }
  }, [loadTags]);

  const deleteTag = useCallback(async (id: number) => {
    try {
      await DeleteTag(id);
      await loadTags();
    } catch (err) {
      console.error("Failed to delete tag:", err);
      throw err;
    }
  }, [loadTags]);

  const loadSiteAccounts = useCallback(async (siteId: number) => {
    try {
      const result = await ListSiteAccounts(siteId);
      return result as unknown as SiteAccount[];
    } catch (err) {
      console.error("Failed to load site accounts:", err);
      throw err;
    }
  }, []);

  const createSiteAccount = useCallback(async (input: CreateSiteAccountInput) => {
    try {
      const result = await CreateSiteAccount(input);
      await loadSites();
      return result as unknown as SiteAccount;
    } catch (err) {
      console.error("Failed to create site account:", err);
      throw err;
    }
  }, [loadSites]);

  const updateSiteAccount = useCallback(async (id: number, input: UpdateSiteAccountInput) => {
    try {
      const result = await UpdateSiteAccount(id, input);
      await loadSites();
      return result as unknown as SiteAccount;
    } catch (err) {
      console.error("Failed to update site account:", err);
      throw err;
    }
  }, [loadSites]);

  const deleteSiteAccount = useCallback(async (id: number) => {
    try {
      await DeleteSiteAccount(id);
      await loadSites();
    } catch (err) {
      console.error("Failed to delete site account:", err);
      throw err;
    }
  }, [loadSites]);

  const setSecondaryPassword = useCallback(async (input: SetSecondaryPasswordInput) => {
    try {
      await SetSecondaryPassword(input);
      return await loadSecurityStatus();
    } catch (err) {
      console.error("Failed to set secondary password:", err);
      throw err;
    }
  }, [loadSecurityStatus]);

  const revealSiteAccountPassword = useCallback(async (accountId: number, secondaryPassword: string) => {
    try {
      return await RevealSiteAccountPassword(accountId, secondaryPassword);
    } catch (err) {
      console.error("Failed to reveal site account password:", err);
      throw err;
    }
  }, []);

  const openSiteUrl = useCallback(async (url: string) => {
    try {
      await OpenSiteURL(url);
    } catch (err) {
      console.error("Failed to open site URL:", err);
      throw err;
    }
  }, []);

  const listLogs = useCallback(async () => {
    try {
      const result = await ListLogs();
      return result as unknown as AppLog[];
    } catch (err) {
      console.error("Failed to load logs:", err);
      throw err;
    }
  }, []);

  const setFilter = useCallback((partial: Partial<SiteFilter>) => {
    setFilterState((prev) => ({ ...prev, ...partial }));
  }, []);

  useEffect(() => {
    loadSites().catch(() => {});
    loadTags().catch(() => {});
    loadSecurityStatus().catch(() => {});
  }, [loadSites, loadTags, loadSecurityStatus]);

  useEffect(() => {
    loadSites(filter).catch(() => {});
  }, [filter, loadSites]);

  return {
    sites,
    tags,
    filter,
    loading,
    securityStatus,
    loadSites,
    loadTags,
    loadSiteAccounts,
    loadSecurityStatus,
    createSite,
    updateSite,
    deleteSite,
    setSiteArchived,
    createTag,
    deleteTag,
    createSiteAccount,
    updateSiteAccount,
    deleteSiteAccount,
    setSecondaryPassword,
    revealSiteAccountPassword,
    openSiteUrl,
    listLogs,
    setFilter,
  };
}
