"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatformSuffix = exports.getExtensionConfig = exports.getWorkspacePath = exports.executablePath = exports.configPath = exports.modes = void 0;
const path = require("path");
const vsc = require("vscode");
const DEFAULT_CONFIG_FILE_NAME = 'uncrustify.cfg';
const DEFAULT_PATH = 'uncrustify';
const DEFAULT_MODES = [
    'c',
    'cpp',
    'csharp',
    'd',
    'java',
    'objective-c',
    'pawn',
    'pde',
    'vala'
];
const SUPPORTED_PLATFORM_NAMES = {
    'linux': '.linux',
    'darwin': '.osx',
    'win32': '.windows'
};
/**
 * Retrieves the uncrustify language settings.
 *
 * @return Array of default language modes and any configured overrides.
 */
function modes() {
    const config = getExtensionConfig();
    const overrides = config.get('langOverrides', {});
    return DEFAULT_MODES.concat(Object.getOwnPropertyNames(overrides));
}
exports.modes = modes;
/**
 * Retrieves the configured path to the `uncrustify` configuration file.
 *
 * @return An absolute path to an `uncrustify` configuration file.
 */
function configPath() {
    const folderUri = getWorkspacePath();
    const config = getExtensionConfig(folderUri);
    let p = config.get(`configPath${getPlatformSuffix()}`, DEFAULT_CONFIG_FILE_NAME);
    // interpret environment variables
    p = p.replace(/(%\w+%)|(\$\w+)/g, variable => {
        const end = variable.startsWith('%') ? 2 : 1;
        return process.env[variable.substr(1, variable.length - end)];
    });
    // interpret ${workspaceFolder} variable
    p = p.replace(/\$\{workspaceFolder\}/, (_, name) => {
        return folderUri.fsPath;
    });
    // interpret ${workspaceFolder:<folder>} variables
    p = p.replace(/\$\{workspaceFolder:(.*?)\}/, (_, name) => {
        return vsc.workspace.workspaceFolders.find(wf => wf.name == name).uri.fsPath;
    });
    // prefix relative paths with the detected workspace folder
    if (!path.isAbsolute(p)) {
        p = path.join(folderUri.fsPath, p);
    }
    return p;
}
exports.configPath = configPath;
/**
 * Retrieves the configured `uncrustify` executable path.
 *
 * @return The path or name of the `uncrustify` executable.
 */
function executablePath() {
    const config = getExtensionConfig();
    return config.get(`executablePath${getPlatformSuffix()}`, DEFAULT_PATH);
}
exports.executablePath = executablePath;
/**
 * Determines the workspace path relative to the currently open document, or the
 * first workspace found.
 *
 * @return A workspace folder.
 */
function getWorkspacePath() {
    let folderUri;
    const workspaces = vsc.workspace.workspaceFolders || [];
    const textEditors = [vsc.window.activeTextEditor];
    if (workspaces.length === 0) {
        return folderUri;
    }
    textEditors.push(...vsc.window.visibleTextEditors);
    // if there is a document open in the editor, use its workspace folder
    for (const textEditor of textEditors.filter(e => e)) {
        const workspace = vsc.workspace.getWorkspaceFolder(textEditor.document.uri);
        if (workspace) {
            return workspace.uri;
        }
    }
    return workspaces[0].uri;
}
exports.getWorkspacePath = getWorkspacePath;
/**
 * Retrieves the extension configuration object for the `uncrustify` extension
 *
 * @param folderUri A scope for which the configuration is asked for.
 *
 * @return The `uncrustify` extension configuration object
 */
function getExtensionConfig(folderUri) {
    return vsc.workspace.getConfiguration('uncrustify', folderUri !== null && folderUri !== void 0 ? folderUri : getWorkspacePath());
}
exports.getExtensionConfig = getExtensionConfig;
/**
 * Retrieves the configuration suffix for the current platform
 *
 * @param platform The platform to retrieve the platform suffix for
 *
 * @return The platform configuration suffix
 */
function getPlatformSuffix(platform) {
    return SUPPORTED_PLATFORM_NAMES[platform !== null && platform !== void 0 ? platform : process.platform];
}
exports.getPlatformSuffix = getPlatformSuffix;
//# sourceMappingURL=util.js.map