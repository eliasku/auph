const fs = require("fs");
const path = require("path");
const {https} = require("follow-redirects");

function makeDirs(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
    }
}

function ensureFileDir(dest) {
    makeDirs(path.dirname(dest));
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        ensureFileDir(dest);
        const file = fs.createWriteStream(dest);
        console.info("download: " + url);
        https.get(url, function (response) {
            response.pipe(file);
            file.on('finish', () => {
                console.info("saved: ", dest);
                resolve();
            }).on('error', (e) => {
                console.error("file save error:", e);
                reject(e);
            })
        }).on('error', (e) => {
            console.error("https request error:", e);
            reject(e);
        });
    });
}

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

module.exports = {
    downloadFile,
    copyFolderRecursiveSync
};