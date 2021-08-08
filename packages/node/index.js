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
    stopAudioData: Auph.stopAudioData,

    /** Voice parameters control **/
    isVoiceValid: Auph.isVoiceValid,
    getVoiceState: Auph.getVoiceState,
    setPan: Auph.setPan,
    setVolume: Auph.setVolume,
    setPitch: Auph.setPitch,
    setPause: Auph.setPause,
    setLoop: Auph.setLoop,
    getPan: Auph.getPan,
    getVolume: Auph.getVolume,
    getPitch: Auph.getPitch,
    getPause: Auph.getPause,
    getLoop: Auph.getLoop
};