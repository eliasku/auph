const fs = require("fs");

fs.copyFileSync(require.resolve("auph/dist/browser/auph.js"), "dist/auph.js");
fs.copyFileSync(require.resolve("auph/dist/browser/auph.js.map"), "dist/auph.js.map");