const path = require("path");

module.exports = function (m) {
    const p = path.dirname(require.resolve(m + "/package.json"));
    return path.relative(path.join(p, "include"), __dirname);
}