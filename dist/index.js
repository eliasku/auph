(function(Auph){'use strict';function _interopNamespace(e){if(e&&e.__esModule)return e;var n=Object.create(null);if(e){Object.keys(e).forEach(function(k){if(k!=='default'){var d=Object.getOwnPropertyDescriptor(e,k);Object.defineProperty(n,k,d.get?d:{enumerable:true,get:function(){return e[k];}});}});}n['default']=e;return Object.freeze(n);}var Auph__namespace=/*#__PURE__*/_interopNamespace(Auph);let streamSource = null;
let streamVoice = undefined;

let bufferSource = null;
let bufferVoice = undefined;

function clearState() {
    streamSource = null;
    streamVoice = undefined;

    bufferSource = null;
    bufferVoice = undefined;
}

function $(selector) {
    return document.querySelector(selector);
}

$("#init").addEventListener("click", () => {
    clearState();
    Auph__namespace.init();
});
$("#resume").addEventListener("click", () => {
    Auph__namespace.resume();
});
$("#pause").addEventListener("click", () => {
    Auph__namespace.pause();
});
$("#shutdown").addEventListener("click", () => {
    Auph__namespace.shutdown();
});

$("#load-stream").addEventListener("click", () => {
    streamSource = Auph__namespace.load("assets/mp3/Kalimba.mp3", true);
    $("#play-stream").innerText = "Play";
});

$("#play-stream").addEventListener("click", (ev) => {
    if (!streamVoice) {
        streamVoice = Auph__namespace.play(streamSource,
            $("#volume").value,
            $("#pan").value,
            $("#pitch").value,
            false, false, Auph__namespace.BUS_MUSIC);
    } else {
        const paused = !Auph__namespace.getPause(streamVoice);
        Auph__namespace.setPause(streamVoice, paused);
        ev.target.innerText = paused ? "Resume" : "Pause";
    }
});

$("#stop-stream").addEventListener("click", () => {
    $("#play-stream").innerText = "Play";
    Auph__namespace.stop(streamVoice);
    streamVoice = null;
});

$("#volume").addEventListener("input", (ev) => {
    Auph__namespace.setVolume(streamVoice, ev.target.value);
});

$("#pan").addEventListener("input", (ev) => {
    Auph__namespace.setPan(streamVoice, ev.target.value);
});

$("#pitch").addEventListener("input", (ev) => {
    Auph__namespace.setPitch(streamVoice, ev.target.value);
});

$("#load-buffer").addEventListener("click", () => {
    bufferSource = Auph__namespace.load("assets/mp3/FUNKY_HOUSE.mp3", false);
});

$("#play-buffer").addEventListener("click", (ev) => {
    if (!bufferVoice) {
        bufferVoice = Auph__namespace.play(bufferSource, 1, 0, 1, false, $("#loop-buffer").checked);
    } else {
        const paused = !Auph__namespace.getPause(bufferVoice);
        Auph__namespace.setPause(bufferVoice, paused);
        ev.target.innerText = paused ? "Resume" : "Pause";
    }
});

$("#stop-buffer").addEventListener("click", () => {
    Auph__namespace.stop(bufferVoice);
    bufferVoice = null;
    $("#play-buffer").innerText = "Play";
});

$("#loop-buffer").addEventListener("input", (ev) => {
    if (bufferVoice) {
        Auph__namespace.setLoop(bufferVoice, ev.target.checked);
    }
});

let multiSources = [];
$("#load-multi").addEventListener("click", () => {
    const sources = [
        "assets/wav/CrashCymbal.wav",
        "assets/wav/HiHat_Closed.wav",
        "assets/wav/HiHat_Open.wav",
        "assets/wav/KickDrum.wav",
        "assets/wav/LowTom.wav",
        "assets/wav/MidTom.wav",
        "assets/wav/RideCymbal.wav",
        "assets/wav/SnareDrum.wav",
    ];
    multiSources = sources.map((src) => Auph__namespace.load(src, false));
});

$("#play-multi").addEventListener("click", () => {
    if (multiSources && multiSources.length > 0) {
        const index = (Math.random() * multiSources.length) | 0;
        const source = multiSources[index];
        Auph__namespace.play(source);
    }
});

$("#stop-multi").addEventListener("click", () => {
    if (multiSources) {
        for (const source of multiSources) {
            Auph__namespace.stopAudioSource(source);
        }
    }
});

setInterval(() => {
    $("#info").innerHTML = `<table>
<tr><td>Device State</td><td>${Auph__namespace.getDeviceStateString(Auph__namespace.getInteger(Auph__namespace.DEVICE_STATE))}</td></tr>
<tr><td>Sample Rate</td><td>${Auph__namespace.getInteger(Auph__namespace.DEVICE_SAMPLE_RATE)}</td></tr>

<tr><td>Voices</td><td>${Auph__namespace.getInteger(Auph__namespace.VOICES_IN_USE)}</td></tr>
<tr><td>Streams</td><td>${Auph__namespace.getInteger(Auph__namespace.STREAMS_IN_USE)}</td></tr>
</table>`;

    if (Auph__namespace.getVoiceState(streamVoice) & 1) {
        const len = Auph__namespace.getVoiceLength(streamVoice);
        const pos = Auph__namespace.getVoicePosition(streamVoice);
        $("#stream-playback-info").innerText = pos + " / " + len;
    } else if (streamSource) {
        const st = Auph__namespace.getAudioDataState(streamSource);
        $("#stream-playback-info").innerText = Auph.getAudioDataStateString(st);
    }

}, 300);

let clapSource = null;
$("#load-clap").addEventListener("click", () => {
    if (!clapSource) {
        clapSource = Auph__namespace.load("assets/mp3/CLAP.mp3", false);
    }
});

$("#run-random-paused").addEventListener("click", () => {
    if (clapSource) {
        let delay = 0;
        for (let i = 0; i < 10; ++i) {
            const voice = Auph__namespace.play(clapSource, 1, 0, 1, true);
            Auph__namespace.setPitch(voice, 0.5 + Math.random());
            Auph__namespace.setVolume(voice, 0.5 + 0.5 * Math.random());
            Auph__namespace.setPan(voice, 2 * Math.random() - 1);
            setTimeout(() => {
                Auph__namespace.setPause(voice, false);
            }, delay);
            delay += 300;
        }
    }
});

$("#run-pitch").addEventListener("click", () => {
    if (clapSource) {
        let delay = 0;
        let pitch = 2.0;
        let delta = -1.75 / 10;
        for (let i = 0; i < 10; ++i) {
            const voice = Auph__namespace.play(clapSource, 1, 0, pitch, true);
            setTimeout(() => {
                Auph__namespace.setPause(voice, false);
            }, delay);
            delay += 300;
            pitch += delta;
        }
    }
});

$("#run-volume").addEventListener("click", () => {
    if (clapSource) {
        let delay = 0;
        let vol = 1;
        let delta = -1.0 / 10;
        for (let i = 0; i < 10; ++i) {
            const voice = Auph__namespace.play(clapSource, vol, 0, 1, true);
            setTimeout(() => {
                Auph__namespace.setPause(voice, false);
            }, delay);
            delay += 300;
            vol += delta;
        }
    }
});
$("#run-pan").addEventListener("click", () => {
    if (clapSource) {
        let delay = 0;
        let pan = -1;
        let delta = 2.0 / 10;
        for (let i = 0; i < 10; ++i) {
            const voice = Auph__namespace.play(clapSource, 1, pan, 1, true);
            setTimeout(() => {
                Auph__namespace.setPause(voice, false);
            }, delay);
            delay += 300;
            pan += delta;
        }
    }
});


/**
 * Large Buffer track
 */

let largeBufferSource = 0;
let largeBufferVoice = 0;

$("#load-large-buffer").addEventListener("click", () => {
    largeBufferSource = Auph__namespace.load("assets/ogg/sample1.ogg", false);
});

$("#unload-large-buffer").addEventListener("click", () => {
    Auph__namespace.unload(largeBufferSource);
    largeBufferSource = 0;
});

$("#play-large-buffer").addEventListener("click", (ev) => {
    if (!largeBufferVoice) {
        largeBufferVoice = Auph__namespace.play(largeBufferSource,
            $("#lb-volume").value,
            $("#lb-pan").value,
            $("#lb-pitch").value,
            false, false,
            Auph__namespace.BUS_MUSIC
        );
    } else {
        const paused = !Auph__namespace.getPause(largeBufferVoice);
        Auph__namespace.setPause(largeBufferVoice, paused);
        ev.target.innerText = paused ? "Resume" : "Pause";
    }
});

$("#stop-large-buffer").addEventListener("click", () => {
    Auph__namespace.stop(largeBufferVoice);
    largeBufferVoice = 0;
    $("#play-large-buffer").innerText = "Play";
});

$("#lb-volume").addEventListener("input", (ev) => {
    Auph__namespace.setVolume(largeBufferVoice, ev.target.value);
});

$("#lb-pan").addEventListener("input", (ev) => {
    Auph__namespace.setPan(largeBufferVoice, ev.target.value);
});

$("#lb-pitch").addEventListener("input", (ev) => {
    Auph__namespace.setPitch(largeBufferVoice, ev.target.value);
});


/**
 * Bus controllers
 */

$("#master-volume").addEventListener("input", (ev) => {
    Auph__namespace.setBusVolume(Auph__namespace.BUS_MASTER, ev.target.value);
});

$("#sfx-volume").addEventListener("input", (ev) => {
    Auph__namespace.setBusVolume(Auph__namespace.BUS_SFX, ev.target.value);
});

$("#music-volume").addEventListener("input", (ev) => {
    Auph__namespace.setBusVolume(Auph__namespace.BUS_MUSIC, ev.target.value);
});

$("#speech-volume").addEventListener("input", (ev) => {
    Auph__namespace.setBusVolume(Auph__namespace.BUS_SPEECH, ev.target.value);
});

$("#master-enabled").addEventListener("input", (ev) => {
    Auph__namespace.setBusEnabled(Auph__namespace.BUS_MASTER, ev.target.checked);
});

$("#sfx-enabled").addEventListener("input", (ev) => {
    Auph__namespace.setBusEnabled(Auph__namespace.BUS_SFX, ev.target.checked);
});

$("#music-enabled").addEventListener("input", (ev) => {
    Auph__namespace.setBusEnabled(Auph__namespace.BUS_MUSIC, ev.target.checked);
});

$("#speech-enabled").addEventListener("input", (ev) => {
    Auph__namespace.setBusEnabled(Auph__namespace.BUS_SPEECH, ev.target.checked);
});}(Auph));//# sourceMappingURL=index.js.map
