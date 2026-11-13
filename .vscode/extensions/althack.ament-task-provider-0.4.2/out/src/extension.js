"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const vscode = require("vscode");
const amentTaskProvider_1 = require("./amentTaskProvider");
const outputChannel_1 = require("./outputChannel");
const providers = new Map();
function registerWorkspaceFolder(context, workspaceFolder) {
    const key = workspaceFolder.uri.toString();
    if (providers.has(key)) {
        return;
    }
    const provider = new amentTaskProvider_1.AmentTaskProvider(workspaceFolder, context.extensionPath);
    const registration = vscode.tasks.registerTaskProvider(amentTaskProvider_1.AmentTaskProvider.AmentType, provider);
    context.subscriptions.push(provider, registration);
    providers.set(key, { provider, registration });
    (0, outputChannel_1.getOutputChannel)().appendLine(`Registered ament task provider for ${workspaceFolder.name}`);
}
function unregisterWorkspaceFolder(workspaceFolder) {
    const key = workspaceFolder.uri.toString();
    const entry = providers.get(key);
    if (!entry) {
        return;
    }
    entry.registration.dispose();
    entry.provider.dispose();
    providers.delete(key);
    (0, outputChannel_1.getOutputChannel)().appendLine(`Unregistered ament task provider for ${workspaceFolder.name}`);
}
function activate(context) {
    var _a;
    const workspaceFolders = (_a = vscode.workspace.workspaceFolders) !== null && _a !== void 0 ? _a : [];
    if (workspaceFolders.length === 0) {
        (0, outputChannel_1.getOutputChannel)().appendLine('Ament task provider requires a workspace root.');
        (0, outputChannel_1.getOutputChannel)().show(true);
        return;
    }
    (0, outputChannel_1.getOutputChannel)().appendLine(`Activating with ${workspaceFolders.length} workspace folder(s).`);
    workspaceFolders.forEach((workspaceFolder) => registerWorkspaceFolder(context, workspaceFolder));
    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders((event) => {
        event.added.forEach((workspaceFolder) => registerWorkspaceFolder(context, workspaceFolder));
        event.removed.forEach((workspaceFolder) => unregisterWorkspaceFolder(workspaceFolder));
    }));
}
exports.activate = activate;
function deactivate() {
    for (const entry of providers.values()) {
        entry.registration.dispose();
        entry.provider.dispose();
    }
    providers.clear();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map