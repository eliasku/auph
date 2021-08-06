import * as Auph from "auph";

const BUS_MASTER = 0;
const BUS_SFX = 1;
const BUS_MUSIC = 2;

let streamSource = null;
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
    Auph.init();
});
$("#resume").addEventListener("click", () => {
    Auph.resume();
});
$("#pause").addEventListener("click", () => {
    Auph.pause();
});
$("#shutdown").addEventListener("click", () => {
    Auph.shutdown();
});

$("#load-stream").addEventListener("click", () => {
    streamSource = Auph.loadAudioSource("assets/mp3/Kalimba.mp3", true);
    $("#play-stream").innerText = "Play";
});

$("#play-stream").addEventListener("click", (ev) => {
    if (!streamVoice) {
        streamVoice = Auph.play(streamSource,
            $("#volume").value,
            $("#pan").value,
            $("#pitch").value,
            false, false, BUS_MUSIC);
    } else {
        const paused = !Auph.getPause(streamVoice);
        Auph.setPause(streamVoice, paused);
        ev.target.innerText = paused ? "Resume" : "Pause";
    }
});

$("#stop-stream").addEventListener("click", () => {
    $("#play-stream").innerText = "Play";
    Auph.stop(streamVoice);
    streamVoice = null;
});

$("#volume").addEventListener("input", (ev) => {
    Auph.setVolume(streamVoice, ev.target.value);
});

$("#pan").addEventListener("input", (ev) => {
    Auph.setPan(streamVoice, ev.target.value);
});

$("#pitch").addEventListener("input", (ev) => {
    Auph.setPitch(streamVoice, ev.target.value);
});

$("#load-buffer").addEventListener("click", () => {
    bufferSource = Auph.loadAudioSource("assets/mp3/FUNKY_HOUSE.mp3", false);
});

$("#play-buffer").addEventListener("click", (ev) => {
    if (!bufferVoice) {
        bufferVoice = Auph.play(bufferSource, 1, 0, 1, false, $("#loop-buffer").checked);
    } else {
        const paused = !Auph.getPause(bufferVoice);
        Auph.setPause(bufferVoice, paused);
        ev.target.innerText = paused ? "Resume" : "Pause";
    }
});

$("#stop-buffer").addEventListener("click", () => {
    Auph.stop(bufferVoice);
    bufferVoice = null;
    $("#play-buffer").innerText = "Play";
});

$("#loop-buffer").addEventListener("input", (ev) => {
    if (bufferVoice) {
        Auph.setLoop(bufferVoice, ev.target.checked);
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
    multiSources = sources.map((src) => Auph.loadAudioSource(src, false));
});

$("#play-multi").addEventListener("click", () => {
    if (multiSources && multiSources.length > 0) {
        const index = (Math.random() * multiSources.length) | 0;
        const source = multiSources[index];
        Auph.play(source);
    }
});

$("#stop-multi").addEventListener("click", () => {
    if (multiSources) {
        for (const source of multiSources) {
            Auph.stopAudioSource(source);
        }
    }
});

setInterval(() => {
    $("#info").innerHTML = `<table>
<tr><td>Voices</td><td>${Auph.getInteger(Auph.VOICES_IN_USE)}</td></tr>
<tr><td>Streams</td><td>${Auph.getInteger(Auph.STREAMS_IN_USE)}</td></tr>
<tr><td>Source Buffers</td><td>${Auph.getInteger(Auph.BUFFERS_LOADED)}</td></tr>
<tr><td>Sample Rate</td><td>${Auph.getInteger(Auph.SAMPLE_RATE)}</td></tr>
</table>`;

    if(Auph.getVoiceState(streamVoice) & 1) {
        const len = Auph.getVoiceLength(streamVoice);
        const pos = Auph.getVoicePosition(streamVoice);
        $("#stream-playback-info").innerText = pos + " / " + len;
    }

}, 300);

let clapSource = null;
$("#load-clap").addEventListener("click", () => {
    if (!clapSource) {
        clapSource = Auph.loadAudioSource("assets/mp3/CLAP.mp3", false);
    }
});

$("#run-random-paused").addEventListener("click", () => {
    if (clapSource) {
        let delay = 0;
        for (let i = 0; i < 10; ++i) {
            const voice = Auph.play(clapSource, 1, 0, 1, true);
            Auph.setPitch(voice, 0.5 + Math.random());
            Auph.setVolume(voice, 0.5 + 0.5 * Math.random());
            Auph.setPan(voice, 2 * Math.random() - 1);
            setTimeout(() => {
                Auph.setPause(voice, false);
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
            const voice = Auph.play(clapSource, 1, 0, pitch, true);
            setTimeout(() => {
                Auph.setPause(voice, false);
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
            const voice = Auph.play(clapSource, vol, 0, 1, true);
            setTimeout(() => {
                Auph.setPause(voice, false);
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
            const voice = Auph.play(clapSource, 1, pan, 1, true);
            setTimeout(() => {
                Auph.setPause(voice, false);
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
    largeBufferSource = Auph.loadAudioSource("assets/ogg/sample1.ogg", false);
});

$("#unload-large-buffer").addEventListener("click", () => {
    Auph.destroyAudioSource(largeBufferSource);
    largeBufferSource = 0;
});

$("#play-large-buffer").addEventListener("click", (ev) => {
    if (!largeBufferVoice) {
        largeBufferVoice = Auph.play(largeBufferSource,
            $("#lb-volume").value,
            $("#lb-pan").value,
            $("#lb-pitch").value,
            false, 0,
            BUS_MUSIC
        );
    } else {
        const paused = !Auph.getPause(largeBufferVoice);
        Auph.setPause(largeBufferVoice, paused);
        ev.target.innerText = paused ? "Resume" : "Pause";
    }
});

$("#stop-large-buffer").addEventListener("click", () => {
    Auph.stop(largeBufferVoice);
    largeBufferVoice = 0;
    $("#play-large-buffer").innerText = "Play";
});

$("#lb-volume").addEventListener("input", (ev) => {
    Auph.setVolume(largeBufferVoice, ev.target.value);
});

$("#lb-pan").addEventListener("input", (ev) => {
    Auph.setPan(largeBufferVoice, ev.target.value);
});

$("#lb-pitch").addEventListener("input", (ev) => {
    Auph.setPitch(largeBufferVoice, ev.target.value);
});


/**
 * Bus controllers
 */

$("#master-volume").addEventListener("input", (ev) => {
    Auph.setBusVolume(BUS_MASTER, ev.target.value);
});

$("#sfx-volume").addEventListener("input", (ev) => {
    Auph.setBusVolume(BUS_SFX, ev.target.value);
});

$("#music-volume").addEventListener("input", (ev) => {
    Auph.setBusVolume(BUS_MUSIC, ev.target.value);
});

$("#master-enabled").addEventListener("input", (ev) => {
    Auph.setBusEnabled(BUS_MASTER, ev.target.checked);
});

$("#sfx-enabled").addEventListener("input", (ev) => {
    Auph.setBusEnabled(BUS_SFX, ev.target.checked);
});

$("#music-enabled").addEventListener("input", (ev) => {
    Auph.setBusEnabled(BUS_MUSIC, ev.target.checked);
});