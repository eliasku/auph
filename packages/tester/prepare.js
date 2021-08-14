const fs = require("fs");
const path = require("path");

try {
    fs.mkdirSync("dist");
} catch {
}

const files = [
    "auph.js",
    "auph.js.map"
];

const srcPath = path.resolve(
    path.dirname(require.resolve( "auph/package.json")),
    "web/dist/browser"
);

const dstPath = "dist";
for (const file of files) {
    fs.copyFileSync(path.join(srcPath, file), path.join(dstPath, file));
}