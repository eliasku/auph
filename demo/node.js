const auph = require("auph");

// initialize mixer and run
auph.init();
auph.resume();

// load clap sound
const clap = auph.load("../tester/assets/mp3/CLAP.mp3", 0);
console.info(clap);

// load music stream
const music = auph.load("../tester/assets/mp3/Kalimba.mp3", auph.STREAM);
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