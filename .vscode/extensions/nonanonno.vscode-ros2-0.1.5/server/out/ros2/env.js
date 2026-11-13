"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findRos2 = void 0;
const path = require("path");
const fs = require("fs");
const _defaultRoot = '/opt/ros';
const _rosCandidates = ['rolling', 'galactic', 'foxy'];
const _setup = 'setup.bash';
function findRos2(supplied) {
    const candidates = [];
    if (supplied) {
        candidates.push(supplied);
    }
    else {
        for (const distro of _rosCandidates) {
            candidates.push(path.join(_defaultRoot, distro));
        }
    }
    for (const candidate of candidates) {
        const tmp = path.join(candidate, _setup);
        if (fs.existsSync(tmp)) {
            return candidate;
        }
    }
}
exports.findRos2 = findRos2;
//# sourceMappingURL=env.js.map