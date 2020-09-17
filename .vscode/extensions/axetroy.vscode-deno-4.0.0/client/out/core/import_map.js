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
const fs_1 = require("fs");
const assert_1 = __importDefault(require("assert"));
const util_1 = require("./util");
class ImportMap {
    constructor(map, filepath) {
        this.map = map;
        this.filepath = filepath;
    }
    static create(importMapFilepath) {
        let importMap = {
            imports: {},
        };
        if (importMapFilepath) {
            importMapFilepath = util_1.normalizeFilepath(importMapFilepath);
            assert_1.default(path.isAbsolute(importMapFilepath), `Import-Map filepath require absolute but got ${importMapFilepath}`);
            if (util_1.pathExistsSync(importMapFilepath) === true) {
                const importMapContent = fs_1.readFileSync(importMapFilepath, {
                    encoding: "utf8",
                });
                try {
                    importMap = JSON.parse(importMapContent || "");
                    if (Object.prototype.toString.call(importMap.imports) !==
                        "[object Object]") {
                        importMap.imports = {};
                    }
                }
                catch (_a) {
                    importMap.imports = {};
                }
            }
        }
        const imports = Object.entries(importMap.imports)
            .filter(([key, val]) => (key.endsWith("/") && val.endsWith("/")) ||
            (!key.endsWith("/") && !val.endsWith("/")))
            .sort(([key1], [key2]) => key2.lastIndexOf("/") - key1.lastIndexOf("/"))
            .reduce((imports, [key, value]) => (Object.assign(Object.assign({}, imports), { [key]: value })), {});
        importMap.imports = imports;
        return new ImportMap(importMap, importMapFilepath);
    }
    toJSON() {
        return this.map.imports;
    }
    resolveModule(moduleName) {
        for (const [prefix, mapModule] of this) {
            const reg = new RegExp("^" + util_1.escapeRegExp(prefix));
            if (reg.test(moduleName)) {
                moduleName = moduleName.replace(reg, mapModule);
                if (moduleName.startsWith(".") && this.filepath) {
                    moduleName = path.resolve(path.dirname(this.filepath), util_1.normalizeFilepath(moduleName));
                }
                return moduleName;
            }
        }
        return moduleName;
    }
    [Symbol.iterator]() {
        const keys = Object.keys(this.map.imports);
        let currentIndex = 0;
        return {
            next: () => {
                if (currentIndex === keys.length) {
                    return {
                        value: [],
                        done: true,
                    };
                }
                const key = keys[currentIndex];
                const value = this.map.imports[key];
                currentIndex++;
                return {
                    value: [key, value],
                    done: false,
                };
            },
        };
    }
}
exports.ImportMap = ImportMap;
//# sourceMappingURL=import_map.js.map