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
const fs_1 = require("fs");
const deno_1 = require("./deno");
const hash_meta_1 = require("./hash_meta");
const deno_type_hint_1 = require("./deno_type_hint");
async function getAllDenoCachedDeps() {
    const depsRootDir = deno_1.getDenoDepsDir();
    const deps = [];
    const protocols = await fs_1.promises.readdir(depsRootDir);
    await Promise.all(protocols.map(async (protocol) => {
        const protocolFolderPath = path.join(depsRootDir, protocol);
        const protocolStat = await fs_1.promises.stat(protocolFolderPath);
        if (protocolStat.isDirectory()) {
            const origins = (await fs_1.promises.readdir(protocolFolderPath)).map((v) => path.join(protocolFolderPath, v));
            await Promise.all(origins.map(async (origin) => {
                const stat = await fs_1.promises.stat(origin);
                if (!stat.isDirectory()) {
                    return;
                }
                const metaFiles = (await fs_1.promises.readdir(origin))
                    .filter((file) => file.endsWith(".metadata.json"))
                    .map((file) => path.join(origin, file));
                for (const metaFile of metaFiles) {
                    const meta = hash_meta_1.HashMeta.create(metaFile);
                    if (meta) {
                        deps.push({
                            url: meta.url.href,
                            filepath: meta.destinationFilepath,
                        });
                    }
                }
            }));
        }
    }));
    return deps;
}
exports.getAllDenoCachedDeps = getAllDenoCachedDeps;
function getImportModules(ts) {
    return (sourceFile) => {
        const moduleNodes = [];
        function delint(SourceFile) {
            function delintNode(node) {
                let moduleNode = null;
                if (ts.isCallExpression(node)) {
                    const expression = node.expression;
                    const args = node.arguments;
                    const isDynamicImport = expression.kind === ts.SyntaxKind.ImportKeyword;
                    if (isDynamicImport) {
                        const argv = args[0];
                        if (argv && ts.isStringLiteral(argv)) {
                            moduleNode = argv;
                        }
                    }
                }
                else if (ts.isImportEqualsDeclaration(node)) {
                    const ref = node.moduleReference;
                    if (ts.isExternalModuleReference(ref) &&
                        ref.expression &&
                        ts.isStringLiteral(ref.expression)) {
                        moduleNode = ref.expression;
                    }
                }
                else if (ts.isImportDeclaration(node)) {
                    const spec = node.moduleSpecifier;
                    if (ts.isStringLiteral(spec)) {
                        moduleNode = spec;
                    }
                }
                else if (ts.isExportDeclaration(node)) {
                    const exportSpec = node.moduleSpecifier;
                    if (exportSpec && ts.isStringLiteral(exportSpec)) {
                        moduleNode = exportSpec;
                    }
                }
                if (moduleNode) {
                    moduleNodes.push(moduleNode);
                }
                ts.forEachChild(node, delintNode);
            }
            delintNode(SourceFile);
        }
        delint(sourceFile);
        const text = sourceFile.getFullText();
        const getComments = (node, isTrailing) => {
            if (node.parent) {
                const nodePos = isTrailing ? node.end : node.pos;
                const parentPos = isTrailing ? node.parent.end : node.parent.pos;
                if (node.parent.kind === ts.SyntaxKind.SourceFile ||
                    nodePos !== parentPos) {
                    const comments = isTrailing
                        ? ts.getTrailingCommentRanges(sourceFile.text, nodePos)
                        : ts.getLeadingCommentRanges(sourceFile.text, nodePos);
                    if (Array.isArray(comments)) {
                        return comments.map((v) => {
                            const target = Object.assign(Object.assign({}, v), { text: text.substring(v.pos, v.end) });
                            return target;
                        });
                    }
                    return undefined;
                }
            }
        };
        const modules = sourceFile.typeReferenceDirectives
            .map((directive) => {
            const start = sourceFile.getLineAndCharacterOfPosition(directive.pos);
            const end = sourceFile.getLineAndCharacterOfPosition(directive.end);
            const module = {
                moduleName: directive.fileName,
                location: { start, end },
            };
            return module;
        })
            .concat(moduleNodes.map((node) => {
            const numberOfSpaces = Math.abs(node.end - node.pos - (node.text.length + 2));
            const startPosition = node.pos + numberOfSpaces + 1;
            const endPosition = startPosition + node.text.length;
            const start = sourceFile.getLineAndCharacterOfPosition(startPosition);
            const end = sourceFile.getLineAndCharacterOfPosition(endPosition);
            const location = {
                start,
                end,
            };
            const leadingComments = getComments(node.parent, false);
            const trailingComments = getComments(node.parent, true);
            const module = {
                moduleName: node.text,
                location,
            };
            if (trailingComments) {
                module.trailingComments = trailingComments;
            }
            if (leadingComments) {
                module.leadingComments = leadingComments;
                const comment = module.leadingComments[module.leadingComments.length - 1];
                const hint = deno_type_hint_1.parseCompileHint(sourceFile, comment);
                module.hint = hint;
            }
            return module;
        }));
        return modules;
    };
}
exports.getImportModules = getImportModules;
//# sourceMappingURL=deno_deps.js.map