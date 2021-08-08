const Auph = require("auph-node");

// initialize mixer and run
Auph.init();
Auph.resume();

// load clap sound
const clap = Auph.load("../tester/assets/mp3/CLAP.mp3", false);
console.info(clap);

// load music stream
const music = Auph.load("../tester/assets/mp3/Kalimba.mp3", true);
console.info(music);

const musicVoice = Auph.play(music);

function usin(t) {
    return 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
}

let t = 0.0;
setInterval(() => {
    t += 0.01;
    Auph.setPitch(musicVoice, 0.25 + usin(t));
}, 30);

setInterval(() => {
    Auph.play(clap, 1 - usin(t), 0, 1);
}, 720);