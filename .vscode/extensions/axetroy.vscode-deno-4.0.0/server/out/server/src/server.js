"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_nls_i18n_1 = require("vscode-nls-i18n");
vscode_nls_i18n_1.init(process.env.VSCODE_DENO_EXTENSION_PATH + "");
const fs_1 = require("fs");
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const deno_1 = require("./deno");
const bridge_1 = require("./bridge");
const dependency_tree_1 = require("./dependency_tree");
const diagnostics_1 = require("./language/diagnostics");
const definition_1 = require("./language/definition");
const references_1 = require("./language/references");
const document_highlight_1 = require("./language/document_highlight");
const document_formatting_1 = require("./language/document_formatting");
const hover_1 = require("./language/hover");
const completion_1 = require("./language/completion");
const code_lens_1 = require("./language/code_lens");
const deno_2 = require("../../core/deno");
const util_1 = require("../../core/util");
const const_1 = require("../../core/const");
const SERVER_NAME = "Deno Language Server";
process.title = SERVER_NAME;
const connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
const documents = new vscode_languageserver_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
const bridge = new bridge_1.Bridge(connection);
new dependency_tree_1.DependencyTree(connection, bridge);
new diagnostics_1.Diagnostics(SERVER_NAME, connection, bridge, documents);
new definition_1.Definition(connection, documents);
new references_1.References(connection, documents);
new document_highlight_1.DocumentHighlight(connection, documents);
new document_formatting_1.DocumentFormatting(connection, documents, bridge);
new hover_1.Hover(connection, documents);
new completion_1.Completion(connection, documents);
new code_lens_1.CodeLens(connection, documents);
connection;
connection.onInitialize(() => {
    return {
        capabilities: {
            documentFormattingProvider: true,
            documentRangeFormattingProvider: true,
            textDocumentSync: {
                openClose: true,
                change: vscode_languageserver_1.TextDocumentSyncKind.Full,
            },
            completionProvider: {
                triggerCharacters: ["http", "https"],
            },
            codeActionProvider: {
                codeActionKinds: [vscode_languageserver_1.CodeActionKind.QuickFix],
            },
            documentHighlightProvider: true,
            hoverProvider: true,
            referencesProvider: true,
            definitionProvider: true,
            codeLensProvider: {},
        },
    };
});
async function ensureDenoDts(unstable) {
    const currentDenoTypesContent = await deno_1.deno.getTypes(unstable);
    const denoDtsFile = deno_2.getDenoDts(unstable);
    const isExistDtsFile = await util_1.pathExists(denoDtsFile);
    if (!isExistDtsFile) {
        await fs_1.promises.writeFile(denoDtsFile, currentDenoTypesContent, { mode: 0o444 });
    }
    else {
        await fs_1.promises.chmod(denoDtsFile, 0o666);
        const typesContent = await fs_1.promises.readFile(denoDtsFile, { encoding: "utf8" });
        if (typesContent.toString() !== currentDenoTypesContent.toString()) {
            await fs_1.promises.writeFile(denoDtsFile, currentDenoTypesContent, {
                mode: 0o444,
            });
            await fs_1.promises.chmod(denoDtsFile, 0o444);
        }
    }
}
connection.onInitialized(async () => {
    try {
        await deno_1.deno.init();
        await Promise.all([ensureDenoDts(false), ensureDenoDts(true)]);
    }
    catch (err) {
        connection.sendNotification(const_1.Notification.error, err.message);
        return;
    }
    connection.sendNotification(const_1.Notification.init, {
        version: deno_1.deno.version ? deno_1.deno.version : undefined,
        executablePath: deno_1.deno.executablePath,
        DENO_DIR: deno_2.getDenoDir(),
    });
    connection.console.log("server initialized.");
});
documents.listen(connection);
connection.listen();
//# sourceMappingURL=server.js.map