"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const execa_1 = __importDefault(require("execa"));
const which_1 = __importDefault(require("which"));
const vscode_nls_i18n_1 = require("vscode-nls-i18n");
const semver = __importStar(require("semver"));
class Deno {
    async init() {
        this.executablePath = await this.getExecutablePath();
        if (!this.executablePath) {
            throw new Error(vscode_nls_i18n_1.localize("err.not_install_deno"));
        }
        this.version = await this.getDenoVersion();
        if (!this.version) {
            return;
        }
        const minimumDenoVersion = "0.35.0";
        if (!semver.gte(this.version.deno, minimumDenoVersion)) {
            throw new Error(vscode_nls_i18n_1.localize("err.below_deno_minimum_requirements", minimumDenoVersion));
        }
    }
    async getTypes(unstable) {
        const { stdout } = await execa_1.default(this.executablePath, [
            "types",
            ...(unstable && this.version && semver.gte(this.version.deno, "0.43.0")
                ? ["--unstable"]
                : []),
        ]);
        return Buffer.from(stdout, "utf8");
    }
    async format(code, options) {
        const reader = stream_1.Readable.from([code]);
        const subprocess = execa_1.default(this.executablePath, ["fmt", "-"], {
            cwd: options.cwd,
            stdout: "pipe",
            stderr: "pipe",
            stdin: "pipe",
        });
        const formattedCode = (await new Promise((resolve, reject) => {
            var _a, _b;
            let stdout = "";
            let stderr = "";
            subprocess.on("exit", (exitCode) => {
                if (exitCode !== 0) {
                    reject(new Error(stderr));
                }
                else {
                    resolve(stdout);
                }
            });
            subprocess.on("error", (err) => {
                reject(err);
            });
            (_a = subprocess.stdout) === null || _a === void 0 ? void 0 : _a.on("data", (data) => {
                stdout += data;
            });
            (_b = subprocess.stderr) === null || _b === void 0 ? void 0 : _b.on("data", (data) => {
                stderr += data;
            });
            subprocess.stdin && reader.pipe(subprocess.stdin);
        }));
        return formattedCode;
    }
    async getExecutablePath() {
        const denoPath = await which_1.default("deno").catch(() => Promise.resolve(undefined));
        return denoPath;
    }
    async getDenoVersion() {
        const { stdout, stderr } = await execa_1.default(this.executablePath, [
            "eval",
            "console.log(JSON.stringify(Deno.version))",
        ]);
        if (stderr) {
            return;
        }
        const { deno, v8, typescript } = JSON.parse(stdout);
        return {
            deno,
            v8,
            typescript,
            raw: `deno: ${deno}\nv8: ${v8}\ntypescript: ${typescript}`,
        };
    }
}
const deno = new Deno();
exports.deno = deno;
//# sourceMappingURL=deno.js.map