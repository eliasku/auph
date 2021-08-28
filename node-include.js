module.exports = function (m) {
    const path = require("path");
    const p = path.dirname(require.resolve(m + "/package.json"));
    // we need escape special symbols to pass -I option (win32 suffers)
    return `"${path.resolve(p, "include")}"`;
};