"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extContext = exports.deactivate = exports.activate = void 0;
const fs = require("fs-extra");
const cp = require("child_process");
const vsc = require("vscode");
const logger = require("./logger");
const util = require("./util");
const formatter_1 = require("./formatter");
let extContext;
exports.extContext = extContext;
function activate(context) {
    logger.dbg('extension started');
    exports.extContext = extContext = context;
    const formatter = new formatter_1.default();
    const modes = util.modes();
    context.subscriptions.push(vsc.languages.registerDocumentFormattingEditProvider(modes, formatter));
    context.subscriptions.push(vsc.languages.registerDocumentRangeFormattingEditProvider(modes, formatter));
    context.subscriptions.push(vsc.languages.registerOnTypeFormattingEditProvider(modes, formatter, ';', '}'));
    logger.dbg('registered formatter for modes: ' + modes);
    vsc.commands.registerCommand('uncrustify.create', () => {
        logger.dbg('command: create');
        if (!vsc.workspace.workspaceFolders || !vsc.workspace.workspaceFolders.length) {
            return vsc.window.showWarningMessage('No folder is open');
        }
        let output = '';
        const error = new Error('Configuration file already exists');
        return fs.access(util.configPath(), fs.constants.F_OK)
            .then(() => vsc.window.showWarningMessage('Configuration file already exists', 'Overwrite')
            .then(choice => {
            if (choice !== 'Overwrite') {
                throw error;
            }
        }))
            .catch(e => {
            if (e === error) {
                throw e;
            }
            else {
                return fs.ensureFile(util.configPath());
            }
        })
            .then(() => new Promise(resolve => cp.spawn(util.executablePath(), ['-c', util.configPath(), '--update-config-with-doc'])
            .stdout
            .on('data', data => output += data.toString())
            .on('end', () => resolve(output.replace(/\?\?\?:.*/g, '')))))
            .then((config) => {
            if (config.length > 0) {
                fs.writeFile(util.configPath(), config);
            }
            else {
                vsc.window.showErrorMessage('Configuration could not be created; is Uncrustify correctly installed and configured?');
            }
        })
            .catch(reason => logger.dbg(reason));
    });
    vsc.commands.registerCommand('uncrustify.open', () => vsc.commands.executeCommand('vscode.open', vsc.Uri.file(util.configPath())));
    vsc.commands.registerCommand('uncrustify.save', (config) => __awaiter(this, void 0, void 0, function* () {
        logger.dbg('command: save');
        if (!config) {
            logger.dbg('error saving config: no config passed');
            return;
        }
        try {
            const data = yield new Promise((resolve, reject) => fs.readFile(util.configPath(), (err, data) => {
                if (err) {
                    reject(err);
                }
                resolve(data);
            }));
            let result = data.toString();
            for (const key in config) {
                result = result.replace(new RegExp(`^(${key}\\s*=\\s*)\\S+(.*)`, 'm'), `$1${config[key]}$2`);
            }
            return yield new Promise((resolve, reject) => fs.writeFile(util.configPath(), result, err => {
                if (err) {
                    reject(err);
                }
                resolve();
                logger.dbg('saved config file');
            }));
        }
        catch (reason) {
            return logger.dbg('error saving config file: ' + reason);
        }
    }));
    vsc.commands.registerCommand('uncrustify.savePreset', (config, name) => __awaiter(this, void 0, void 0, function* () {
        logger.dbg('command: savePreset');
        if (!config) {
            logger.dbg('error saving preset: no config passed');
            return;
        }
        const promise = name !== undefined
            ? Promise.resolve(name)
            : vsc.window.showInputBox({ placeHolder: 'Name of the preset' });
        const chosenName = yield promise;
        if (!chosenName && name === undefined) {
            vsc.window.showErrorMessage('Name can\'t be empty !');
            throw new Error('Name is empty');
        }
        const presets = extContext.globalState.get('presets', {});
        presets[chosenName] = config;
        logger.dbg('saved preset ' + chosenName);
        yield extContext.globalState.update('presets', presets);
        return yield ((name === undefined) && vsc.window.showInformationMessage('Preset saved !'));
    }));
    presetCommand('loadPreset', (presets, name, internal) => __awaiter(this, void 0, void 0, function* () {
        logger.dbg('command: loadPreset');
        if (!presets || (!name && name !== '')) {
            logger.dbg('error loading presets');
            return;
        }
        yield vsc.commands.executeCommand('uncrustify.create');
        yield vsc.commands.executeCommand('uncrustify.save', presets[name]);
        if (!internal) {
            vsc.window.showInformationMessage('Preset loaded !');
        }
    }));
    presetCommand('deletePreset', (presets, name, internal) => __awaiter(this, void 0, void 0, function* () {
        logger.dbg('command: deletePreset');
        if (!presets || (!name && name !== '')) {
            logger.dbg('error loading presets');
            return;
        }
        delete presets[name];
        yield extContext.globalState.update('presets', presets);
        return yield (!internal && vsc.window.showInformationMessage('Preset deleted !'));
    }));
    vsc.commands.registerCommand('uncrustify.upgrade', (config) => __awaiter(this, void 0, void 0, function* () {
        logger.dbg('command: upgrade');
        if (!config) {
            logger.dbg('error upgrading config: no config passed');
            return;
        }
        yield vsc.commands.executeCommand('uncrustify.savePreset', config, '');
        yield vsc.commands.executeCommand('uncrustify.loadPreset', '');
        yield vsc.commands.executeCommand('uncrustify.deletePreset', '');
        return yield vsc.commands.executeCommand('vscode.open', vsc.Uri.file(util.configPath()));
    }));
}
exports.activate = activate;
function deactivate() {
    // do nothing
}
exports.deactivate = deactivate;
function presetCommand(commandName, callback) {
    vsc.commands.registerCommand('uncrustify.' + commandName, (name) => __awaiter(this, void 0, void 0, function* () {
        logger.dbg('command: ' + commandName);
        const presets = extContext.globalState.get('presets', {});
        const names = [];
        for (const name in presets) {
            names.push(name);
        }
        if (names.length === 0) {
            vsc.window.showErrorMessage('No presets saved');
            return;
        }
        const promise = name !== undefined
            ? Promise.resolve(name)
            : vsc.window.showQuickPick(names);
        const chosenName = yield promise;
        if (!chosenName && name === undefined) {
            throw new Error('No preset selected');
        }
        return callback(presets, chosenName, name !== undefined);
    }));
}
//# sourceMappingURL=extension.js.map