"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const deno_1 = require("../deno");
class DocumentFormatting {
    constructor(connection, documents, bridge) {
        connection.onDocumentFormatting(async (params) => {
            const uri = params.textDocument.uri;
            const doc = documents.get(uri);
            if (!doc) {
                return;
            }
            const text = doc.getText();
            const workspaceFolder = await bridge.getWorkspace(uri);
            const cwd = workspaceFolder ? workspaceFolder.uri.fsPath : "./";
            const formatted = await deno_1.deno.format(text, { cwd });
            const start = doc.positionAt(0);
            const end = doc.positionAt(text.length);
            const range = vscode_languageserver_1.Range.create(start, end);
            return [vscode_languageserver_1.TextEdit.replace(range, formatted)];
        });
        connection.onDocumentRangeFormatting(async (params) => {
            const uri = params.textDocument.uri;
            const range = params.range;
            const doc = documents.get(uri);
            if (!doc) {
                return;
            }
            const text = doc.getText(range);
            const workspaceFolder = await bridge.getWorkspace(uri);
            const cwd = workspaceFolder ? workspaceFolder.uri.fsPath : "./";
            const formatted = await deno_1.deno.format(text, { cwd });
            return [vscode_languageserver_1.TextEdit.replace(range, formatted.trim())];
        });
    }
}
exports.DocumentFormatting = DocumentFormatting;
//# sourceMappingURL=document_formatting.js.map