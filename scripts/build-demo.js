const fs = require("fs");
const path = require("path");

const files = [
    "auph.js",
    "auph.js.map"
];

const srcPath = path.resolve(__dirname, "../web/dist/browser");
const dstPath = path.resolve(__dirname, "../demo/dist");

try {
    fs.mkdirSync(dstPath);
} catch {
}

for (const file of files) {
    fs.copyFileSync(path.join(srcPath, file), path.join(dstPath, file));
}

fs.copyFileSync(path.resolve(__dirname, "../demo/index.js"), path.join(dstPath, "index.js"));