export namespace auth {
	
	export class MSTokens {
	    accessToken: string;
	    refreshToken: string;
	    // Go type: time
	    expiresAt: any;
	
	    static createFrom(source: any = {}) {
	        return new MSTokens(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.accessToken = source["accessToken"];
	        this.refreshToken = source["refreshToken"];
	        this.expiresAt = this.convertValues(source["expiresAt"], null);
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
	export class Account {
	    uuid: string;
	    username: string;
	    type: string;
	    accessToken: string;
	    msToken?: MSTokens;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    lastUsed: any;
	
	    static createFrom(source: any = {}) {
	        return new Account(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.uuid = source["uuid"];
	        this.username = source["username"];
	        this.type = source["type"];
	        this.accessToken = source["accessToken"];
	        this.msToken = this.convertValues(source["msToken"], MSTokens);
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.lastUsed = this.convertValues(source["lastUsed"], null);
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

}

export namespace download {
	
	export class DownloadTask {
	    id: string;
	    name: string;
	    url: string;
	    destination: string;
	    status: string;
	    progress: number;
	    totalBytes: number;
	    doneBytes: number;
	    speed: number;
	    error?: string;
	    // Go type: time
	    startedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new DownloadTask(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.url = source["url"];
	        this.destination = source["destination"];
	        this.status = source["status"];
	        this.progress = source["progress"];
	        this.totalBytes = source["totalBytes"];
	        this.doneBytes = source["doneBytes"];
	        this.speed = source["speed"];
	        this.error = source["error"];
	        this.startedAt = this.convertValues(source["startedAt"], null);
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

}

export namespace mods {
	
	export class InstalledMod {
	    fileName: string;
	    name: string;
	    version: string;
	    modId: string;
	    source: string;
	    enabled: boolean;
	    iconUrl?: string;
	    // Go type: time
	    installedAt: any;
	    fileSize: number;
	
	    static createFrom(source: any = {}) {
	        return new InstalledMod(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.fileName = source["fileName"];
	        this.name = source["name"];
	        this.version = source["version"];
	        this.modId = source["modId"];
	        this.source = source["source"];
	        this.enabled = source["enabled"];
	        this.iconUrl = source["iconUrl"];
	        this.installedAt = this.convertValues(source["installedAt"], null);
	        this.fileSize = source["fileSize"];
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
	export class ModInfo {
	    id: string;
	    name: string;
	    description: string;
	    author: string;
	    source: string;
	    iconUrl: string;
	    downloads: number;
	    categories: string[];
	    gameVersions: string[];
	    modLoaders: string[];
	    // Go type: time
	    updatedAt: any;
	    isModpack: boolean;
	    slug: string;
	
	    static createFrom(source: any = {}) {
	        return new ModInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.author = source["author"];
	        this.source = source["source"];
	        this.iconUrl = source["iconUrl"];
	        this.downloads = source["downloads"];
	        this.categories = source["categories"];
	        this.gameVersions = source["gameVersions"];
	        this.modLoaders = source["modLoaders"];
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	        this.isModpack = source["isModpack"];
	        this.slug = source["slug"];
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
	export class ModSearchResult {
	    items: ModInfo[];
	    totalCount: number;
	    page: number;
	    pageSize: number;
	
	    static createFrom(source: any = {}) {
	        return new ModSearchResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.items = this.convertValues(source["items"], ModInfo);
	        this.totalCount = source["totalCount"];
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
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
	export class ModVersion {
	    id: string;
	    modId: string;
	    name: string;
	    versionNumber: string;
	    gameVersions: string[];
	    modLoaders: string[];
	    downloads: number;
	    // Go type: time
	    publishedAt: any;
	    fileUrl: string;
	    fileName: string;
	    fileSize: number;
	    fileSha1: string;
	    isPrimary: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ModVersion(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.modId = source["modId"];
	        this.name = source["name"];
	        this.versionNumber = source["versionNumber"];
	        this.gameVersions = source["gameVersions"];
	        this.modLoaders = source["modLoaders"];
	        this.downloads = source["downloads"];
	        this.publishedAt = this.convertValues(source["publishedAt"], null);
	        this.fileUrl = source["fileUrl"];
	        this.fileName = source["fileName"];
	        this.fileSize = source["fileSize"];
	        this.fileSha1 = source["fileSha1"];
	        this.isPrimary = source["isPrimary"];
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

}

export namespace profiles {
	
	export class CreateProfileRequest {
	    name: string;
	    icon: string;
	    gameVersion: string;
	    modLoader: string;
	    modLoaderVersion?: string;
	    maxMemoryMB: number;
	    color: string;
	    description?: string;
	
	    static createFrom(source: any = {}) {
	        return new CreateProfileRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.icon = source["icon"];
	        this.gameVersion = source["gameVersion"];
	        this.modLoader = source["modLoader"];
	        this.modLoaderVersion = source["modLoaderVersion"];
	        this.maxMemoryMB = source["maxMemoryMB"];
	        this.color = source["color"];
	        this.description = source["description"];
	    }
	}
	export class Resolution {
	    width: number;
	    height: number;
	
	    static createFrom(source: any = {}) {
	        return new Resolution(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.width = source["width"];
	        this.height = source["height"];
	    }
	}
	export class Profile {
	    id: string;
	    name: string;
	    icon: string;
	    gameVersion: string;
	    modLoader: string;
	    modLoaderVersion?: string;
	    gameDir: string;
	    javaPath?: string;
	    javaArgs: string;
	    maxMemoryMB: number;
	    minMemoryMB: number;
	    resolution?: Resolution;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	    // Go type: time
	    lastPlayed?: any;
	    totalPlayedSecs: number;
	    color: string;
	    description?: string;
	
	    static createFrom(source: any = {}) {
	        return new Profile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.icon = source["icon"];
	        this.gameVersion = source["gameVersion"];
	        this.modLoader = source["modLoader"];
	        this.modLoaderVersion = source["modLoaderVersion"];
	        this.gameDir = source["gameDir"];
	        this.javaPath = source["javaPath"];
	        this.javaArgs = source["javaArgs"];
	        this.maxMemoryMB = source["maxMemoryMB"];
	        this.minMemoryMB = source["minMemoryMB"];
	        this.resolution = this.convertValues(source["resolution"], Resolution);
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	        this.lastPlayed = this.convertValues(source["lastPlayed"], null);
	        this.totalPlayedSecs = source["totalPlayedSecs"];
	        this.color = source["color"];
	        this.description = source["description"];
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
	
	export class UpdateProfileRequest {
	    name?: string;
	    icon?: string;
	    gameVersion?: string;
	    modLoader?: string;
	    modLoaderVersion?: string;
	    javaPath?: string;
	    javaArgs?: string;
	    maxMemoryMB?: number;
	    minMemoryMB?: number;
	    resolution?: Resolution;
	    color?: string;
	    description?: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateProfileRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.icon = source["icon"];
	        this.gameVersion = source["gameVersion"];
	        this.modLoader = source["modLoader"];
	        this.modLoaderVersion = source["modLoaderVersion"];
	        this.javaPath = source["javaPath"];
	        this.javaArgs = source["javaArgs"];
	        this.maxMemoryMB = source["maxMemoryMB"];
	        this.minMemoryMB = source["minMemoryMB"];
	        this.resolution = this.convertValues(source["resolution"], Resolution);
	        this.color = source["color"];
	        this.description = source["description"];
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

}

export namespace versions {
	
	export class AssetIndex {
	    id: string;
	    sha1: string;
	    size: number;
	    totalSize: number;
	    url: string;
	
	    static createFrom(source: any = {}) {
	        return new AssetIndex(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.sha1 = source["sha1"];
	        this.size = source["size"];
	        this.totalSize = source["totalSize"];
	        this.url = source["url"];
	    }
	}
	export class JavaVersionReq {
	    component: string;
	    majorVersion: number;
	
	    static createFrom(source: any = {}) {
	        return new JavaVersionReq(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.component = source["component"];
	        this.majorVersion = source["majorVersion"];
	    }
	}
	export class LibraryExtract {
	    exclude: string[];
	
	    static createFrom(source: any = {}) {
	        return new LibraryExtract(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.exclude = source["exclude"];
	    }
	}
	export class LibraryRule {
	    action: string;
	    os?: Record<string, string>;
	
	    static createFrom(source: any = {}) {
	        return new LibraryRule(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.action = source["action"];
	        this.os = source["os"];
	    }
	}
	export class LibraryArtifact {
	    path: string;
	    sha1: string;
	    size: number;
	    url: string;
	
	    static createFrom(source: any = {}) {
	        return new LibraryArtifact(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.sha1 = source["sha1"];
	        this.size = source["size"];
	        this.url = source["url"];
	    }
	}
	export class LibraryDownloads {
	    artifact?: LibraryArtifact;
	    classifiers?: Record<string, LibraryArtifact>;
	
	    static createFrom(source: any = {}) {
	        return new LibraryDownloads(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.artifact = this.convertValues(source["artifact"], LibraryArtifact);
	        this.classifiers = this.convertValues(source["classifiers"], LibraryArtifact, true);
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
	export class Library {
	    name: string;
	    downloads: LibraryDownloads;
	    rules?: LibraryRule[];
	    natives?: Record<string, string>;
	    extract?: LibraryExtract;
	
	    static createFrom(source: any = {}) {
	        return new Library(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.downloads = this.convertValues(source["downloads"], LibraryDownloads);
	        this.rules = this.convertValues(source["rules"], LibraryRule);
	        this.natives = source["natives"];
	        this.extract = this.convertValues(source["extract"], LibraryExtract);
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
	
	
	
	
	export class VersionArguments {
	    game: any[];
	    jvm: any[];
	
	    static createFrom(source: any = {}) {
	        return new VersionArguments(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.game = source["game"];
	        this.jvm = source["jvm"];
	    }
	}
	export class VersionDownload {
	    sha1: string;
	    size: number;
	    url: string;
	
	    static createFrom(source: any = {}) {
	        return new VersionDownload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.sha1 = source["sha1"];
	        this.size = source["size"];
	        this.url = source["url"];
	    }
	}
	export class VersionDetails {
	    id: string;
	    type: string;
	    mainClass: string;
	    minecraftArguments?: string;
	    arguments?: VersionArguments;
	    assetIndex: AssetIndex;
	    assets: string;
	    downloads: Record<string, VersionDownload>;
	    libraries: Library[];
	    javaVersion?: JavaVersionReq;
	    // Go type: time
	    releaseTime: any;
	
	    static createFrom(source: any = {}) {
	        return new VersionDetails(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.type = source["type"];
	        this.mainClass = source["mainClass"];
	        this.minecraftArguments = source["minecraftArguments"];
	        this.arguments = this.convertValues(source["arguments"], VersionArguments);
	        this.assetIndex = this.convertValues(source["assetIndex"], AssetIndex);
	        this.assets = source["assets"];
	        this.downloads = this.convertValues(source["downloads"], VersionDownload, true);
	        this.libraries = this.convertValues(source["libraries"], Library);
	        this.javaVersion = this.convertValues(source["javaVersion"], JavaVersionReq);
	        this.releaseTime = this.convertValues(source["releaseTime"], null);
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
	
	export class VersionEntry {
	    id: string;
	    type: string;
	    url: string;
	    // Go type: time
	    releaseTime: any;
	
	    static createFrom(source: any = {}) {
	        return new VersionEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.type = source["type"];
	        this.url = source["url"];
	        this.releaseTime = this.convertValues(source["releaseTime"], null);
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
	export class VersionManifest {
	    latest: Record<string, string>;
	    versions: VersionEntry[];
	
	    static createFrom(source: any = {}) {
	        return new VersionManifest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.latest = source["latest"];
	        this.versions = this.convertValues(source["versions"], VersionEntry);
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

}

