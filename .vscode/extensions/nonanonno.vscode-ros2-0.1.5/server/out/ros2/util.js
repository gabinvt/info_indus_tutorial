"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchPatternRecursive = exports.stem = exports.findFilesRecursive = void 0;
const fs = require("fs");
const path = require("path");
function _listFilesRecursive(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(dirent => dirent.isFile() ? [`${dir}/${dirent.name}`] : _listFilesRecursive(`${dir}/${dirent.name}`));
}
function findFilesRecursive(dir, absolute = false) {
    const files = _listFilesRecursive(dir);
    if (absolute) {
        return files.map((f) => path.resolve(f));
    }
    else {
        return files;
    }
}
exports.findFilesRecursive = findFilesRecursive;
function stem(name) {
    const base = path.basename(name);
    const m = /(.+)\.\w*$/.exec(base);
    if (m) {
        return m[1];
    }
    return "";
}
exports.stem = stem;
function _searchPatternRecursive(dir, pattern, skipIf = undefined) {
    const dirents = fs.readdirSync(dir, { withFileTypes: true });
    if (skipIf) {
        for (const dirent of dirents) {
            if (skipIf.test(path.basename(dirent.name))) {
                return [];
            }
        }
    }
    return dirents.flatMap(dirent => {
        if (pattern.test(dirent.name)) {
            return [path.join(dir, dirent.name)];
        }
        if (dirent.isDirectory()) {
            return _searchPatternRecursive(path.join(dir, dirent.name), pattern, skipIf);
        }
        return [];
    });
}
function searchPatternRecursive(dir, pattern, skipIf = undefined, absolute = false) {
    if (!fs.existsSync(dir)) {
        console.warn("no such directory: ", dir);
        return [];
    }
    const m = _searchPatternRecursive(dir, pattern, skipIf);
    if (absolute) {
        return m.map((f) => path.resolve(f));
    }
    else {
        return m;
    }
}
exports.searchPatternRecursive = searchPatternRecursive;
//# sourceMappingURL=util.js.map