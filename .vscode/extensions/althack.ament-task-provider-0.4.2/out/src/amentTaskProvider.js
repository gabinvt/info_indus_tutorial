"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmentTaskProvider = void 0;
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const outputChannel_1 = require("./outputChannel");
class AmentTaskProvider {
    constructor(workspaceFolder, extensionPath) {
        this.amentPromise = undefined;
        this.workspaceFolder = workspaceFolder;
        this.extensionPath = extensionPath;
        const pattern = path.join(workspaceFolder.uri.fsPath, '**');
        this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
        this.fileWatcher.onDidChange(() => (this.amentPromise = undefined));
        this.fileWatcher.onDidCreate(() => (this.amentPromise = undefined));
        this.fileWatcher.onDidDelete(() => (this.amentPromise = undefined));
    }
    provideTasks() {
        if (!this.amentPromise) {
            this.amentPromise = getAmentTasks(this.workspaceFolder, this.extensionPath);
        }
        return this.amentPromise;
    }
    resolveTask(_task) {
        var _a, _b, _c, _d;
        const task = _task.definition.task;
        // A Ament task consists of a task and an optional file as specified in AmentTaskDefinition
        // Make sure that this looks like a Rake task by checking that there is a task.
        if (task) {
            // resolveTask requires that the same definition object be used.
            const definition = _task.definition;
            let commandOptions = (_a = definition.commandOptions) !== null && _a !== void 0 ? _a : '';
            let path = (_b = definition.path) !== null && _b !== void 0 ? _b : 'src/';
            // Get the environment setting
            let configEnvSetup = vscode.workspace.getConfiguration('ament-task-provider').get('envSetup', '');
            // Override with task setting
            let taskEnvSetup = (_c = definition.envSetup) !== null && _c !== void 0 ? _c : configEnvSetup;
            // Resolve command
            let rosSetupScript = taskEnvSetup ? `${taskEnvSetup} &&` : '';
            let commandLine = `${rosSetupScript} ament_${definition.task} ${commandOptions} ${path}`;
            return new vscode.Task(
            /*task definition*/ definition, 
            /*task scope*/ (_d = _task.scope) !== null && _d !== void 0 ? _d : this.workspaceFolder, 
            /*name*/ definition.task, 
            /*source*/ 'ament', 
            /*execution*/ new vscode.ShellExecution(commandLine));
        }
        return undefined;
    }
    dispose() {
        this.fileWatcher.dispose();
    }
}
exports.AmentTaskProvider = AmentTaskProvider;
AmentTaskProvider.AmentType = 'ament';
async function getAmentTasks(workspaceFolder, extensionPath) {
    // create a task for each linter
    const configuredProblemMatchers = getProblemMatcherTools(extensionPath);
    const discoveredLinters = discoverAmentTools();
    const configuredSet = new Set(configuredProblemMatchers);
    const linters = discoveredLinters;
    const channel = (0, outputChannel_1.getOutputChannel)();
    if (configuredProblemMatchers.length === 0) {
        channel.appendLine('No problem matchers found in package.json; tasks will run without matchers.');
    }
    configuredProblemMatchers.forEach((linter) => {
        channel.appendLine(`Problem matcher found for: ament_${linter}`);
    });
    discoveredLinters
        .filter((linter) => !configuredSet.has(linter))
        .forEach((linter) => channel.appendLine(`Ament tool configured for tasks for ${workspaceFolder.name} without a problem matcher: ament_${linter}`));
    discoveredLinters
        .filter((linter) => configuredSet.has(linter))
        .forEach((linter) => channel.appendLine(`Ament tool configured for tasks for ${workspaceFolder.name} with problem matcher: ament_${linter}`));
    channel.appendLine(`Ament task discovery for ${workspaceFolder.name}: ` + `using ${linters.length} tool(s) found on PATH`);
    const configEnvSetup = vscode.workspace.getConfiguration('ament-task-provider').get('envSetup', '');
    const result = [];
    linters.forEach((linter) => {
        const kind = {
            type: 'ament',
            task: `${linter}`,
            path: 'src/',
            commandOptions: '',
            envSetup: `${configEnvSetup}`,
        };
        let rosSetupScript = kind.envSetup ? `${kind.envSetup} &&` : '';
        const commandLine = `${rosSetupScript} ament_${linter} ${kind.commandOptions} ${kind.path}`;
        const task = new vscode.Task(
        /*task definition*/ kind, 
        /*task scope*/ workspaceFolder, 
        /*name*/ `${linter}`, 
        /*source*/ 'ament', 
        /*execution*/ new vscode.ShellExecution(`${commandLine}`), 
        /*problem matcher*/ configuredSet.has(linter) ? `$ament_${linter}` : undefined);
        result.push(task);
    });
    return result;
}
function discoverAmentTools() {
    var _a;
    const prefix = 'ament_';
    const pathEnv = (_a = process.env.PATH) !== null && _a !== void 0 ? _a : '';
    const entries = new Set();
    for (const dir of pathEnv.split(path.delimiter)) {
        if (!dir) {
            continue;
        }
        let dirEntries;
        try {
            dirEntries = fs.readdirSync(dir);
        }
        catch {
            continue;
        }
        for (const entry of dirEntries) {
            if (!entry.startsWith(prefix)) {
                continue;
            }
            const fullPath = path.join(dir, entry);
            try {
                const stat = fs.statSync(fullPath);
                if (!stat.isFile()) {
                    continue;
                }
            }
            catch {
                continue;
            }
            entries.add(entry.slice(prefix.length));
        }
    }
    return Array.from(entries).sort();
}
function getProblemMatcherTools(extensionPath) {
    var _a, _b;
    try {
        const packageJsonPath = path.join(extensionPath, 'package.json');
        const raw = fs.readFileSync(packageJsonPath, 'utf8');
        const data = JSON.parse(raw);
        const matchers = (_b = (_a = data.contributes) === null || _a === void 0 ? void 0 : _a.problemMatchers) !== null && _b !== void 0 ? _b : [];
        const tools = matchers
            .map((matcher) => matcher.name)
            .filter((name) => typeof name === 'string' && name.startsWith('ament_'))
            .map((name) => name.slice('ament_'.length));
        return Array.from(new Set(tools)).sort();
    }
    catch {
        return [];
    }
}
//# sourceMappingURL=amentTaskProvider.js.map