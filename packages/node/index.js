const Auph = require('bindings')('Auph');

console.log("Welcome to Auph NodeJS");

module.exports = {
    init: Auph.init,
    pause: Auph.pause,
    resume: Auph.resume,
    shutdown: Auph.shutdown,

    load: Auph.load,
    unload: Auph.unload,

    play: Auph.play
};