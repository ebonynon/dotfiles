"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Position = {
    create(line, character) {
        return { line, character };
    },
};
exports.Range = {
    create(start, end) {
        return { start, end };
    },
};
function parseCompileHint(sourceFile, comment) {
    const text = sourceFile.getFullText().substring(comment.pos, comment.end);
    const regexp = /@deno-types=['"]([^'"]+)['"]/;
    const matchers = regexp.exec(text);
    if (!matchers) {
        return;
    }
    const start = sourceFile.getLineAndCharacterOfPosition(comment.pos);
    const end = sourceFile.getLineAndCharacterOfPosition(comment.end);
    const moduleNameStart = exports.Position.create(start.line, start.character + '// @deno-types="'.length);
    const moduleNameEnd = exports.Position.create(end.line, end.character - '"'.length);
    const moduleName = matchers[1];
    return {
        text: moduleName,
        range: exports.Range.create(start, end),
        contentRange: exports.Range.create(moduleNameStart, moduleNameEnd),
    };
}
exports.parseCompileHint = parseCompileHint;
function getDenoCompileHint(ts) {
    return function (sourceFile, pos = 0) {
        const denoTypesComments = [];
        const comments = ts.getLeadingCommentRanges(sourceFile.getFullText(), pos) || [];
        for (const comment of comments) {
            if (comment.hasTrailingNewLine) {
                const text = sourceFile
                    .getFullText()
                    .substring(comment.pos, comment.end);
                const regexp = /@deno-types=['"]([^'"]+)['"]/;
                const matchers = regexp.exec(text);
                if (matchers) {
                    const compileHint = parseCompileHint(sourceFile, comment);
                    if (compileHint) {
                        denoTypesComments.push(compileHint);
                    }
                }
            }
        }
        return denoTypesComments;
    };
}
exports.getDenoCompileHint = getDenoCompileHint;
//# sourceMappingURL=deno_type_hint.js.map