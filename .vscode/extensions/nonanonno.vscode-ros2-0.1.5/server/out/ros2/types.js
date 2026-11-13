"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifyTypeKind = exports.packageAndType = exports.isNamespacedType = exports.isBuiltinType = void 0;
function isBuiltinType(name) {
    return /(bool|byte|char|u?int(8|16|32|64)|float(32|64)|w?string)/.test(name);
}
exports.isBuiltinType = isBuiltinType;
function isNamespacedType(name) {
    return /.+\/.+/.test(name);
}
exports.isNamespacedType = isNamespacedType;
function packageAndType(name) {
    const n = name.split('/');
    if (n.length !== 2) {
        return undefined;
    }
    return { pkg: n[0], type: n[1] };
}
exports.packageAndType = packageAndType;
function identifyTypeKind(name) {
    if (isBuiltinType(name)) {
        return 'builtin';
    }
    else if (isNamespacedType(name)) {
        return 'package';
    }
    else {
        return 'this';
    }
}
exports.identifyTypeKind = identifyTypeKind;
//# sourceMappingURL=types.js.map