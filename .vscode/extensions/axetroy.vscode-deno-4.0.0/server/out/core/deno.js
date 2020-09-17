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
const util_1 = require("./util");
function getDenoDir() {
    let denoDir = process.env.DENO_DIR;
    if (denoDir === undefined) {
        switch (process.platform) {
            case "win32":
                denoDir = `${process.env.LOCALAPPDATA}\\deno`;
                break;
            case "darwin":
                denoDir = `${process.env.HOME}/Library/Caches/deno`;
                break;
            case "linux":
                denoDir = process.env.XDG_CACHE_HOME
                    ? `${process.env.XDG_CACHE_HOME}/deno`
                    : `${process.env.HOME}/.cache/deno`;
                break;
            default:
                denoDir = `${process.env.HOME}/.deno`;
        }
    }
    return denoDir;
}
exports.getDenoDir = getDenoDir;
function getDenoDepsDir() {
    return path.join(getDenoDir(), "deps");
}
exports.getDenoDepsDir = getDenoDepsDir;
function getDenoDts(unstable) {
    return path.join(getDenoDir(), unstable ? "lib.deno.unstable.d.ts" : "lib.deno.d.ts");
}
exports.getDenoDts = getDenoDts;
function isInDeno(filepath) {
    filepath = util_1.normalizeFilepath(filepath);
    const denoDir = getDenoDir();
    return filepath.startsWith(denoDir);
}
exports.isInDeno = isInDeno;
function ConvertURL2Filepath(url) {
    return path.join(getDenoDepsDir(), url.protocol.replace(/:$/, ""), url.hostname, util_1.hashURL(url));
}
exports.ConvertURL2Filepath = ConvertURL2Filepath;
//# sourceMappingURL=deno.js.map