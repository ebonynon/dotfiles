"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const fs_1 = require("fs");
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const get_port_1 = __importDefault(require("get-port"));
const execa_1 = __importDefault(require("execa"));
const vscode_nls_i18n_1 = require("vscode-nls-i18n");
const semver = __importStar(require("semver"));
const tree_view_provider_1 = require("./tree_view_provider");
const import_map_1 = require("../../core/import_map");
const hash_meta_1 = require("../../core/hash_meta");
const deno_1 = require("../../core/deno");
const util_1 = require("../../core/util");
const const_1 = require("../../core/const");
const configuration_1 = require("../../core/configuration");
const TYPESCRIPT_EXTENSION_NAME = "vscode.typescript-language-features";
const TYPESCRIPT_DENO_PLUGIN_ID = "typescript-deno-plugin";
async function getTypescriptAPI() {
    const extension = vscode_1.extensions.getExtension(TYPESCRIPT_EXTENSION_NAME);
    const err = new Error("Cannot get typescript APIs. try restart Visual Studio Code.");
    if (!extension) {
        throw err;
    }
    await extension.activate();
    if (!extension.exports || !extension.exports.getAPI) {
        throw err;
    }
    const api = extension.exports.getAPI(0);
    if (!api) {
        throw err;
    }
    return api;
}
class Extension {
    constructor() {
        this.id = "axetroy.vscode-deno";
        this.clientReady = false;
        this.configurationSection = "deno";
        this.denoInfo = {
            DENO_DIR: "",
            version: {
                deno: "",
                v8: "",
                typescript: "",
                raw: "",
            },
            executablePath: "",
        };
    }
    getConfiguration(uri) {
        const config = {};
        const _config = vscode_1.workspace.getConfiguration(this.configurationSection, uri);
        function withConfigValue(config, outConfig, key) {
            var _a, _b, _c;
            const configSetting = config.inspect(key);
            if (!configSetting) {
                return;
            }
            outConfig[key] = ((_c = (_b = (_a = configSetting.workspaceFolderValue) !== null && _a !== void 0 ? _a : configSetting.workspaceValue) !== null && _b !== void 0 ? _b : configSetting.globalValue) !== null && _c !== void 0 ? _c : configSetting.defaultValue);
        }
        for (const field of configuration_1.DenoPluginConfigurationField) {
            withConfigValue(_config, config, field);
        }
        return config;
    }
    registerCommand(command, handler) {
        this.context.subscriptions.push(vscode_1.commands.registerCommand(this.configurationSection + "." + command, handler.bind(this)));
    }
    watchConfiguration(handler) {
        this.context.subscriptions.push(vscode_1.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration(this.configurationSection)) {
                handler();
            }
        }));
    }
    async StartDenoLanguageServer() {
        await vscode_1.window.withProgress({
            location: vscode_1.ProgressLocation.Window,
            title: vscode_nls_i18n_1.localize("deno.initializing"),
        }, async () => {
            if (this.client) {
                await this.client.stop();
                this.client = undefined;
                this.clientReady = false;
            }
            const port = await get_port_1.default({ port: 9523 });
            const serverModule = this.context.asAbsolutePath(path.join("server", "out", "server", "src", "server.js"));
            const serverOptions = {
                run: {
                    module: serverModule,
                    transport: vscode_languageclient_1.TransportKind.ipc,
                    options: {
                        cwd: this.context.extensionPath,
                        env: {
                            VSCODE_DENO_EXTENSION_PATH: this.context.extensionPath,
                            VSCODE_NLS_CONFIG: process.env.VSCODE_NLS_CONFIG,
                        },
                    },
                },
                debug: {
                    module: serverModule,
                    transport: vscode_languageclient_1.TransportKind.ipc,
                    options: {
                        cwd: this.context.extensionPath,
                        execArgv: ["--nolazy", `--inspect=${port}`],
                        env: {
                            VSCODE_DENO_EXTENSION_PATH: this.context.extensionPath,
                            VSCODE_NLS_CONFIG: process.env.VSCODE_NLS_CONFIG,
                        },
                    },
                },
            };
            const clientOptions = {
                documentSelector: [
                    { scheme: "file", language: "javascript" },
                    { scheme: "file", language: "javascriptreact" },
                    { scheme: "file", language: "typescript" },
                    { scheme: "file", language: "typescriptreact" },
                ],
                diagnosticCollectionName: this.configurationSection,
                synchronize: {
                    configurationSection: this.configurationSection,
                },
                progressOnInitialization: true,
                middleware: {
                    provideCodeActions: (document, range, context, token, next) => {
                        if (!this.getConfiguration(document.uri).enable) {
                            return [];
                        }
                        if (!context.diagnostics || context.diagnostics.length === 0) {
                            return [];
                        }
                        const denoDiagnostics = [];
                        for (const diagnostic of context.diagnostics) {
                            if (diagnostic.source === "Deno Language Server") {
                                denoDiagnostics.push(diagnostic);
                            }
                        }
                        if (denoDiagnostics.length === 0) {
                            return [];
                        }
                        const newContext = Object.assign({}, context, {
                            diagnostics: denoDiagnostics,
                        });
                        return next(document, range, newContext, token);
                    },
                    provideCompletionItem: (document, position, context, token, next) => {
                        if (!this.getConfiguration(document.uri).enable) {
                            return [];
                        }
                        return next(document, position, context, token);
                    },
                    provideCodeLenses: (document, token, next) => {
                        if (!deno_1.isInDeno(document.uri.fsPath)) {
                            return;
                        }
                        return next(document, token);
                    },
                },
            };
            const client = (this.client = new vscode_languageclient_1.LanguageClient("Deno Language Server", "Deno Language Server", serverOptions, clientOptions));
            this.context.subscriptions.push(client.start());
            await client.onReady();
            this.clientReady = true;
            client.onNotification(const_1.Notification.init, (info) => {
                var _a;
                this.denoInfo = Object.assign(Object.assign({}, this.denoInfo), info);
                this.updateStatusBarVisibility((_a = vscode_1.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document);
            });
            client.onNotification(const_1.Notification.error, vscode_1.window.showErrorMessage.bind(vscode_1.window));
            client.onRequest(const_1.Request.getWorkspaceFolder, async (uri) => vscode_1.workspace.getWorkspaceFolder(vscode_1.Uri.parse(uri)));
            client.onRequest(const_1.Request.getWorkspaceConfig, async (uri) => {
                const workspaceFolder = vscode_1.workspace.getWorkspaceFolder(vscode_1.Uri.parse(uri));
                const config = this.getConfiguration((workspaceFolder === null || workspaceFolder === void 0 ? void 0 : workspaceFolder.uri) || vscode_1.Uri.parse(uri));
                return config;
            });
        });
    }
    updateStatusBarVisibility(document) {
        if (!document) {
            this.statusBar.hide();
            return;
        }
        if (!util_1.isValidDenoDocument(document.languageId)) {
            this.statusBar.hide();
            return;
        }
        const uri = document.uri;
        const enabled = vscode_1.workspace
            .getConfiguration(this.configurationSection, uri)
            .get("enable");
        if (!enabled) {
            this.statusBar.hide();
            return;
        }
        if (this.statusBar) {
            this.statusBar.text = `Deno ${this.denoInfo.version.deno}`;
            this.statusBar.tooltip = `Deno ${this.denoInfo.version.deno}
TypeScript ${this.denoInfo.version.typescript}
V8 ${this.denoInfo.version.v8}
Executable ${this.denoInfo.executablePath}`;
            this.statusBar.show();
        }
    }
    registerQuickFix(map) {
        for (const command in map) {
            const handler = map[command];
            this.registerCommand(command, async (uri, range) => {
                const textEditor = vscode_1.window.activeTextEditor;
                if (!textEditor || textEditor.document.uri.toString() !== uri) {
                    return;
                }
                range = new vscode_1.Range(range.start.line, range.start.character, range.end.line, range.end.character);
                const rangeText = textEditor.document.getText(range);
                return await handler.call(this, textEditor, rangeText, range);
            });
        }
    }
    updateDiagnostic(uri) {
        if (this.client && this.clientReady) {
            this.client.sendNotification(const_1.Notification.diagnostic, uri.toString());
        }
    }
    sync(document) {
        var _a;
        if (document) {
            const relativeFilepath = vscode_1.workspace.asRelativePath(document.uri.fsPath, false);
            if (util_1.isValidDenoDocument(document.languageId) &&
                !path.isAbsolute(relativeFilepath)) {
                const config = this.getConfiguration(document.uri);
                vscode_1.commands.executeCommand("setContext", "denoExtensionActivated", !!config.enable);
                this.tsAPI.configurePlugin(TYPESCRIPT_DENO_PLUGIN_ID, config);
                this.updateDiagnostic(document.uri);
            }
        }
        this.updateStatusBarVisibility((_a = vscode_1.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document);
    }
    async setDocumentLanguage(document) {
        if (!document) {
            return;
        }
        if (document.isUntitled ||
            document.languageId.toLowerCase() !== "plaintext") {
            return;
        }
        const filepath = document.uri.fsPath;
        if (deno_1.isInDeno(filepath)) {
            const meta = hash_meta_1.HashMeta.create(filepath + ".metadata.json");
            if (meta) {
                await vscode_1.languages.setTextDocumentLanguage(document, meta.type.toLocaleLowerCase());
            }
        }
    }
    async activate(context) {
        var _a, _b;
        vscode_nls_i18n_1.init(context.extensionPath);
        this.context = context;
        this.tsAPI = await getTypescriptAPI();
        this.tsAPI.configurePlugin(TYPESCRIPT_DENO_PLUGIN_ID, this.getConfiguration((_a = vscode_1.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.uri));
        this.statusBar = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Right, 0);
        this.context.subscriptions.push(this.statusBar);
        this.output = vscode_1.window.createOutputChannel("Deno");
        this.context.subscriptions.push(this.output);
        this.context.subscriptions.push(vscode_1.window.onDidChangeActiveTextEditor(async (editor) => {
            this.sync(editor === null || editor === void 0 ? void 0 : editor.document);
            await this.setDocumentLanguage(editor === null || editor === void 0 ? void 0 : editor.document);
        }));
        this.context.subscriptions.push(vscode_1.workspace.onDidOpenTextDocument(async (document) => {
            this.sync(document);
        }));
        this.registerCommand("restart_server", async () => {
            this.StartDenoLanguageServer();
        });
        this.registerCommand("_copy_text", async (text) => {
            await vscode_1.env.clipboard.writeText(text);
            await vscode_1.window.showInformationMessage(`Copied to clipboard.`);
        });
        this.registerQuickFix({
            _fetch_remote_module: async (editor, text) => {
                const config = this.getConfiguration(editor.document.uri);
                const workspaceFolder = vscode_1.workspace.getWorkspaceFolder(editor.document.uri);
                if (!workspaceFolder) {
                    return;
                }
                const importMapFilepath = config.import_map
                    ? path.isAbsolute(config.import_map)
                        ? config.import_map
                        : path.resolve(workspaceFolder.uri.fsPath, config.import_map)
                    : undefined;
                const importMap = import_map_1.ImportMap.create(importMapFilepath);
                const moduleName = importMap.resolveModule(text);
                this.output.appendLine(`Fetching "${moduleName}"`);
                await vscode_1.window.withProgress({
                    title: `Fetching`,
                    location: vscode_1.ProgressLocation.Notification,
                    cancellable: true,
                }, (process, cancelToken) => {
                    var _a, _b;
                    const cmd = semver.gte(this.denoInfo.version.deno, "0.40.0")
                        ? "cache"
                        : "fetch";
                    const ps = execa_1.default(this.denoInfo.executablePath, [cmd, moduleName], {
                        timeout: 1000 * 60 * 2,
                    });
                    const updateProgress = (buf) => {
                        const raw = buf.toString();
                        const messages = raw.split("\n");
                        for (let message of messages) {
                            message = message.replace("[0m[38;5;10mDownload[0m", "").trim();
                            if (message) {
                                process.report({ message });
                                this.output.appendLine(message);
                            }
                        }
                    };
                    cancelToken.onCancellationRequested(ps.kill.bind(ps));
                    (_a = ps.stdout) === null || _a === void 0 ? void 0 : _a.on("data", updateProgress);
                    (_b = ps.stderr) === null || _b === void 0 ? void 0 : _b.on("data", updateProgress);
                    return new Promise((resolve) => {
                        ps.on("exit", (code) => {
                            if (code !== 0 && !cancelToken.isCancellationRequested) {
                                this.output.show();
                            }
                            this.output.appendLine(`exit with code: ${code}`);
                            this.updateDiagnostic(editor.document.uri);
                            resolve();
                        });
                    });
                });
            },
            _create_local_module: async (editor, text) => {
                const extName = path.extname(text);
                if (extName === "") {
                    this.output.appendLine(`Cannot create module \`${text}\` without specifying extension name`);
                    this.output.show();
                    return;
                }
                if (text.indexOf(".") !== 0 && text.indexOf("/") !== 0) {
                    this.output.appendLine(`Cannot create module \`${text}\`. Module is not relative or absolute`);
                    this.output.show();
                    return;
                }
                let defaultTextContent = "";
                switch (extName) {
                    case ".js":
                    case ".jsx":
                    case ".ts":
                    case ".tsx":
                        defaultTextContent = "export function example () {}";
                        break;
                    default:
                        this.output.appendLine(`Unknown module \`${text}\``);
                        this.output.show();
                        return;
                }
                const absModuleFilepath = path.isAbsolute(text)
                    ? text
                    : path.resolve(path.dirname(editor.document.uri.fsPath), text);
                this.output.appendLine(`create module \`${absModuleFilepath}\``);
                await fs_1.promises.writeFile(absModuleFilepath, defaultTextContent);
                this.updateDiagnostic(editor.document.uri);
            },
        });
        this.watchConfiguration(() => {
            var _a;
            this.sync((_a = vscode_1.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document);
        });
        await this.StartDenoLanguageServer();
        const treeView = new tree_view_provider_1.TreeViewProvider(this);
        this.context.subscriptions.push(treeView);
        this.context.subscriptions.push(vscode_1.window.registerTreeDataProvider("deno", treeView));
        this.sync((_b = vscode_1.window.activeTextEditor) === null || _b === void 0 ? void 0 : _b.document);
        const extension = vscode_1.extensions.getExtension(this.id);
        console.log(`Congratulations, your extension "${this.id} ${extension === null || extension === void 0 ? void 0 : extension.packageJSON["version"]}" is now active!`);
    }
    async deactivate(context) {
        this.context = context;
        if (this.client) {
            await this.client.stop();
            this.client = undefined;
            this.clientReady = false;
        }
    }
}
exports.Extension = Extension;
const ext = new Extension();
const activate = ext.activate.bind(ext);
exports.activate = activate;
const deactivate = ext.deactivate.bind(ext);
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map