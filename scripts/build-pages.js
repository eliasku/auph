const fs = require("fs");
const path = require('path');

const rootDir = path.resolve(__dirname, "..");
const pagesDir = path.resolve(rootDir, "pages");

try {
    fs.mkdirSync(pagesDir);
} catch {
}

copyFolderRecursiveSync(path.join(rootDir, "demo/assets"), pagesDir);
copyFolderRecursiveSync(path.join(rootDir, "demo/dist"), pagesDir);
fs.copyFileSync(path.join(rootDir, "demo/index.html"), path.join(pagesDir, "index.html"));

fs.copyFileSync(path.join(rootDir, "web/dist/browser/auph.js"), path.join(pagesDir, "auph.js"));
fs.copyFileSync(path.join(rootDir, "web/dist/browser/auph.js.map"), path.join(pagesDir, "auph.js.map"));
fs.copyFileSync(path.join(rootDir, "web/dist/types/index.d.ts"), path.join(pagesDir, "auph.d.ts"));

function copyFileSync(source, target) {
    let targetFile = target;
    if (fs.existsSync(target)) {
        if (fs.lstatSync(target).isDirectory()) {
            targetFile = path.join(target, path.basename(source));
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync(source, target) {
    let files = [];

    const targetFolder = path.join(target, path.basename(source));
    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder);
    }

    if (fs.lstatSync(source).isDirectory()) {
        files = fs.readdirSync(source);
        files.forEach(function (file) {
            const curSource = path.join(source, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, targetFolder);
            } else {
                copyFileSync(curSource, targetFolder);
            }
        });
    }
}