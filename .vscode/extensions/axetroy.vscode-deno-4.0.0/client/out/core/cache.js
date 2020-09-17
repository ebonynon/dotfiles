"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
class Cache {
    constructor(timeout, allowReferenceTimes) {
        this.timeout = timeout;
        this.allowReferenceTimes = allowReferenceTimes;
        this.data = undefined;
        this.updatedAt = new Date();
        this.referenceTimes = 0;
        assert_1.default(timeout > 0, "Timeout of cache must be a positive integer");
        if (allowReferenceTimes !== undefined) {
            assert_1.default(allowReferenceTimes > 0, "allowReferenceTimes of cache must be a positive integer");
        }
    }
    static create(timeout, allowReferenceTimes) {
        return new Cache(timeout, allowReferenceTimes);
    }
    get() {
        const isTimeout = this.updatedAt.getTime() + this.timeout < new Date().getTime();
        const isUseManyTimes = this.allowReferenceTimes
            ? this.referenceTimes >= this.allowReferenceTimes
                ? true
                : false
            : false;
        if (isTimeout || isUseManyTimes) {
            this.data = undefined;
            return;
        }
        this.referenceTimes++;
        return this.data;
    }
    set(data) {
        this.data = data;
        this.updatedAt = new Date();
        this.referenceTimes = 0;
    }
}
exports.Cache = Cache;
//# sourceMappingURL=cache.js.map