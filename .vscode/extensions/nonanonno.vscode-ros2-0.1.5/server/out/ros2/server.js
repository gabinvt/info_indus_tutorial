"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
const documentManager_1 = require("./documentManager");
const types_1 = require("./types");
const package_1 = require("./package");
const vscode_uri_1 = require("vscode-uri");
const env_1 = require("./env");
const defaultSettings = {
    rosRootDir: undefined,
    additionalSearchDirs: [],
    skipColconIgnore: true,
};
class Server {
    constructor(connection) {
        this.connection = connection;
        this.globalSettings = defaultSettings;
        this.settings = new Map();
        this.capabilities = {
            hasConfiguration: false,
            hasWorkspaceFolder: false,
            hasDiagnosticRelatedInformation: false,
        };
        connection.onInitialize((param) => {
            return this.solveCapabilities(param.capabilities);
        });
        connection.onInitialized(() => {
            if (this.capabilities.hasConfiguration) {
                connection.client.register(vscode_languageserver_1.DidChangeConfigurationNotification.type, undefined);
            }
        });
        this.documentManager = new documentManager_1.DocumentManager(connection);
        connection.onDefinition((handle) => this.searchDefinition(handle));
        connection.onDidChangeConfiguration((change) => {
            if (this.capabilities.hasConfiguration) {
                this.settings.clear();
            }
            else {
                this.globalSettings = (change.settings.ros2 || defaultSettings);
                this.globalSettings.rosRootDir = env_1.findRos2(this.globalSettings.rosRootDir);
            }
        });
    }
    solveCapabilities(cap) {
        this.capabilities = {
            hasConfiguration: !!(cap.workspace && !!cap.workspace.configuration),
            hasWorkspaceFolder: !!(cap.workspace && cap.workspace.workspaceFolders),
            hasDiagnosticRelatedInformation: !!(cap.textDocument &&
                cap.textDocument.publishDiagnostics &&
                cap.textDocument.publishDiagnostics.relatedInformation),
        };
        return {
            capabilities: {
                textDocumentSync: vscode_languageserver_1.TextDocumentSyncKind.Incremental,
                definitionProvider: true,
                workspace: {
                    workspaceFolders: {
                        supported: this.capabilities.hasWorkspaceFolder,
                    },
                },
            },
        };
    }
    async searchDefinition(handle) {
        const ret = [];
        const range = vscode_languageserver_1.Range.create(vscode_languageserver_1.Position.create(0, 0), vscode_languageserver_1.Position.create(0, 0));
        const tokenized = this.documentManager.uriTokenized.get(handle.textDocument.uri);
        if (!tokenized) {
            return;
        }
        const typeToken = tokenized.at(handle.position);
        if (!typeToken || !typeToken.isType) {
            return;
        }
        const kind = types_1.identifyTypeKind(typeToken.token.value);
        switch (kind) {
            case 'builtin':
                break;
            case 'this':
                const thisPackage = package_1.Package.fromContentUri(handle.textDocument.uri);
                if (thisPackage) {
                    for (const msg of thisPackage.getMessages()) {
                        if (typeToken.token.value === msg.name) {
                            ret.push(vscode_languageserver_1.Location.create(msg.path, range));
                        }
                    }
                }
                break;
            case 'package':
                const settings = await this.getSettings(handle.textDocument.uri);
                // search in workspace
                if (this.capabilities.hasWorkspaceFolder) {
                    const folders = await this.connection.workspace.getWorkspaceFolders();
                    if (folders) {
                        for (const folder of folders) {
                            for (const msg of this.searchNamespacedType(typeToken.token.value, vscode_uri_1.URI.parse(folder.uri).path, settings.skipColconIgnore)) {
                                ret.push(vscode_languageserver_1.Location.create(msg.path, range));
                            }
                        }
                    }
                }
                // additional search directory
                for (const dir of settings.additionalSearchDirs) {
                    for (const msg of this.searchNamespacedType(typeToken.token.value, dir, settings.skipColconIgnore)) {
                        ret.push(vscode_languageserver_1.Location.create(msg.path, range));
                    }
                }
                // ros2 root dir
                if (settings.rosRootDir) {
                    for (const msg of this.searchNamespacedType(typeToken.token.value, settings.rosRootDir, settings.skipColconIgnore)) {
                        ret.push(vscode_languageserver_1.Location.create(msg.path, range));
                    }
                }
                break;
        }
        return ret;
    }
    searchNamespacedType(typename, dir, skipColconIgnore) {
        const pkgType = types_1.packageAndType(typename);
        if (!pkgType) {
            return [];
        }
        const packages = package_1.Package.searchAtPath(dir, skipColconIgnore);
        let ret = [];
        for (const pkg of packages) {
            if (!pkg || pkgType.pkg !== pkg.name) {
                continue;
            }
            for (const msg of pkg.getMessages()) {
                if (pkgType.type === msg.name) {
                    ret.push(msg);
                    break;
                }
            }
        }
        return ret;
    }
    getSettings(resource) {
        if (!this.capabilities.hasConfiguration) {
            return Promise.resolve(this.globalSettings);
        }
        let result = this.settings.get(resource);
        if (!result) {
            result = this.connection.workspace.getConfiguration({
                scopeUri: resource,
                section: 'ros2',
            });
            result = result.then((settings) => {
                settings.rosRootDir = env_1.findRos2(settings.rosRootDir);
                return settings;
            });
            this.settings.set(resource, result);
        }
        return result;
    }
}
exports.Server = Server;
//# sourceMappingURL=server.js.map