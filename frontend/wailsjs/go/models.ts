export namespace model {
	
	export class AppLog {
	    id: number;
	    time: string;
	    level: string;
	    action: string;
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new AppLog(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.time = source["time"];
	        this.level = source["level"];
	        this.action = source["action"];
	        this.message = source["message"];
	    }
	}
	export class AppVersion {
	    version: string;
	
	    static createFrom(source: any = {}) {
	        return new AppVersion(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.version = source["version"];
	    }
	}
	export class CreateSiteAccountInput {
	    siteId: number;
	    accountType: string;
	    username: string;
	    password: string;
	    hasQuota: boolean;
	    note: string;
	
	    static createFrom(source: any = {}) {
	        return new CreateSiteAccountInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.siteId = source["siteId"];
	        this.accountType = source["accountType"];
	        this.username = source["username"];
	        this.password = source["password"];
	        this.hasQuota = source["hasQuota"];
	        this.note = source["note"];
	    }
	}
	export class CreateSiteInput {
	    name: string;
	    url: string;
	    type: string;
	    checkinEnabled: boolean;
	    note: string;
	    tagIds: number[];
	
	    static createFrom(source: any = {}) {
	        return new CreateSiteInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.url = source["url"];
	        this.type = source["type"];
	        this.checkinEnabled = source["checkinEnabled"];
	        this.note = source["note"];
	        this.tagIds = source["tagIds"];
	    }
	}
	export class SecondaryPasswordStatus {
	    isSet: boolean;
	
	    static createFrom(source: any = {}) {
	        return new SecondaryPasswordStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.isSet = source["isSet"];
	    }
	}
	export class SetSecondaryPasswordInput {
	    currentPassword: string;
	    newPassword: string;
	
	    static createFrom(source: any = {}) {
	        return new SetSecondaryPasswordInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.currentPassword = source["currentPassword"];
	        this.newPassword = source["newPassword"];
	    }
	}
	export class SiteAccountView {
	    id: number;
	    siteId: number;
	    accountType: string;
	    username: string;
	    passwordSet: boolean;
	    hasQuota: boolean;
	    note: string;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new SiteAccountView(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.siteId = source["siteId"];
	        this.accountType = source["accountType"];
	        this.username = source["username"];
	        this.passwordSet = source["passwordSet"];
	        this.hasQuota = source["hasQuota"];
	        this.note = source["note"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class SiteFilter {
	    keyword: string;
	    type: string;
	    checkinEnabled: string;
	    archived: string;
	    tagIds: number[];
	
	    static createFrom(source: any = {}) {
	        return new SiteFilter(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.keyword = source["keyword"];
	        this.type = source["type"];
	        this.checkinEnabled = source["checkinEnabled"];
	        this.archived = source["archived"];
	        this.tagIds = source["tagIds"];
	    }
	}
	export class Tag {
	    id: number;
	    name: string;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new Tag(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class SiteView {
	    id: number;
	    name: string;
	    url: string;
	    type: string;
	    checkinEnabled: boolean;
	    archived: boolean;
	    status: string;
	    note: string;
	    accountCount: number;
	    quotaAccountCount: number;
	    normalAccountCount: number;
	    lStationAccountCount: number;
	    hasQuotaAccount: boolean;
	    tags: Tag[];
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new SiteView(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.url = source["url"];
	        this.type = source["type"];
	        this.checkinEnabled = source["checkinEnabled"];
	        this.archived = source["archived"];
	        this.status = source["status"];
	        this.note = source["note"];
	        this.accountCount = source["accountCount"];
	        this.quotaAccountCount = source["quotaAccountCount"];
	        this.normalAccountCount = source["normalAccountCount"];
	        this.lStationAccountCount = source["lStationAccountCount"];
	        this.hasQuotaAccount = source["hasQuotaAccount"];
	        this.tags = this.convertValues(source["tags"], Tag);
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class UpdateInfo {
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
	
	    static createFrom(source: any = {}) {
	        return new UpdateInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.currentVersion = source["currentVersion"];
	        this.latestVersion = source["latestVersion"];
	        this.hasUpdate = source["hasUpdate"];
	        this.canInstall = source["canInstall"];
	        this.releaseName = source["releaseName"];
	        this.releaseUrl = source["releaseUrl"];
	        this.publishedAt = source["publishedAt"];
	        this.body = source["body"];
	        this.assetName = source["assetName"];
	        this.assetUrl = source["assetUrl"];
	        this.assetSize = source["assetSize"];
	        this.message = source["message"];
	    }
	}
	export class UpdateInstallResult {
	    version: string;
	    assetName: string;
	    downloadPath: string;
	    scriptPath: string;
	    sha256: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateInstallResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.version = source["version"];
	        this.assetName = source["assetName"];
	        this.downloadPath = source["downloadPath"];
	        this.scriptPath = source["scriptPath"];
	        this.sha256 = source["sha256"];
	    }
	}
	export class UpdateSiteAccountInput {
	    siteId: number;
	    accountType: string;
	    username: string;
	    password: string;
	    hasQuota: boolean;
	    note: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateSiteAccountInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.siteId = source["siteId"];
	        this.accountType = source["accountType"];
	        this.username = source["username"];
	        this.password = source["password"];
	        this.hasQuota = source["hasQuota"];
	        this.note = source["note"];
	    }
	}
	export class UpdateSiteInput {
	    name: string;
	    url: string;
	    type: string;
	    checkinEnabled: boolean;
	    note: string;
	    tagIds: number[];
	
	    static createFrom(source: any = {}) {
	        return new UpdateSiteInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.url = source["url"];
	        this.type = source["type"];
	        this.checkinEnabled = source["checkinEnabled"];
	        this.note = source["note"];
	        this.tagIds = source["tagIds"];
	    }
	}

}

