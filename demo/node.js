//const auph = require("auph");
const auph = require("..");
const fs = require("fs");
const path = require("path");

// initialize mixer and run
auph.init();

// console application become active
auph.resume();

// load clap sound
const clap = auph.load(path.resolve(__dirname, "assets/mp3/CLAP.mp3"), 0);
console.info(clap);

// load music stream

const buf = fs.readFileSync(path.resolve(__dirname, "assets/mp3/FUNKY_HOUSE.mp3"));
// const buf = fs.readFileSync(path.resolve(__dirname, "assets/mp3/Kalimba.mp3"));
console.info(buf.byteLength);
const music = auph.loadMemory(buf, auph.STREAM);
//const music = auph.loadMemory(fs.readFileSync(path.resolve(__dirname, "assets/mp3/FUNKY_HOUSE.mp3")), 0);

//const music = auph.load(path.resolve(__dirname, "assets/mp3/FUNKY_HOUSE.mp3"), auph.STREAM);
//const music = auph.load(path.resolve(__dirname, "assets/mp3/Kalimba.mp3"), auph.STREAM);
//const music = auph.load(path.resolve(__dirname, "assets/ogg/sample1.ogg"), auph.STREAM);
console.info(music);

const musicVoice = auph.play(music);

function usin(t) {
    return 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
}

let t = 0.0;
setInterval(() => {
    t += 0.01;
    auph.setRate(musicVoice, 0.25 + usin(t));
}, 30);

setInterval(() => {
    const voice = auph.play(clap, 1 - usin(t), 0, 1);
    console.info(voice);
}, 720 / 4);