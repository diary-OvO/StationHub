export type SiteType = "transit" | "public";
export type SiteStatus = "active" | "empty_quota" | "archived";
export type SiteAccountType = "default" | "lstation";

export interface Tag {
  id: number;
  name: string;
  createdAt: string;
}

export interface Site {
  id: number;
  name: string;
  url: string;
  type: SiteType;
  checkinEnabled: boolean;
  archived: boolean;
  status: SiteStatus;
  note: string;
  accountCount: number;
  quotaAccountCount: number;
  normalAccountCount: number;
  lStationAccountCount: number;
  hasQuotaAccount: boolean;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSiteInput {
  name: string;
  url: string;
  type: SiteType;
  checkinEnabled: boolean;
  note: string;
  tagIds: number[];
}

export interface UpdateSiteInput {
  name: string;
  url: string;
  type: SiteType;
  checkinEnabled: boolean;
  note: string;
  tagIds: number[];
}

export interface SiteFilter {
  keyword: string;
  type: SiteType | "all";
  checkinEnabled: "all" | "true" | "false";
  archived: "all" | "active" | "archived";
  tagIds: number[];
}

export interface SiteAccount {
  id: number;
  siteId: number;
  accountType: SiteAccountType;
  username: string;
  passwordSet: boolean;
  hasQuota: boolean;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSiteAccountInput {
  siteId: number;
  accountType: SiteAccountType;
  username: string;
  password: string;
  hasQuota: boolean;
  note: string;
}

export interface UpdateSiteAccountInput {
  siteId: number;
  accountType: SiteAccountType;
  username: string;
  password: string;
  hasQuota: boolean;
  note: string;
}

export interface SecondaryPasswordStatus {
  isSet: boolean;
}

export interface SetSecondaryPasswordInput {
  currentPassword: string;
  newPassword: string;
}

export type LogLevel = "info" | "error";

export interface AppLog {
  id: number;
  time: string;
  level: LogLevel;
  action: string;
  message: string;
}

export interface AppVersion {
  version: string;
}

export interface AppAboutInfo {
  projectName: string;
  version: string;
  exePath: string;
  releaseUrl: string;
}

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  canInstall: boolean;
  releaseName: string;
  releaseUrl: string;
  publishedAt: string;
  body: string;
  assetName: string;
  assetUrl: string;
  assetSize: number;
  message: string;
}

export interface UpdateInstallResult {
  version: string;
  assetName: string;
  downloadPath: string;
  scriptPath: string;
  sha256: string;
}
