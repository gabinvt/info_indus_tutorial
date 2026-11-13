"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Package = void 0;
const vscode_uri_1 = require("vscode-uri");
const util_1 = require("./util");
const xpath = require("xpath");
const xmldom_1 = require("xmldom");
const fs = require("fs");
const path = require("path");
class Package {
    /**
     * Creates a new ROS2 package representation.
     *
     * @param p A path to the package.
     */
    constructor(p) {
        this.path = p;
        const doc = new xmldom_1.DOMParser().parseFromString(fs.readFileSync(path.join(p, 'package.xml')).toString());
        const select = xpath.useNamespaces({});
        const name = select('/package/name/text()', doc, true);
        if (name) {
            this.name = name.toString();
        }
        else {
            this.name = undefined;
        }
    }
    /**
     * Gets messages of the package.
     */
    getMessages() {
        return util_1.findFilesRecursive(this.path).filter(file => file.endsWith('.msg')).map(msg => {
            return { name: util_1.stem(msg), path: msg };
        });
    }
    /**
     * Creates a Package from the content path.
     *
     * @param p A path to the content.
     */
    static fromContentPath(p) {
        let dir = path.dirname(p);
        while (dir) {
            if (fs.existsSync(path.join(dir, 'package.xml'))) {
                return new Package(path.join(dir));
            }
            if (dir === '/' || dir === '.') {
                break;
            }
            dir = path.dirname(dir);
        }
    }
    /**
     * Creates a Package from the content uri.
     *
     * @param uri An uri to the content.
     */
    static fromContentUri(uri) {
        return this.fromContentPath(vscode_uri_1.URI.parse(uri).path);
    }
    static searchAtPath(p, skipColconIgnore) {
        const packages = util_1.searchPatternRecursive(p, /package\.xml/, skipColconIgnore ? /COLCON_IGNORE/ : undefined);
        return packages.map((p) => this.fromContentPath(p));
    }
}
exports.Package = Package;
//# sourceMappingURL=package.js.map