"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
class CacheMap {
    constructor(timeout, allowReferenceTimes) {
        this.timeout = timeout;
        this.allowReferenceTimes = allowReferenceTimes;
        this.map = new Map();
        assert_1.default(timeout > 0, "Timeout of cache must be a positive integer");
        if (allowReferenceTimes !== undefined) {
            assert_1.default(allowReferenceTimes > 0, "allowReferenceTimes of cache must be a positive integer");
        }
    }
    static create(timeout, allowReferenceTimes) {
        return new CacheMap(timeout, allowReferenceTimes);
    }
    get(key) {
        const entry = this.map.get(key);
        if (!entry) {
            return;
        }
        const isTimeout = entry.updatedAt.getTime() + this.timeout < new Date().getTime();
        const isUseManyTimes = this.allowReferenceTimes
            ? entry.referenceTimes >= this.allowReferenceTimes
                ? true
                : false
            : false;
        if (isTimeout || isUseManyTimes) {
            this.map.delete(key);
            return;
        }
        entry.referenceTimes++;
        return entry.data;
    }
    set(key, value) {
        this.map.set(key, {
            data: value,
            updatedAt: new Date(),
            referenceTimes: 0,
        });
    }
}
exports.CacheMap = CacheMap;
//# sourceMappingURL=cache_map.js.map