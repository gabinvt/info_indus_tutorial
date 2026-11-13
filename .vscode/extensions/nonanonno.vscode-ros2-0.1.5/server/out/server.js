"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const server_1 = require("./ros2/server");
const connection = node_1.createConnection(node_1.ProposedFeatures.all);
const server = new server_1.Server(connection);
connection.listen();
//# sourceMappingURL=server.js.map