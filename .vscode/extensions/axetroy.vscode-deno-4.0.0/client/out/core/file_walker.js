"use strict";
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path = __importStar(require("path"));
function isMatchExpression(filepath, expressions) {
    const filename = path.basename(filepath);
    for (const expression of expressions) {
        if (typeof expression === "string" && expression === filename) {
            return true;
        }
        else if (expression instanceof RegExp && expression.test(filename)) {
            return true;
        }
        else if (typeof expression === "function" && expression(filepath)) {
            return true;
        }
    }
    return false;
}
class FileWalker {
    constructor(root, options) {
        this.root = root;
        this.options = options;
    }
    static create(folder, options = {}) {
        return new FileWalker(folder, options);
    }
    [Symbol.asyncIterator]() {
        return __asyncGenerator(this, arguments, function* _a() {
            let files = (yield __await(fs_1.promises.readdir(this.root))).map((filename) => path.join(this.root, filename));
            while (files.length) {
                const filepath = files.shift();
                if (this.options.exclude) {
                    if (isMatchExpression(filepath, this.options.exclude)) {
                        continue;
                    }
                }
                const stat = yield __await(fs_1.promises.stat(filepath));
                if (stat.isDirectory()) {
                    files = files.concat((yield __await(fs_1.promises.readdir(filepath))).map((v) => path.join(filepath, v)));
                    continue;
                }
                if (this.options.include) {
                    if (!isMatchExpression(filepath, this.options.include)) {
                        continue;
                    }
                }
                yield yield __await(filepath);
            }
        });
    }
}
exports.FileWalker = FileWalker;
//# sourceMappingURL=file_walker.js.map