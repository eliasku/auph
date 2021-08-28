const {downloadFile} = require("./common");
const path = require("path");

async function run() {
    // TODO: update Oboe source code or mode to dependency
    // await downloadFile("https://github.com/mackron/dr_libs/raw/dev/dr_mp3.h", path.resolve(__dirname, "../src/dr/dr_mp3.h"));
    // await downloadFile("https://github.com/mackron/dr_libs/raw/dev/dr_wav.h", path.resolve(__dirname, "../src/dr/dr_wav.h"));
    // await downloadFile("https://github.com/nothings/stb/raw/dev/stb_vorbis.c", path.resolve(__dirname, "../src/stb/stb_vorbis.c"));
}

run().catch((err) => {
    console.error(err);
    process.exit(-1);
});