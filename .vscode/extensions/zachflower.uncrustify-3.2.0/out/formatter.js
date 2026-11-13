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
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const u = require("util");
const temp = require("temp");
const vsc = require("vscode");
const logger = require("./logger");
const util = require("./util");
temp.track();
class Formatter {
    constructor() {
        this.tempDir = null;
        this.tempFileName = null;
    }
    provideDocumentFormattingEdits(document, options, token) {
        return this.format(document, null, options, token);
    }
    provideDocumentRangeFormattingEdits(document, range, options, token) {
        return this.format(document, range, options, token);
    }
    provideOnTypeFormattingEdits(document, position, ch, options, token) {
        return this.format(document, new vsc.Range(new vsc.Position(0, 0), position), options, token);
    }
    format(document, range, options, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const configuration = vsc.workspace.getConfiguration("uncrustify", document.uri);
            const useTempFile = configuration.get('useTempFile');
            const useReplaceOption = configuration.get('useReplaceOption');
            const useDirectFile = useTempFile || useReplaceOption;
            if (useTempFile) {
                if (this.tempDir == null) {
                    this.tempDir = yield u.promisify(temp.mkdir)(vsc.env.appName + '.' + "uncrustify");
                    logger.dbg('temporary directory: ' + this.tempDir);
                }
                this.tempFileName = path.join(this.tempDir, path.basename(document.fileName));
                logger.dbg('temporary file: ' + this.tempFileName);
                yield u.promisify(fs.writeFile)(this.tempFileName, document.getText());
            }
            else if (useReplaceOption) {
                yield document.save();
            }
            return yield new Promise((resolve, reject) => {
                token.onCancellationRequested(reject);
                const configPath = util.configPath();
                logger.dbg('config file: ' + configPath);
                try {
                    fs.accessSync(configPath);
                }
                catch (err) {
                    logger.dbg('error accessing config file: ' + err);
                    vsc.window.showErrorMessage('The uncrustify config file path is incorrect: ' + configPath);
                    reject(err);
                    return;
                }
                const args = ['-l', languageMap[document.languageId], '-c', configPath];
                let output = Buffer.alloc(0);
                let error = '';
                if (range) {
                    args.push('--frag');
                }
                // This option helps you if the document saved as UTF8 with BOM, though not able to format it partially.
                if (useDirectFile) {
                    args.push('--replace');
                    args.push('--no-backup');
                    args.push(useTempFile ? this.tempFileName : document.fileName);
                }
                const uncrustify = cp.spawn(util.executablePath(), args);
                const text = document.getText(range);
                logger.dbg(`launched: ${util.executablePath()} ${args.join(' ')}`);
                uncrustify.on('error', reject);
                uncrustify.on('exit', (code) => __awaiter(this, void 0, void 0, function* () {
                    logger.dbg('uncrustify exited with status: ' + code);
                    if (code < 0) {
                        vsc.window.showErrorMessage('Uncrustify exited with error code: ' + code);
                        reject(code);
                    }
                    else if (useTempFile) {
                        const result = yield u.promisify(fs.readFile)(this.tempFileName);
                        resolve([new vsc.TextEdit(this.getRange(document, range), result.toString())]);
                    }
                }));
                uncrustify.stdout.on('data', data => output = Buffer.concat([output, Buffer.from(data)]));
                uncrustify.stdout.on('close', () => {
                    if (useDirectFile) {
                        return;
                    }
                    const result = output.toString();
                    if (result.length == 0 && text.length > 0) {
                        reject();
                    }
                    else {
                        resolve([new vsc.TextEdit(this.getRange(document, range), result)]);
                    }
                });
                uncrustify.stderr.on('data', data => error += data.toString());
                uncrustify.stderr.on('close', () => logger.dbg('uncrustify exited with error: ' + error));
                if (!useDirectFile) {
                    uncrustify.stdin.end(text);
                }
            });
        });
    }
    getRange(document, range) {
        const lastLine = document.lineCount - 1;
        const lastCol = document.lineAt(lastLine).text.length;
        return range || new vsc.Range(0, 0, lastLine, lastCol);
    }
}
exports.default = Formatter;
const langOverrides = vsc.workspace.getConfiguration('uncrustify').get('langOverrides');
const languageMap = Object.assign({
    c: 'C',
    cpp: 'CPP',
    csharp: 'CS',
    d: 'D',
    java: 'JAVA',
    'objective-c': 'OC',
    pawn: 'PAWN',
    pde: 'JAVA',
    vala: 'VALA'
}, langOverrides);
//# sourceMappingURL=formatter.js.map