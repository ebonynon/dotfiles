"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts = __importStar(require("typescript"));
const vscode_uri_1 = require("vscode-uri");
const deno_type_hint_1 = require("../../core/deno_type_hint");
function getDenoTypesHintsFromDocument(document) {
    const uri = vscode_uri_1.URI.parse(document.uri);
    const sourceFile = ts.createSourceFile(uri.fsPath, document.getText(), ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
    return deno_type_hint_1.getDenoCompileHint(ts)(sourceFile);
}
exports.getDenoTypesHintsFromDocument = getDenoTypesHintsFromDocument;
//# sourceMappingURL=deno_types.js.map