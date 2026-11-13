"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const path = require("path");
const node_1 = require("vscode-languageclient/node");
class Client {
    constructor(context) {
        let serverModule = context.asAbsolutePath(Client.serverPath);
        let debugOptions = { execArgv: Client.debugOptions };
        let serverOptions = {
            run: { module: serverModule, transport: node_1.TransportKind.ipc },
            debug: {
                module: serverModule,
                transport: node_1.TransportKind.ipc,
                options: debugOptions
            }
        };
        let clientOptions = {
            documentSelector: [{ scheme: 'file', language: Client.language.language }]
        };
        this.client = new node_1.LanguageClient(Client.language.id, Client.language.name, serverOptions, clientOptions);
    }
    activate() {
        this.client.start();
    }
    deactivate() {
        if (!this.client) {
            return undefined;
        }
        return this.client.stop();
    }
}
exports.Client = Client;
Client.serverPath = path.join('server', 'out', 'server.js');
Client.debugOptions = ['--nolazy', '--inspect=6009'];
Client.language = { language: 'ros2.interface', id: 'ros2Interface', name: 'ROS2 Interface' };
//# sourceMappingURL=client.js.map