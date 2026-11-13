"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const client_1 = require("./lsp/client");
let lspClient;
function activate(context) {
    lspClient = new client_1.Client(context);
    lspClient.activate();
}
exports.activate = activate;
function deactivate() {
    if (!lspClient) {
        return undefined;
    }
    return lspClient.deactivate();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map