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
const path = __importStar(require("path"));
const url_1 = require("url");
const assert_1 = __importDefault(require("assert"));
const deno_1 = require("./deno");
const hash_meta_1 = require("./hash_meta");
const util_1 = require("./util");
class CacheModule {
    constructor(filepath, meta, extension, logger) {
        this.filepath = filepath;
        this.meta = meta;
        this.extension = extension;
        this.logger = logger;
        filepath = util_1.normalizeFilepath(filepath);
        assert_1.default(path.isAbsolute(filepath), `Deno Module filepath require absolute but got ${filepath}`);
    }
    static create(filepath, logger) {
        filepath = util_1.normalizeFilepath(filepath);
        if (!util_1.pathExistsSync(filepath)) {
            return;
        }
        const DENO_DEPS_DIR = deno_1.getDenoDepsDir();
        if (filepath.indexOf(DENO_DEPS_DIR) !== 0) {
            return;
        }
        const hash = path.basename(filepath);
        const originDir = path.dirname(filepath);
        const metaFilepath = path.join(originDir, `${hash}.metadata.json`);
        const meta = hash_meta_1.HashMeta.create(metaFilepath);
        if (!meta) {
            return;
        }
        return new CacheModule(filepath, meta, meta.extension, logger);
    }
    tryRedirect(meta) {
        const redirect = meta.headers["location"];
        if (redirect) {
            let redirectUrl;
            if (util_1.isHttpURL(redirect)) {
                redirectUrl = redirect;
            }
            else if (redirect.startsWith("/")) {
                redirectUrl = `${meta.url.protocol}//${meta.url.host}${redirect}`;
            }
            else if (redirect.startsWith("./") || redirect.startsWith("../")) {
                redirectUrl = `${meta.url.protocol}//${meta.url.host}${path.posix.resolve(meta.url.pathname, redirect)}`;
            }
            else {
                return;
            }
            if (redirectUrl === meta.url.href) {
                return null;
            }
            return this.resolveModule(redirectUrl);
        }
    }
    tryResolveXTypescriptTypes(meta) {
        const typescriptTypes = meta.headers["x-typescript-types"];
        if (typescriptTypes) {
            return this.resolveModule(typescriptTypes);
        }
    }
    resolveModule(moduleName) {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.info(`resolve module ${moduleName} from ${this.meta.url}`);
        let url;
        let targetOriginDir = path.dirname(this.filepath);
        if (moduleName.startsWith("/")) {
            url = new url_1.URL(this.meta.url.origin + moduleName);
            targetOriginDir = path.dirname(this.filepath);
        }
        else if (moduleName.startsWith("./") || moduleName.startsWith("../")) {
            const targetUrlPath = path.posix.resolve(path.posix.dirname(this.meta.url.pathname), moduleName);
            url = new url_1.URL(this.meta.url.origin + targetUrlPath);
            targetOriginDir = path.dirname(this.filepath);
        }
        else if (util_1.isHttpURL(moduleName)) {
            url = new url_1.URL(moduleName);
            targetOriginDir = path.join(deno_1.getDenoDepsDir(), url.protocol.replace(/:$/, ""), url.hostname);
        }
        else {
            return;
        }
        const hash = util_1.hashURL(url);
        const moduleCacheFilepath = path.join(targetOriginDir, hash);
        if (!util_1.pathExistsSync(moduleCacheFilepath)) {
            return;
        }
        const moduleMetaFilepath = moduleCacheFilepath + ".metadata.json";
        const meta = hash_meta_1.HashMeta.create(moduleMetaFilepath);
        if (!meta) {
            return;
        }
        const redirectCache = this.tryRedirect(meta);
        if (redirectCache) {
            return redirectCache;
        }
        else if (redirectCache === null) {
            return;
        }
        const typeCache = this.tryResolveXTypescriptTypes(meta);
        if (typeCache) {
            return typeCache;
        }
        return CacheModule.create(moduleCacheFilepath, this.logger);
    }
}
exports.CacheModule = CacheModule;
//# sourceMappingURL=deno_cache.js.map