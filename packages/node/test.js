const auph = require("auph-node");

auph.init();
auph.resume();

const clap = auph.load("../tester/assets/mp3/CLAP.mp3", false);
console.info(clap);

const music = auph.load("../tester/assets/ogg/sample2.ogg", false);
console.info(music);

auph.play(clap);
auph.play(music);

setTimeout(() => {
    auph.shutdown();
}, 10000);