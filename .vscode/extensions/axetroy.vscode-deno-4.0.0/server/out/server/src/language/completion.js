"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const deno_1 = require("../../../core/deno");
const deno_deps_1 = require("../../../core/deno_deps");
const cache_1 = require("../../../core/cache");
const cache = cache_1.Cache.create(1000 * 30, 30);
deno_deps_1.getAllDenoCachedDeps()
    .then((deps) => {
    cache.set(deps);
})
    .catch(() => {
});
class Completion {
    constructor(connection, documents) {
        connection.onCompletion(async (params) => {
            const { position, partialResultToken, textDocument } = params;
            const doc = documents.get(textDocument.uri);
            if (!doc) {
                return [];
            }
            const currentLine = doc.getText(vscode_languageserver_1.Range.create(vscode_languageserver_1.Position.create(position.line, 0), position));
            const IMPORT_REG = /import\s['"][a-zA-Z._-]$/;
            const IMPORT_FROM_REG = /import\s(([^\s]*)|(\*\sas\s[^\s]*))\sfrom\s['"][a-zA-Z._-]$/;
            const DYNAMIC_REG = /import\s*\(['"][a-zA-Z._-]['"]?$/;
            const isImport = IMPORT_REG.test(currentLine) ||
                IMPORT_FROM_REG.test(currentLine) ||
                DYNAMIC_REG.test(currentLine);
            if (currentLine.length > 1000 ||
                !isImport) {
                return [];
            }
            let deps = cache.get();
            if (!deps) {
                deps = await deno_deps_1.getAllDenoCachedDeps();
                cache.set(deps);
            }
            const range = vscode_languageserver_1.Range.create(vscode_languageserver_1.Position.create(position.line, position.character), position);
            const completes = deps.map((dep) => {
                return {
                    label: dep.url,
                    detail: dep.url,
                    sortText: dep.url,
                    documentation: dep.filepath.replace(deno_1.getDenoDir(), "$DENO_DIR"),
                    kind: vscode_languageserver_1.CompletionItemKind.File,
                    insertText: dep.url,
                    cancel: partialResultToken,
                    range: range,
                };
            });
            return completes;
        });
    }
}
exports.Completion = Completion;
//# sourceMappingURL=completion.js.map