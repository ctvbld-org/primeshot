export function formatAuthError(error) {
    var _a;
    const err = error;
    return {
        message: err.message,
        code: (_a = err.code) !== null && _a !== void 0 ? _a : 'unknown'
    };
}
