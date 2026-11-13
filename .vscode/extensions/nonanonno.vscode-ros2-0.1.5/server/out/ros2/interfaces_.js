"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLineTokenizer = exports.Tokenizer = void 0;
class Context {
    constructor() {
        this.tokens = [];
        this.start = 0;
        this.length = 0;
    }
    accept(kind, value) {
        this.tokens.push({
            kind: kind,
            value: value,
            start: this.start,
            length: this.length
        });
    }
    clear() {
        this.tokens = [];
        this.start = 0;
        this.length = 0;
    }
}
class Tokenizer {
    constructor() {
        this.cxt = new Context();
        this.rules = [];
        this.doDebug = false;
    }
    addRule(re, action) {
        this.rules.push({ re: re, action: action });
    }
    input(text) {
        let line = text;
        loop: while (line.length > 0) {
            for (const rule of this.rules) {
                const m = rule.re.exec(line);
                if (this.doDebug) {
                    console.log(`checks ${rule.re} with '${line}'`);
                }
                if (m && m.index === 0) {
                    if (this.doDebug) {
                        console.log(m);
                    }
                    this.cxt.length = m[0].length;
                    rule.action(this.cxt, m);
                    line = line.substr(this.cxt.length);
                    this.cxt.start += this.cxt.length;
                    continue loop;
                }
            }
            throw new Error(`Missing appropriate rule for ${text}`);
        }
    }
    clear() {
        this.cxt.clear();
    }
    get tokens() {
        return this.cxt.tokens;
    }
}
exports.Tokenizer = Tokenizer;
function createLineTokenizer() {
    const tokenizer = new Tokenizer();
    tokenizer.addRule(/[a-zA-Z][a-zA-Z0-9_/]*/, (cxt, match) => {
        cxt.accept("identifier", match[0]);
    });
    tokenizer.addRule(/[+-]?[0-9]*\.?[0-9]+([eE][+-]?\d+)?/, (cxt, match) => {
        cxt.accept("number", match[0]);
    });
    tokenizer.addRule(/"(.*?)"/, (cxt, match) => {
        cxt.accept("string", match[1]);
    });
    tokenizer.addRule(/'(.*?)'/, (cxt, match) => {
        cxt.accept("string", match[1]);
    });
    [/<=/, /\[/, /\]/, /,/, /=/].forEach((re) => {
        tokenizer.addRule(re, (cxt, match) => {
            cxt.accept("symbol", match[0]);
        });
    });
    tokenizer.addRule(/#.*$/, (cxt, match) => {
        cxt.accept("comment", match[0]);
    });
    tokenizer.addRule(/-+/, (cxt, match) => {
        cxt.accept("separator", match[0]);
    });
    tokenizer.addRule(/( |\t)+/, (cxt, match) => {
        return;
    });
    // no match
    tokenizer.addRule(/./, (cxt, match) => {
        console.warn("Failed to tokenize ", match);
    });
    return tokenizer;
}
exports.createLineTokenizer = createLineTokenizer;
//# sourceMappingURL=interfaces_.js.map