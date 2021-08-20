/// import * as auph from "auph"

auph.init();

let streamSource = 0;
let streamVoice = 0;

let bufferSource = 0;
let bufferVoice = 0;

let shortStreamBuffer = 0;
let shortStreamVoice = 0;

function clearState() {
    streamSource = 0;
    streamVoice = 0;
    bufferSource = 0;
    bufferVoice = 0;
    shortStreamBuffer = 0;
    shortStreamVoice = 0;
}

function $(selector) {
    return document.querySelector(selector);
}

$("#init").addEventListener("click", () => {
    clearState();
    auph.init();
});
$("#resume").addEventListener("click", () => {
    auph.resume();
});
$("#pause").addEventListener("click", () => {
    auph.pause();
});
$("#shutdown").addEventListener("click", () => {
    auph.shutdown();
});

$("#load-stream").addEventListener("click", () => {
    if (!auph.isActive(streamSource)) {
        streamSource = auph.load("assets/mp3/Kalimba-fixed.mp3", auph.STREAM);
        $("#play-stream").innerText = "Play";
    }
});

$("#play-stream").addEventListener("click", (ev) => {
    if (!streamVoice) {
        streamVoice = auph.play(streamSource,
            $("#volume").value,
            $("#pan").value,
            $("#pitch").value,
            false, false, auph.BUS_MUSIC);
    } else {
        const paused = !auph.getPause(streamVoice);
        auph.setPause(streamVoice, paused);
        ev.target.innerText = paused ? "Resume" : "Pause";
    }
});

$("#stop-stream").addEventListener("click", () => {
    $("#play-stream").innerText = "Play";
    auph.stop(streamVoice);
    streamVoice = 0;
});

$("#volume").addEventListener("input", (ev) => {
    auph.setGain(streamVoice, ev.target.value);
});

$("#pan").addEventListener("input", (ev) => {
    auph.setPan(streamVoice, ev.target.value);
});

$("#pitch").addEventListener("input", (ev) => {
    auph.setRate(streamVoice, ev.target.value);
});

/** Short stream looping **/

$("#load-short-stream").addEventListener("click", () => {
    if (!auph.isActive(shortStreamBuffer)) {
        $("#load-short-stream").setAttribute("disabled", "disabled");
        fetch(new Request("assets/mp3/examples_beat.mp3")).then((a) => {
            return a.arrayBuffer();
        }).then((arrayBuffer) => {
            shortStreamBuffer = auph.loadMemory(new Uint8Array(arrayBuffer), auph.STREAM);
            $("#load-short-stream").removeAttribute("disabled");
        });
    }
});

$("#play-short-stream").addEventListener("click", (ev) => {
    if (auph.isActive(shortStreamVoice)) {
        const paused = !auph.getPause(shortStreamVoice);
        auph.setPause(shortStreamVoice, paused);
        ev.target.innerText = paused ? "Resume" : "Pause";
    } else {
        shortStreamVoice = auph.play(shortStreamBuffer, 1, 0, 1, $("#loop-short-stream").checked);
    }
});

$("#stop-short-stream").addEventListener("click", () => {
    auph.stop(shortStreamVoice);
    shortStreamVoice = 0;
    $("#play-short-stream").innerText = "Play";
});

$("#loop-short-stream").addEventListener("input", (ev) => {
    if (auph.isActive(shortStreamVoice)) {
        auph.setLoop(shortStreamVoice, ev.target.checked);
    }
});

/** short static audio buffer **/

$("#load-buffer").addEventListener("click", () => {
    if (!auph.isActive(bufferSource)) {
        $("#load-buffer").setAttribute("disabled", "disabled");
        fetch(new Request("assets/mp3/FUNKY_HOUSE.mp3")).then((a) => {
            return a.arrayBuffer();
        }).then((arrayBuffer) => {
            bufferSource = auph.loadMemory(new Uint8Array(arrayBuffer), 0);
            $("#load-buffer").removeAttribute("disabled");
        });
    }
});

$("#play-buffer").addEventListener("click", (ev) => {
    if (auph.isActive(bufferVoice)) {
        const paused = !auph.getPause(bufferVoice);
        auph.setPause(bufferVoice, paused);
        ev.target.innerText = paused ? "Resume" : "Pause";
    } else {
        bufferVoice = auph.play(bufferSource, 1, 0, 1, $("#loop-buffer").checked);
    }
});

$("#stop-buffer").addEventListener("click", () => {
    auph.stop(bufferVoice);
    bufferVoice = 0;
    $("#play-buffer").innerText = "Play";
});

$("#loop-buffer").addEventListener("input", (ev) => {
    if (bufferVoice) {
        auph.setLoop(bufferVoice, ev.target.checked);
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
    for (let i = 0; i < sources.length; ++i) {
        if (!auph.isActive(multiSources[i])) {
            multiSources[i] = auph.load(sources[i], 0);
        }
    }
});

$("#play-multi").addEventListener("click", () => {
    if (multiSources && multiSources.length > 0) {
        const index = (Math.random() * multiSources.length) | 0;
        const source = multiSources[index];
        auph.play(source);
    }
});

$("#stop-multi").addEventListener("click", () => {
    if (multiSources) {
        for (const source of multiSources) {
            auph.stop(source);
        }
    }
});

setInterval(() => {
    $("#info").innerHTML = `<table>
<tr><td>Mixer</td><td>${auph.getMixerStateString(auph.get(auph.MIXER, auph.STATE))}</td></tr>
<tr><td>Sample Rate</td><td>${auph.get(auph.MIXER, auph.SAMPLE_RATE)}</td></tr>

<tr><td>Active Voices</td><td>${auph.get(auph.VOICE, auph.COUNT | auph.ACTIVE)}</td></tr>
<tr><td>Running Voices</td><td>${auph.get(auph.VOICE, auph.COUNT | auph.ACTIVE | auph.RUNNING)}</td></tr>
<tr><td>Looped Voices</td><td>${auph.get(auph.VOICE, auph.COUNT | auph.ACTIVE | auph.LOOP)}</td></tr>

<tr><td>Active Buffers</td><td>${auph.get(auph.BUFFER, auph.COUNT | auph.ACTIVE)}</td></tr>
<tr><td>Stream Buffers</td><td>${auph.get(auph.BUFFER, auph.COUNT | auph.ACTIVE | auph.STREAM)} (for web all streams are static)</td></tr>

</table>`;

    if (auph.isActive(streamVoice)) {
        const len = auph.getDuration(streamVoice);
        const pos = auph.getCurrentTime(streamVoice);
        $("#stream-playback-info").innerText = pos + " / " + len;
    } else if (streamSource) {
        const st = auph.get(streamSource, auph.STATE);
        $("#stream-playback-info").innerText = auph.getBufferStateString(st);
    }

}, 300);

let clapSource = 0;
$("#load-clap").addEventListener("click", () => {
    if (!auph.isActive(clapSource)) {
        clapSource = auph.load("assets/mp3/CLAP.mp3", 0);
    }
});

$("#run-random-paused").addEventListener("click", () => {
    if (clapSource) {
        let delay = 0;
        for (let i = 0; i < 10; ++i) {
            const voice = auph.play(clapSource, 1, 0, 1, false, true);
            auph.setGain(voice, 0.5 + 0.5 * Math.random());
            auph.setPan(voice, 2 * Math.random() - 1);
            auph.setRate(voice, 0.5 + Math.random());
            setTimeout(() => {
                auph.setPause(voice, false);
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
            const voice = auph.play(clapSource, 1, 0, pitch, false, true);
            setTimeout(() => {
                auph.setPause(voice, false);
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
            const voice = auph.play(clapSource, vol, 0, 1, false, true);
            setTimeout(() => {
                auph.setPause(voice, false);
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
            const voice = auph.play(clapSource, 1, pan, 1, false, true);
            setTimeout(() => {
                auph.setPause(voice, false);
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
    if (!auph.isActive(largeBufferSource)) {
        largeBufferSource = auph.load("assets/mp3/Kalimba-fixed.mp3", 0);
        //largeBufferSource = auph.load("assets/ogg/sample1.ogg", 0);
    }
});

$("#unload-large-buffer").addEventListener("click", () => {
    auph.unload(largeBufferSource);
    largeBufferSource = 0;
});

$("#play-large-buffer").addEventListener("click", (ev) => {
    if (!largeBufferVoice) {
        largeBufferVoice = auph.play(largeBufferSource,
            $("#lb-volume").value,
            $("#lb-pan").value,
            $("#lb-pitch").value,
            false, false,
            auph.BUS_MUSIC
        );
    } else {
        const paused = !auph.getPause(largeBufferVoice);
        auph.setPause(largeBufferVoice, paused);
        ev.target.innerText = paused ? "Resume" : "Pause";
    }
});

$("#stop-large-buffer").addEventListener("click", () => {
    auph.stop(largeBufferVoice);
    largeBufferVoice = 0;
    $("#play-large-buffer").innerText = "Play";
});

$("#lb-volume").addEventListener("input", (ev) => {
    auph.setGain(largeBufferVoice, ev.target.value);
});

$("#lb-pan").addEventListener("input", (ev) => {
    auph.setPan(largeBufferVoice, ev.target.value);
});

$("#lb-pitch").addEventListener("input", (ev) => {
    auph.setRate(largeBufferVoice, ev.target.value);
});


/**
 * Bus controllers
 */

$("#master-volume").addEventListener("input", (ev) => {
    auph.setGain(auph.BUS_MASTER, ev.target.value);
});

$("#sfx-volume").addEventListener("input", (ev) => {
    auph.setGain(auph.BUS_SFX, ev.target.value);
});

$("#music-volume").addEventListener("input", (ev) => {
    auph.setGain(auph.BUS_MUSIC, ev.target.value);
});

$("#speech-volume").addEventListener("input", (ev) => {
    auph.setGain(auph.BUS_SPEECH, ev.target.value);
});

$("#master-enabled").addEventListener("input", (ev) => {
    auph.setPause(auph.BUS_MASTER, !ev.target.checked);
});

$("#sfx-enabled").addEventListener("input", (ev) => {
    auph.setPause(auph.BUS_SFX, !ev.target.checked);
});

$("#music-enabled").addEventListener("input", (ev) => {
    auph.setPause(auph.BUS_MUSIC, !ev.target.checked);
});

$("#speech-enabled").addEventListener("input", (ev) => {
    auph.setPause(auph.BUS_SPEECH, !ev.target.checked);
});