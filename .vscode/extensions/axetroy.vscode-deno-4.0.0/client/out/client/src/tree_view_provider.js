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
const vscode_1 = require("vscode");
const util_1 = require("../../core/util");
const const_1 = require("../../core/const");
var ItemType;
(function (ItemType) {
    ItemType[ItemType["Workspace"] = 1] = "Workspace";
    ItemType[ItemType["URL"] = 2] = "URL";
    ItemType[ItemType["Reference"] = 3] = "Reference";
})(ItemType || (ItemType = {}));
class TreeViewProvider {
    constructor(extension) {
        this.extension = extension;
        this.privateOnDidChangeTreeData = new vscode_1.EventEmitter();
        this.onDidChangeTreeData = this
            .privateOnDidChangeTreeData.event;
        this.disposable = [];
        this.disposable.push(vscode_1.commands.registerCommand("deno._refresh_tree", () => {
            this.refresh();
        }));
        this.disposable.push(vscode_1.commands.registerCommand("deno._open_file", async (filepath, location) => {
            this.refresh();
            const document = await await vscode_1.workspace.openTextDocument(filepath);
            await vscode_1.window.showTextDocument(document, {
                selection: new vscode_1.Range(location.start.line, location.start.character, location.end.line, location.end.character),
            });
        }));
    }
    async getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        var _a, _b, _c, _d;
        if (!element) {
            const workspaceFolders = vscode_1.workspace.workspaceFolders || [];
            return (workspaceFolders
                .filter((v) => this.extension.getConfiguration(v.uri).enable)
                .map((v) => {
                const item = {
                    resourceUri: v.uri,
                    type: ItemType.Workspace,
                    label: v.name,
                    collapsibleState: vscode_1.TreeItemCollapsibleState.Collapsed,
                };
                return item;
            }));
        }
        if (element.type === ItemType.Workspace) {
            const depsMap = (await ((_a = this.extension.client) === null || _a === void 0 ? void 0 : _a.sendRequest(const_1.Request.analysisDependency, (_b = element.resourceUri) === null || _b === void 0 ? void 0 : _b.toString())));
            const deps = Object.keys(depsMap);
            return deps
                .map((url) => {
                const item = {
                    parentNode: element,
                    iconPath: {
                        light: path.join(this.extension.context.extensionPath, "resource", "icon", "url.light.svg"),
                        dark: path.join(this.extension.context.extensionPath, "resource", "icon", "url.dark.svg"),
                    },
                    resourceUri: vscode_1.Uri.parse(url),
                    type: ItemType.URL,
                    label: url,
                    collapsibleState: vscode_1.TreeItemCollapsibleState.Collapsed,
                    references: depsMap[url],
                };
                return item;
            })
                .sort((a, b) => (a.label > b.label ? 1 : -1));
        }
        if (!element.references) {
            return [];
        }
        const workspaceFolderFilepath = util_1.normalizeFilepath(((_d = (_c = element.parentNode) === null || _c === void 0 ? void 0 : _c.resourceUri) === null || _d === void 0 ? void 0 : _d.fsPath) + path.sep);
        return element.references.map((r) => {
            const filename = util_1.normalizeFilepath(util_1.normalizeFilepath(r.filepath)
                .replace(new RegExp("^" + util_1.escapeRegExp(workspaceFolderFilepath)), "")
                .replace(new RegExp(util_1.escapeRegExp(path.sep), "gm"), path.posix.sep));
            const item = {
                parentNode: element,
                resourceUri: vscode_1.Uri.file(r.filepath),
                type: ItemType.Reference,
                label: filename,
                description: `Line ${r.location.start.line + 1}, Col ${r.location.start.character + 1}`,
                collapsibleState: vscode_1.TreeItemCollapsibleState.None,
                command: {
                    title: "Open the file",
                    command: "deno._open_file",
                    arguments: [r.filepath, r.location],
                },
            };
            return item;
        });
    }
    refresh() {
        this.privateOnDidChangeTreeData.fire();
    }
    dispose() {
        this.privateOnDidChangeTreeData.dispose();
        for (const disposable of this.disposable) {
            disposable.dispose();
        }
    }
}
exports.TreeViewProvider = TreeViewProvider;
//# sourceMappingURL=tree_view_provider.js.map