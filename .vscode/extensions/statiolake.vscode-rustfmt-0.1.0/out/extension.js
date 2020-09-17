"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const child_process = require("child_process");
function rangeWholeFile(doc) {
    let lastlinum = doc.lineCount - 1;
    let first = doc.lineAt(0).range.start.character;
    let last = doc.lineAt(lastlinum).range.end.character;
    return new vscode.Range(0, first, lastlinum, last);
}
function getFormattedString(doc) {
    return child_process
        .execSync("rustfmt --edition=2018", {
        encoding: "utf-8",
        input: doc.getText()
    })
        .toString();
}
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    let disposable = vscode.languages.registerDocumentFormattingEditProvider("rust", {
        provideDocumentFormattingEdits(doc) {
            return [
                vscode.TextEdit.replace(rangeWholeFile(doc), getFormattedString(doc))
            ];
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map