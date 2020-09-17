"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const deno_1 = require("./deno");
const deno_cache_1 = require("./deno_cache");
const util_1 = require("./util");
function normalizeImportStatement(filename, importStatement, logger) {
    filename = util_1.normalizeFilepath(filename);
    const regexp = /^import\s(.*)\s*from\s*['"]([^'"]+)['"](.*)$/gim;
    const matcher = regexp.exec(importStatement);
    if (matcher) {
        const importModuleNames = matcher[1].trim();
        const moduleName = matcher[2];
        const moduleFilepath = util_1.normalizeFilepath(moduleName);
        const moduleAbsoluteFilepath = util_1.normalizeFilepath(path.isAbsolute(moduleFilepath)
            ? moduleFilepath
            : path.resolve(path.dirname(filename), moduleFilepath));
        const rest = matcher[3];
        logger === null || logger === void 0 ? void 0 : logger.info(`normalize import \`${importStatement}\` in file \`${filename}\` with module \`${moduleAbsoluteFilepath}\``);
        if (moduleAbsoluteFilepath.startsWith(deno_1.getDenoDepsDir())) {
            const cache = deno_cache_1.CacheModule.create(moduleAbsoluteFilepath);
            if (cache) {
                importStatement = `import ${importModuleNames} from "${cache.meta.url}"${rest ? rest : ""}`;
            }
        }
    }
    return importStatement;
}
exports.normalizeImportStatement = normalizeImportStatement;
//# sourceMappingURL=deno_normalize_import_statement.js.map