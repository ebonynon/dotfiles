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
const fs = __importStar(require("fs"));
const deepmerge_1 = __importDefault(require("deepmerge"));
const deep_equal_1 = __importDefault(require("deep-equal"));
const json5_1 = __importDefault(require("json5"));
const util_1 = require("./util");
exports.DenoPluginConfigurationField = [
    "enable",
    "unstable",
    "import_map",
];
class Configuration {
    constructor() {
        this._configUpdatedListeners = new Set();
        this._configuration = Configuration.defaultConfiguration;
    }
    get config() {
        return deepmerge_1.default({}, this._configuration);
    }
    resolveFromVscode(projectFolder) {
        const vscodeSettingsFile = path.join(projectFolder, ".vscode", "settings.json");
        if (util_1.pathExistsSync(vscodeSettingsFile) === true) {
            const content = fs.readFileSync(vscodeSettingsFile, { encoding: "utf8" });
            try {
                const settings = json5_1.default.parse(content);
                const c = {};
                for (const key in settings) {
                    if (exports.DenoPluginConfigurationField.map((v) => "deno." + v).includes(key)) {
                        const field = key.replace(/^deno\./, "");
                        c[field] = settings[key];
                    }
                }
                this._configuration = deepmerge_1.default(this._configuration, c);
                this._configuration.enable = !!this._configuration.enable;
                this._configuration.unstable = !!this._configuration.unstable;
                this._configuration.import_map = this._configuration.import_map
                    ? this._configuration.import_map + ""
                    : null;
            }
            catch (_a) {
            }
        }
    }
    update(c) {
        const oldConfig = JSON.parse(JSON.stringify(this._configuration));
        this._configuration = deepmerge_1.default(this._configuration, c);
        if (!deep_equal_1.default(oldConfig, this.config)) {
            for (const listener of this._configUpdatedListeners) {
                listener();
            }
        }
    }
    onUpdatedConfig(listener) {
        this._configUpdatedListeners.add(listener);
    }
}
exports.Configuration = Configuration;
Configuration.defaultConfiguration = {
    enable: false,
    unstable: false,
    import_map: null,
};
//# sourceMappingURL=configuration.js.map