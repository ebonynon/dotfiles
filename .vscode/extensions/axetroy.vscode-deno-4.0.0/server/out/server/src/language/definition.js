"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_uri_1 = require("vscode-uri");
const deno_types_1 = require("../deno_types");
const module_resolver_1 = require("../../../core/module_resolver");
class Definition {
    constructor(connection, documents) {
        connection.onDefinition(async (params) => {
            const { textDocument, position } = params;
            const document = documents.get(textDocument.uri);
            if (!document) {
                return;
            }
            const uri = vscode_uri_1.URI.parse(document.uri);
            const resolver = module_resolver_1.ModuleResolver.create(uri.fsPath);
            const locations = [];
            const denoTypesComments = deno_types_1.getDenoTypesHintsFromDocument(document);
            for (const typeComment of denoTypesComments) {
                const start = typeComment.contentRange.start;
                const end = typeComment.contentRange.end;
                if (position.line >= start.line &&
                    position.line <= end.line &&
                    position.character >= start.character &&
                    position.character <= end.character) {
                    const [typeModule] = resolver.resolveModules([typeComment.text]);
                    if (typeModule) {
                        locations.push(vscode_languageserver_1.Location.create(vscode_uri_1.URI.file(typeModule.filepath).toString(), vscode_languageserver_1.Range.create(0, 0, 0, 0)));
                    }
                }
            }
            return locations;
        });
    }
}
exports.Definition = Definition;
//# sourceMappingURL=definition.js.map