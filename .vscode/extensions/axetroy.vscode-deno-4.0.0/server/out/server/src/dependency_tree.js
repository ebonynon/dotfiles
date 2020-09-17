"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path = __importStar(require("path"));
const ts = __importStar(require("typescript"));
const vscode_uri_1 = require("vscode-uri");
const deno_deps_1 = require("../../core/deno_deps");
const file_walker_1 = require("../../core/file_walker");
const import_map_1 = require("../../core/import_map");
const util_1 = require("../../core/util");
const const_1 = require("../../core/const");
class DependencyTree {
    constructor(connection, bridge) {
        this.bridge = bridge;
        connection.onRequest(const_1.Request.analysisDependency, this.getDependencyTreeOfProject.bind(this));
    }
    async getDependencyTreeOfProject(uriStr) {
        var e_1, _a;
        const folderUir = vscode_uri_1.URI.parse(uriStr);
        const folder = folderUir.fsPath;
        const depsMap = new Map();
        const config = await this.bridge.getWorkspaceConfig(uriStr);
        const importMapFilepath = config.import_map
            ? path.isAbsolute(config.import_map)
                ? config.import_map
                : path.resolve(folder, config.import_map)
            : undefined;
        const importMap = import_map_1.ImportMap.create(importMapFilepath);
        const walker = file_walker_1.FileWalker.create(folder, {
            exclude: ["node_modules", "bower_components", "vendor", /^\./],
            include: [/\.tsx?$/, /\.jsx?$/, /\.json$/],
        });
        try {
            for (var walker_1 = __asyncValues(walker), walker_1_1; walker_1_1 = await walker_1.next(), !walker_1_1.done;) {
                const filepath = walker_1_1.value;
                const sourceFile = ts.createSourceFile(filepath, await fs_1.promises.readFile(filepath, { encoding: "utf8" }), ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
                const deps = deno_deps_1.getImportModules(ts)(sourceFile);
                for (const dep of deps) {
                    if (!util_1.isHttpURL(dep.moduleName)) {
                        dep.moduleName = importMap.resolveModule(dep.moduleName);
                    }
                    if (util_1.isHttpURL(dep.moduleName)) {
                        const url = dep.moduleName;
                        const arr = depsMap.get(url) || [];
                        arr.push({ filepath, location: dep.location });
                        depsMap.set(url, arr);
                    }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (walker_1_1 && !walker_1_1.done && (_a = walker_1.return)) await _a.call(walker_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        const result = {};
        for (const [url, files] of depsMap.entries()) {
            result[url] = files;
        }
        return result;
    }
}
exports.DependencyTree = DependencyTree;
//# sourceMappingURL=dependency_tree.js.map