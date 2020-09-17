"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const util_1 = require("./util");
var Type;
(function (Type) {
    Type["JavaScript"] = "javascript";
    Type["JavaScriptReact"] = "javascriptreact";
    Type["TypeScript"] = "typescript";
    Type["TypeScriptReact"] = "typescriptreact";
    Type["WebAssembly"] = "WebAssembly";
    Type["PlainText"] = "plaintext";
})(Type = exports.Type || (exports.Type = {}));
const extNameMap = {
    ".ts": Type.TypeScript,
    ".tsx": Type.TypeScriptReact,
    ".js": Type.JavaScript,
    ".jsx": Type.JavaScriptReact,
    ".mjs": Type.JavaScript,
    ".wasm": Type.WebAssembly,
};
const contentTypeMap = [
    [
        ["text/typescript", "application/typescript", "application/x-typescript"],
        Type.TypeScript,
    ],
    [
        [
            "text/javascript",
            "application/javascript",
            "application/x-javascript",
            "text/ecmascript",
            "application/ecmascript",
            "text/jscript",
        ],
        Type.JavaScript,
    ],
    [["application/wasm"], Type.WebAssembly],
];
class HashMeta {
    constructor(filepath, url, headers) {
        this.filepath = filepath;
        this.url = url;
        this.headers = headers;
    }
    static create(metaFilepath) {
        metaFilepath = util_1.normalizeFilepath(metaFilepath);
        if (!util_1.pathExistsSync(metaFilepath)) {
            return;
        }
        const metaMap = JSON.parse(fs.readFileSync(metaFilepath, { encoding: "utf8" }));
        if (!metaMap.url || !metaMap.headers) {
            return;
        }
        return new HashMeta(metaFilepath, new URL(metaMap.url), metaMap.headers);
    }
    get type() {
        const extname = path.posix.extname(this.url.pathname);
        if (extname && extNameMap[extname]) {
            return extNameMap[extname];
        }
        const contentType = (this.headers["content-type"] || "").toLowerCase();
        if (contentType) {
            for (const [contentTypes, type] of contentTypeMap) {
                const arr = contentType.split(";");
                for (const _contentType of arr) {
                    if (contentTypes.includes(_contentType.toLowerCase())) {
                        return type;
                    }
                }
            }
        }
        return Type.PlainText;
    }
    get extension() {
        const type = this.type;
        switch (type) {
            case Type.JavaScript:
                return ".js";
            case Type.JavaScriptReact:
                return ".jsx";
            case Type.TypeScript:
                if (this.url.pathname.endsWith(".d.ts")) {
                    return ".d.ts";
                }
                return ".ts";
            case Type.TypeScriptReact:
                return ".tsx";
            case Type.WebAssembly:
                return ".wasm";
        }
        return "";
    }
    get destinationFilepath() {
        return this.filepath.replace(/\.metadata\.json$/, "");
    }
}
exports.HashMeta = HashMeta;
//# sourceMappingURL=hash_meta.js.map