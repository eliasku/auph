const fs = require("fs");
const path = require('path');
const {copyFolderRecursiveSync} = require("./common");

const rootDir = path.resolve(__dirname, "..");
const pagesDir = path.resolve(rootDir, "pages");

try {
    fs.mkdirSync(pagesDir);
} catch {
}

copyFolderRecursiveSync(path.join(rootDir, "demo/assets"), pagesDir);
copyFolderRecursiveSync(path.join(rootDir, "demo/dist"), pagesDir);
fs.copyFileSync(path.join(rootDir, "demo/index.html"), path.join(pagesDir, "index.html"));
fs.copyFileSync(path.join(rootDir, "demo/test-api.html"), path.join(pagesDir, "test-api.html"));

fs.copyFileSync(path.join(rootDir, "web/dist/browser/auph.js"), path.join(pagesDir, "auph.js"));
fs.copyFileSync(path.join(rootDir, "web/dist/browser/auph.js.map"), path.join(pagesDir, "auph.js.map"));
fs.copyFileSync(path.join(rootDir, "web/dist/types/index.d.ts"), path.join(pagesDir, "auph.d.ts"));
