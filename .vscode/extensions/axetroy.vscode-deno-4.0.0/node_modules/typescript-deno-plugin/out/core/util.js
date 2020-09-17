"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
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
const crypto_1 = __importDefault(require("crypto"));
const path = __importStar(require("path"));
function pathExistsSync(filepath) {
    try {
        fs_1.statSync(filepath);
        return true;
    }
    catch (err) {
        return false;
    }
}
exports.pathExistsSync = pathExistsSync;
async function pathExists(filepath) {
    try {
        await fs_1.promises.stat(filepath);
        return true;
    }
    catch (err) {
        return false;
    }
}
exports.pathExists = pathExists;
function normalizeFilepath(filepath) {
    return path.normalize(filepath
        .replace(/^([a-z]):\\/, (_, $1) => $1.toUpperCase() + ":\\")
        .replace(/\//gm, path.sep));
}
exports.normalizeFilepath = normalizeFilepath;
function escapeRegExp(str) {
    return str.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
}
exports.escapeRegExp = escapeRegExp;
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}
exports.sleep = sleep;
function isHttpURL(str) {
    if (!/^https?:\/\/.+/.test(str)) {
        return false;
    }
    try {
        new URL(str);
        return true;
    }
    catch (_a) {
        return false;
    }
}
exports.isHttpURL = isHttpURL;
function hashURL(url) {
    return crypto_1.default
        .createHash("sha256")
        .update(url.pathname + url.search)
        .digest("hex");
}
exports.hashURL = hashURL;
function isValidDenoDocument(languageID) {
    return [
        "javascript",
        "javascriptreact",
        "typescript",
        "typescriptreact",
    ].includes(languageID);
}
exports.isValidDenoDocument = isValidDenoDocument;
function isUntitledDocument(filename) {
    return /^untitled:/.test(filename);
}
exports.isUntitledDocument = isUntitledDocument;
//# sourceMappingURL=util.js.map