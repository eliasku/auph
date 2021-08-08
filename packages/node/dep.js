const path = require("path");

const p = path.dirname(require.resolve("auph-cpp/package.json"));

module.exports = {
    includes: [
        path.join(p, "external"),
        path.join(p, "src")
    ]
};