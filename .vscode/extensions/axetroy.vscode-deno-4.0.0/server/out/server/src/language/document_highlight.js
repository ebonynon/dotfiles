"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const deno_types_1 = require("../deno_types");
class DocumentHighlight {
    constructor(connection, documents) {
        connection.onDocumentHighlight(async (params) => {
            const { textDocument, position } = params;
            const document = documents.get(textDocument.uri);
            if (!document) {
                return [];
            }
            const denoTypesComments = deno_types_1.getDenoTypesHintsFromDocument(document);
            const highlights = [];
            for (const typeComment of denoTypesComments) {
                const start = typeComment.range.start;
                const end = typeComment.range.end;
                if (position.line >= start.line &&
                    position.line <= end.line &&
                    position.character >= start.character &&
                    position.character <= end.character) {
                    highlights.push(vscode_languageserver_1.DocumentHighlight.create(typeComment.contentRange, vscode_languageserver_1.DocumentHighlightKind.Write));
                }
            }
            return highlights;
        });
    }
}
exports.DocumentHighlight = DocumentHighlight;
//# sourceMappingURL=document_highlight.js.map