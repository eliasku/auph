module.exports = function (m) {
    const path = require("path");
    const p = path.dirname(require.resolve(m + "/package.json"));
    return path.resolve(p, "include");
};