"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOutputChannel = void 0;
const vscode = require("vscode");
let channel;
function getOutputChannel() {
    if (!channel) {
        channel = vscode.window.createOutputChannel('Ament Task Provider');
    }
    return channel;
}
exports.getOutputChannel = getOutputChannel;
//# sourceMappingURL=outputChannel.js.map