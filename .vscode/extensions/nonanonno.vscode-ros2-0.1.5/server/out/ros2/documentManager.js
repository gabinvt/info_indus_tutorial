"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentManager = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const interfaces_1 = require("./interfaces_");
class Tokenized {
    constructor(tokens) {
        this.tokens = tokens;
    }
    at(position) {
        const line = this.tokens[position.line];
        for (let i = 0; i < line.length; i++) {
            const tmp = line[i];
            if (tmp.start <= position.character && position.character < tmp.start + tmp.length) {
                // The first identifier of the line is type.
                return {
                    isType: tmp.kind === 'identifier' && i === 0,
                    token: tmp
                };
            }
        }
    }
}
class DocumentManager {
    constructor(connection) {
        this.documents = new vscode_languageserver_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
        this.uriTokenized = new Map();
        this.tokenizer = interfaces_1.createLineTokenizer();
        this.documents.listen(connection);
        this.documents.onDidChangeContent(change => {
            const text = change.document.getText();
            const token = [];
            text.split('\n').forEach(line => {
                this.tokenizer.input(line);
                token.push(this.tokenizer.tokens);
                this.tokenizer.clear();
            });
            this.uriTokenized.set(change.document.uri, new Tokenized(token));
        });
    }
}
exports.DocumentManager = DocumentManager;
//# sourceMappingURL=documentManager.js.map