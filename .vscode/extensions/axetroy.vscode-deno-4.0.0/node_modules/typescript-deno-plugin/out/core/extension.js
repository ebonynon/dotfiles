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
function getExtensionFromFile(filename) {
    const extName = path.extname(filename);
    if (extName === ".ts") {
        if (/\.d\.ts$/.test(filename)) {
            return ".d.ts";
        }
    }
    return extName;
}
exports.getExtensionFromFile = getExtensionFromFile;
function isValidDenoModuleExtension(filename) {
    if (/\.(tsx?|jsx?|d\.ts|wasm)$/.test(filename)) {
        return true;
    }
    return false;
}
exports.isValidDenoModuleExtension = isValidDenoModuleExtension;
//# sourceMappingURL=extension.js.map