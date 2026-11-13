"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbg = exports.log = exports.hide = exports.show = void 0;
const vsc = require("vscode");
const output = vsc.window.createOutputChannel('Uncrustify');
function show() {
    output.show(true);
}
exports.show = show;
function hide() {
    output.hide();
}
exports.hide = hide;
function log(msg, line = true) {
    if (line) {
        output.appendLine(msg);
    }
    else {
        output.append(msg);
    }
}
exports.log = log;
function dbg(msg, line = true) {
    if (vsc.workspace.getConfiguration('uncrustify').get('debug', false)) {
        const dmsg = 'Debug: ' + msg;
        if (line) {
            output.appendLine(dmsg);
        }
        else {
            output.append(dmsg);
        }
    }
}
exports.dbg = dbg;
//# sourceMappingURL=logger.js.map