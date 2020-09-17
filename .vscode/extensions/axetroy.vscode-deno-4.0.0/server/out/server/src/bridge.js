"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const const_1 = require("../../core/const");
class Bridge {
    constructor(connection) {
        this.connection = connection;
    }
    async getWorkspace(uri) {
        const workspaceFolder = await this.connection.sendRequest(const_1.Request.getWorkspaceFolder, uri);
        return workspaceFolder;
    }
    async getWorkspaceConfig(uri) {
        const config = await this.connection.sendRequest(const_1.Request.getWorkspaceConfig, uri);
        return config;
    }
}
exports.Bridge = Bridge;
//# sourceMappingURL=bridge.js.map