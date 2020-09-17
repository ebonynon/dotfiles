"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const deno_types_1 = require("../deno_types");
class Hover {
    constructor(connection, documents) {
        connection.onHover(async (params) => {
            const { textDocument, position } = params;
            const document = documents.get(textDocument.uri);
            if (!document) {
                return;
            }
            const denoTypesComments = deno_types_1.getDenoTypesHintsFromDocument(document);
            for (const typeComment of denoTypesComments) {
                const start = typeComment.range.start;
                const end = typeComment.range.end;
                if (position.line >= start.line &&
                    position.line <= end.line &&
                    position.character >= start.character &&
                    position.character <= end.character) {
                    const hover = {
                        range: typeComment.contentRange,
                        contents: [
                            vscode_languageserver_1.MarkedString.fromPlainText("Deno's external declaration library. For more detail: https://deno.land/std/manual.md"),
                        ],
                    };
                    return hover;
                }
            }
            return;
        });
    }
}
exports.Hover = Hover;
//# sourceMappingURL=hover.js.map