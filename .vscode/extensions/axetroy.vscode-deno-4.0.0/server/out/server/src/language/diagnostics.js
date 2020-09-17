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
const vscode_languageserver_1 = require("vscode-languageserver");
const ts = __importStar(require("typescript"));
const vscode_uri_1 = require("vscode-uri");
const vscode_nls_i18n_1 = require("vscode-nls-i18n");
const module_resolver_1 = require("../../../core/module_resolver");
const util_1 = require("../../../core/util");
const import_map_1 = require("../../../core/import_map");
const deno_deps_1 = require("../../../core/deno_deps");
const const_1 = require("../../../core/const");
var DiagnosticCode;
(function (DiagnosticCode) {
    DiagnosticCode[DiagnosticCode["InvalidImport"] = 1000] = "InvalidImport";
    DiagnosticCode[DiagnosticCode["LocalModuleNotExist"] = 1004] = "LocalModuleNotExist";
    DiagnosticCode[DiagnosticCode["RemoteModuleNotExist"] = 1005] = "RemoteModuleNotExist";
})(DiagnosticCode || (DiagnosticCode = {}));
const FixItems = {
    [DiagnosticCode.LocalModuleNotExist]: {
        title: vscode_nls_i18n_1.localize("diagnostic.fix.create_module"),
        command: "deno._create_local_module",
    },
    [DiagnosticCode.RemoteModuleNotExist]: {
        title: vscode_nls_i18n_1.localize("diagnostic.fix.fetch_module"),
        command: "deno._fetch_remote_module",
    },
};
class Diagnostics {
    constructor(name, connection, bridge, documents) {
        this.name = name;
        this.connection = connection;
        this.bridge = bridge;
        this.documents = documents;
        connection.onCodeAction(async (params) => {
            const { context, textDocument } = params;
            const { diagnostics } = context;
            const denoDiagnostics = diagnostics.filter((v) => v.source === this.name);
            if (!denoDiagnostics.length) {
                return;
            }
            const actions = denoDiagnostics
                .map((v) => {
                const code = v.code;
                if (!code) {
                    return;
                }
                const fixItem = FixItems[+code];
                if (!fixItem) {
                    return;
                }
                const action = vscode_languageserver_1.CodeAction.create(`${fixItem.title} (${this.name})`, vscode_languageserver_1.Command.create(fixItem.title, fixItem.command, textDocument.uri, {
                    start: {
                        line: v.range.start.line,
                        character: v.range.start.character,
                    },
                    end: {
                        line: v.range.end.line,
                        character: v.range.end.character,
                    },
                }), vscode_languageserver_1.CodeActionKind.QuickFix);
                return action;
            })
                .filter((v) => v);
            return actions;
        });
        connection.onNotification(const_1.Notification.diagnostic, (uri) => {
            const document = this.documents.get(uri);
            document && this.diagnosis(document);
        });
        documents.onDidOpen((params) => this.diagnosis(params.document));
        documents.onDidChangeContent((params) => this.diagnosis(params.document));
    }
    async generate(document) {
        if (!util_1.isValidDenoDocument(document.languageId)) {
            return [];
        }
        const [config, workspaceDir] = await Promise.all([
            this.bridge.getWorkspaceConfig(document.uri),
            this.bridge.getWorkspace(document.uri),
        ]);
        if (!config.enable || !workspaceDir) {
            return [];
        }
        const importMapFilepath = config.import_map
            ? path.isAbsolute(config.import_map)
                ? config.import_map
                : path.resolve(workspaceDir.uri.fsPath, config.import_map)
            : undefined;
        const uri = vscode_uri_1.URI.parse(document.uri);
        const sourceFile = ts.createSourceFile(uri.fsPath, document.getText(), ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
        const importModules = deno_deps_1.getImportModules(ts)(sourceFile);
        const diagnosticsForThisDocument = [];
        const resolver = module_resolver_1.ModuleResolver.create(uri.fsPath, importMapFilepath);
        const handle = async (originModuleName, location) => {
            const importModuleName = originModuleName;
            const [resolvedModule] = resolver.resolveModules([importModuleName]);
            if (!resolvedModule ||
                (await util_1.pathExists(resolvedModule.filepath)) === false) {
                const moduleName = resolvedModule
                    ? resolvedModule.origin
                    : import_map_1.ImportMap.create(importMapFilepath).resolveModule(importModuleName);
                if (util_1.isHttpURL(moduleName)) {
                    diagnosticsForThisDocument.push(vscode_languageserver_1.Diagnostic.create(location, vscode_nls_i18n_1.localize("diagnostic.report.module_not_found_locally", moduleName), vscode_languageserver_1.DiagnosticSeverity.Error, DiagnosticCode.RemoteModuleNotExist, this.name));
                    return;
                }
                if (path.isAbsolute(moduleName) ||
                    moduleName.startsWith("./") ||
                    moduleName.startsWith("../") ||
                    moduleName.startsWith("file://")) {
                    diagnosticsForThisDocument.push(vscode_languageserver_1.Diagnostic.create(location, vscode_nls_i18n_1.localize("diagnostic.report.module_not_found_locally", moduleName), vscode_languageserver_1.DiagnosticSeverity.Error, DiagnosticCode.LocalModuleNotExist, this.name));
                    return;
                }
                diagnosticsForThisDocument.push(vscode_languageserver_1.Diagnostic.create(location, vscode_nls_i18n_1.localize("diagnostic.report.invalid_import", moduleName), vscode_languageserver_1.DiagnosticSeverity.Error, DiagnosticCode.InvalidImport, this.name));
            }
        };
        for (const importModule of importModules) {
            await handle(importModule.moduleName, importModule.location);
            if (importModule.hint) {
                await handle(importModule.hint.text, importModule.hint.contentRange);
            }
        }
        return diagnosticsForThisDocument;
    }
    async diagnosis(document) {
        this.connection.sendDiagnostics({
            uri: document.uri,
            version: document.version,
            diagnostics: await this.generate(document),
        });
    }
}
exports.Diagnostics = Diagnostics;
//# sourceMappingURL=diagnostics.js.map