const Auph = require('bindings')('Auph');

console.log("Welcome to Auph NodeJS");

module.exports = {
    init: Auph.init,
    pause: Auph.pause,
    resume: Auph.resume,
    shutdown: Auph.shutdown,

    load: Auph.load,
    unload: Auph.unload,

    play: Auph.play,
    stop: Auph.stop,
    stopBuffer: Auph.stopBuffer,

    /** Voice parameters control **/
    setVoiceParam: Auph.setVoiceParam,
    getVoiceParam: Auph.getVoiceParam,
    setVoiceFlag: Auph.setVoiceFlag,
    getVoiceState: Auph.getVoiceState,
    getVoiceFlag: Auph.getVoiceFlag,

    setBusParam: Auph.setBusParam,
    getBusParam: Auph.getBusParam,
    setBusFlag: Auph.setBusFlag,
    getBusFlag: Auph.getBusFlag,

    getBufferState: Auph.getBufferState,
    getBufferFlag: Auph.getBufferFlag,
    getBufferParam: Auph.getBufferParam
};