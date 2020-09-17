"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const path = __importStar(require("path"));
const assert_1 = __importDefault(require("assert"));
const deno_1 = require("./deno");
const deno_cache_1 = require("./deno_cache");
const import_map_1 = require("./import_map");
const hash_meta_1 = require("./hash_meta");
const util_1 = require("./util");
const extension_1 = require("./extension");
class ModuleResolver {
    constructor(containingFile, importMapsFile, logger) {
        this.containingFile = containingFile;
        this.importMapsFile = importMapsFile;
        this.logger = logger;
        this.importMaps = import_map_1.ImportMap.create(this.importMapsFile);
        containingFile = util_1.normalizeFilepath(containingFile);
        if (importMapsFile) {
            this.importMapsFile = util_1.normalizeFilepath(importMapsFile);
        }
        assert_1.default(path.isAbsolute(containingFile), `ModuleResolver filepath require absolute but got ${containingFile}`);
        this.denoCacheFile = deno_cache_1.CacheModule.create(this.containingFile);
    }
    static create(containingFile, importMapsFile, logger) {
        return new ModuleResolver(containingFile, importMapsFile, logger);
    }
    resolveFromRemote(httpModuleURL, origin) {
        const url = new url_1.URL(httpModuleURL);
        const originDir = path.join(deno_1.getDenoDepsDir(), url.protocol.replace(/:$/, ""), url.hostname);
        const hash = util_1.hashURL(url);
        const metaFilepath = path.join(originDir, `${hash}.metadata.json`);
        const meta = hash_meta_1.HashMeta.create(metaFilepath);
        if (!meta) {
            return;
        }
        let redirect = meta.headers["location"];
        if (redirect) {
            redirect = util_1.isHttpURL(redirect)
                ? redirect
                : path.posix.isAbsolute(redirect)
                    ? `${url.protocol}//${url.host}${redirect}`
                    :
                        `${url.protocol}//${url.host}${path.posix.resolve(url.pathname, redirect)}`;
            if (!util_1.isHttpURL(redirect) || redirect === httpModuleURL) {
                return;
            }
            return this.resolveFromRemote(redirect, origin);
        }
        const moduleFilepath = path.join(originDir, hash);
        const typescriptTypes = meta.headers["x-typescript-types"];
        if (typescriptTypes) {
            const resolver = ModuleResolver.create(moduleFilepath, this.importMapsFile);
            const [typeModule] = resolver.resolveModules([typescriptTypes]);
            if (typeModule) {
                typeModule.origin = httpModuleURL;
                return typeModule;
            }
        }
        if (!meta.extension) {
            return;
        }
        return {
            origin: origin,
            filepath: moduleFilepath,
            extension: meta.extension,
        };
    }
    resolveFromLocal(moduleName) {
        const originModuleName = moduleName;
        moduleName = this.importMaps.resolveModule(moduleName);
        if (util_1.isHttpURL(moduleName)) {
            return this.resolveFromRemote(moduleName, originModuleName);
        }
        if (moduleName.startsWith("file://")) {
            moduleName = moduleName.replace(/^file:\/\//, "");
        }
        const moduleFilepath = path.resolve(path.dirname(this.containingFile), util_1.normalizeFilepath(moduleName));
        if (!util_1.pathExistsSync(moduleFilepath) ||
            !extension_1.isValidDenoModuleExtension(moduleFilepath)) {
            return;
        }
        return {
            origin: originModuleName,
            filepath: moduleFilepath,
            extension: extension_1.getExtensionFromFile(moduleFilepath),
        };
    }
    resolveModules(moduleNames) {
        var _a;
        const resolvedModules = [];
        for (const moduleName of moduleNames) {
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.info(`resolve module ${moduleName} from ${this.containingFile}`);
            if (this.denoCacheFile) {
                const moduleCacheFile = this.denoCacheFile.resolveModule(moduleName);
                if (moduleCacheFile) {
                    resolvedModules.push({
                        origin: moduleName,
                        filepath: moduleCacheFile.filepath,
                        extension: moduleCacheFile.extension,
                    });
                }
                else {
                    resolvedModules.push(undefined);
                }
                continue;
            }
            if (util_1.isHttpURL(moduleName)) {
                resolvedModules.push(this.resolveFromRemote(moduleName, moduleName));
                continue;
            }
            resolvedModules.push(this.resolveFromLocal(moduleName));
        }
        return resolvedModules;
    }
}
exports.ModuleResolver = ModuleResolver;
//# sourceMappingURL=module_resolver.js.map