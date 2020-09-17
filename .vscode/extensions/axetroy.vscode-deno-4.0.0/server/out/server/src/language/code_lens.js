"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_uri_1 = require("vscode-uri");
const vscode_nls_i18n_1 = require("vscode-nls-i18n");
const deno_cache_1 = require("../../../core/deno_cache");
const deno_1 = require("../../../core/deno");
class CodeLens {
    constructor(connection, documents) {
        connection.onCodeLens((params) => {
            const { textDocument } = params;
            const document = documents.get(textDocument.uri);
            if (!document) {
                return [];
            }
            const filepath = vscode_uri_1.URI.parse(document.uri).fsPath;
            if (!deno_1.isInDeno(filepath)) {
                return [];
            }
            const cache = deno_cache_1.CacheModule.create(filepath);
            if (!cache) {
                return;
            }
            return [
                {
                    range: vscode_languageserver_1.Range.create(vscode_languageserver_1.Position.create(0, 0), vscode_languageserver_1.Position.create(0, 0)),
                    command: {
                        title: vscode_nls_i18n_1.localize("code_len.cached_module", cache.meta.url.href),
                        command: "deno._copy_text",
                        arguments: [cache.meta.url.href],
                    },
                },
            ];
        });
    }
}
exports.CodeLens = CodeLens;
//# sourceMappingURL=code_lens.js.map