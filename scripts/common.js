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

module.exports = {
    downloadFile
};