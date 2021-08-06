(function(){'use strict';var TAG = "[AUPH]";
function log(message) {
    console.log(TAG, message);
}
function warn(message) {
    console.warn(TAG, message);
}
function error(message, reason) {
    console.error(TAG, message, reason);
}
function measure(ts) {
    if (ts === void 0) { ts = 0; }
    return performance.now() - ts;
}var ctx = null;
var unlockEvents = ["mousedown", "pointerdown", "touchstart"];
var unlocked = false;
function getContext() {
    if (!ctx) {
        warn("not initialized");
        return null;
    }
    if (ctx.state === "closed") {
        error("invalid state:", "Context is closed");
        return null;
    }
    return ctx;
}
function getContextState() {
    var state = 0 /* Invalid */;
    if (ctx) {
        if (ctx.state === "suspended") {
            state = 2 /* Paused */;
        }
        else if (ctx.state === "running") {
            state = 1 /* Running */;
        }
    }
    return state;
}
function resumeAudioContext(ctx) {
    log("resuming...");
    ctx.resume().then(function () {
        log("resumed");
    }).catch(function (reason) {
        if (!unlocked) {
            log("cannot resume until user interaction, setup unlock handler...");
            setupUnlockHandler();
        }
        else {
            error("error resuming AudioContext", reason);
        }
    });
}
function suspendAudioContext(ctx) {
    log("AudioContext suspending...");
    ctx.suspend().then(function () {
        log("AudioContext suspended");
    }).catch(function (reason) {
        error("error suspending AudioContext", reason);
    });
}
function unlock() {
    unlocked = true;
    var removeEventListener = document.removeEventListener;
    for (var i = 0; i < unlockEvents.length; ++i) {
        removeEventListener(unlockEvents[i], unlock);
    }
    if (ctx && ctx.state === "suspended") {
        resumeAudioContext(ctx);
    }
}
function setupUnlockHandler() {
    var addEventListener = document.addEventListener;
    for (var i = 0; i < unlockEvents.length; ++i) {
        addEventListener(unlockEvents[i], unlock);
    }
}
function initContext() {
    if (ctx) {
        warn("already initialized");
        return ctx;
    }
    ctx = new AudioContext({
        latencyHint: "interactive",
        sampleRate: 22050
    });
    if (!ctx) {
        error("error create AudioContext");
        return null;
    }
    if (ctx.state === "running") {
        suspendAudioContext(ctx);
    }
    log("Latency: " + ctx.baseLatency);
    log("Sample rate: " + ctx.sampleRate);
    return ctx;
}
function closeContext(_notNullCtx) {
    log("shutdown...");
    _notNullCtx.close().then(function () {
        log("shutdown completed");
    }).catch(function (reason) {
        error("shutdown error", reason);
    });
    ctx = null;
}var emptyWaveData = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAVFYAAFRWAAABAAgAZGF0YQAAAAA=";
var StreamPlayer = /** @class */ (function () {
    function StreamPlayer(el, node) {
        this.el = el;
        this.node = node;
    }
    return StreamPlayer;
}());
function StreamPlayer_create(ctx, url) {
    var el = new Audio(url);
    el.preload = "auto";
    el["preservesPitch"] = false;
    return new StreamPlayer(el, ctx.createMediaElementSource(el));
}
function StreamPlayer_isFree(player) {
    return player.el.src === emptyWaveData;
}
function StreamPlayer_stop(player) {
    var el = player.el;
    if (el.src !== emptyWaveData) {
        el.pause();
        el.src = emptyWaveData;
        el.currentTime = 0;
        player.node.disconnect();
    }
}
function StreamPlayer_resume(player) {
    player.el.play().then(function () {
        log("started stream player");
    }).catch(function (reason) {
        error("error on play stream", reason);
    });
}
var players = [];
var playersMaxCount = 4;
function getNextStreamPlayer(src) {
    for (var i = 0; i < players.length; ++i) {
        var player = players[i];
        if (StreamPlayer_isFree(player)) {
            player.el.src = src;
            return player;
        }
    }
    if (players.length < playersMaxCount) {
        var ctx = getContext();
        if (ctx) {
            var mes = StreamPlayer_create(ctx, src);
            players.push(mes);
            return mes;
        }
    }
    return null;
}
function destroyStreamPlayersPool() {
    for (var i = 0; i < players.length; ++i) {
        var player = players[i];
        StreamPlayer_stop(player);
        player.el.src = "";
    }
    players.length = 0;
}
function getStreamPlayersCount() {
    var count = 0;
    for (var i = 0; i < players.length; ++i) {
        if (!StreamPlayer_isFree(players[i])) {
            ++count;
        }
    }
    return count;
}var vMask = 0xFFFF00;
var vIncr = 0x000100;
var iMask = 0x0000FF;
var VoiceObj = /** @class */ (function () {
    function VoiceObj(gain, pan) {
        this.gain = gain;
        this.pan = pan;
        this.stream = null;
        // buffer playback
        this.buffer = null;
        // common nodes
        // "Pitch" / "Playback Rate"
        this.rate = 1.0;
        // Control Flags
        this.cf = 0;
        this.target = null;
        this.src = 0;
        // handle version (maybe will add index as well)
        this.v = 0;
    }
    return VoiceObj;
}());
function Voice_create(ctx) {
    var gain = ctx.createGain();
    var pan = ctx.createStereoPanner();
    pan.connect(gain);
    return new VoiceObj(gain, pan);
}
function Voice_changeDestination(v, target) {
    if (target !== v.target) {
        var gain = v.gain;
        if (v.target) {
            gain.disconnect(v.target);
        }
        v.target = target;
        if (target) {
            gain.connect(target);
        }
    }
}
function Voice_resetDestination(v) {
    if (v.target) {
        v.gain.disconnect(v.target);
        v.target = null;
    }
}
function Voice_stop(v) {
    // stop stream
    if (v.stream) {
        StreamPlayer_stop(v.stream);
        v.stream = null;
    }
    // stop buffer
    var buffer = v.buffer;
    if (buffer) {
        if ((v.cf & 1 /* Running */) !== 0) {
            buffer.stop();
        }
        buffer.disconnect();
        v.buffer = null;
    }
    Voice_resetDestination(v);
    v.src = 0;
    v.cf = 0;
    v.v = (v.v + vIncr) & vMask;
}
function Voice_startBuffer(v) {
    if ((v.cf & 1 /* Running */) === 0) {
        var source = v.buffer;
        if (source) {
            source.addEventListener("ended", function (e) {
                // maybe check is useless
                if (v.buffer === e.target) {
                    Voice_stop(v);
                }
            });
            source.loop = (v.cf & 4 /* Loop */) !== 0;
            source.start();
            v.cf |= 1 /* Running */;
        }
    }
}
function Voice_prepareBuffer(v, ctx, audioBuffer) {
    var source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(v.pan);
    v.buffer = source;
}
function Voice_loop(v, value) {
    var current = (v.cf & 4 /* Loop */) !== 0;
    if (value !== current) {
        v.cf ^= 4 /* Loop */;
        if (v.stream) {
            v.stream.el.loop = value;
        }
        else if (v.buffer) {
            v.buffer.loop = value;
        }
    }
}
function Voice_pause(v, value) {
    var paused = (v.cf & 2 /* Paused */) !== 0;
    if (value !== paused) {
        v.cf ^= 2 /* Paused */;
        if (value) {
            if (v.stream) {
                v.stream.el.pause();
            }
            else if (v.buffer) {
                v.buffer.playbackRate.value = 0.0;
            }
        }
        else {
            if (v.stream) {
                StreamPlayer_resume(v.stream);
            }
            else if (v.buffer) {
                v.buffer.playbackRate.value = v.rate;
                // restart if play called in pause mode
                Voice_startBuffer(v);
            }
        }
    }
}
function Voice_pitch(v, value) {
    if (v.rate !== value) {
        v.rate = value;
        if (v.stream) {
            v.stream.el.playbackRate = value;
        }
        else if (v.buffer) {
            if (!(v.cf & 2 /* Paused */)) {
                v.buffer.playbackRate.value = value;
            }
        }
    }
}
var voicePool = [null];
var voicesMaxCount = 64;
function _getVoiceObj(handle) {
    var obj = voicePool[handle & iMask];
    return (obj && obj.v === (handle & vMask)) ? obj : null;
}
function getNextVoice() {
    for (var i = 1; i < voicePool.length; ++i) {
        var v = voicePool[i];
        if (v.src === 0) {
            return i | v.v;
        }
    }
    var index = voicePool.length;
    if (index < voicesMaxCount) {
        var ctx = getContext();
        if (ctx) {
            voicePool.push(Voice_create(ctx));
            return index;
        }
    }
    return 0;
}var AudioSourceObj = /** @class */ (function () {
    function AudioSourceObj() {
        this.isFree = true;
        this.url = null;
        this.buffer = null;
    }
    return AudioSourceObj;
}());
var audioSources = [null];var BusObj = /** @class */ (function () {
    function BusObj(gain, e) {
        if (e === void 0) { e = true; }
        this.gain = gain;
        this.e = e;
    }
    return BusObj;
}());
var busPool = [];
function Bus_create(ctx) {
    var obj = new BusObj(ctx.createGain());
    busPool.push(obj);
    return obj;
}
function initBusPool(ctx) {
    var master = Bus_create(ctx).gain;
    master.connect(ctx.destination);
    Bus_create(ctx).gain.connect(master);
    Bus_create(ctx).gain.connect(master);
    Bus_create(ctx).gain.connect(master);
}
function termBusPool() {
    for (var i = 0; i < busPool.length; ++i) {
        busPool[i].gain.disconnect();
    }
    busPool.length = 0;
}
function _getBus(handle) {
    return busPool[handle];
}
function _getBusGain(handle) {
    var _a;
    return (_a = _getBus(handle)) === null || _a === void 0 ? void 0 : _a.gain;
}
function Bus_enable(bus, enabled) {
    if (bus.e !== enabled) {
        var master = busPool[0];
        var dest = bus === master ? getContext().destination : master.gain;
        if (enabled) {
            bus.gain.connect(dest);
        }
        else {
            bus.gain.disconnect(dest);
        }
        bus.e = enabled;
    }
}function init() {
    var ctx = initContext();
    if (ctx) {
        initBusPool(ctx);
    }
}
function resume() {
    var ctx = getContext();
    if (ctx && ctx.state === "suspended") {
        resumeAudioContext(ctx);
    }
}
function pause() {
    var ctx = getContext();
    if (ctx && ctx.state === "running") {
        log("pausing");
        ctx.suspend().then(function () {
            log("paused");
        }).catch(function (reason) {
            error("pause error", reason);
        });
    }
}
function shutdown() {
    var ctx = getContext();
    if (ctx) {
        termBusPool();
        voicePool.length = 1;
        audioSources.length = 1;
        destroyStreamPlayersPool();
        closeContext(ctx);
    }
}
/*** Context State ***/
function getInteger(param) {
    switch (param) {
        case VOICES_IN_USE: {
            var count = 0;
            for (var i = 1; i < voicePool.length; ++i) {
                if (voicePool[i].buffer) {
                    ++count;
                }
            }
            return count;
        }
        case STREAMS_IN_USE: {
            return getStreamPlayersCount();
        }
        case BUFFERS_LOADED: {
            return 0;
        }
        case STREAMS_LOADED: {
            return 0;
        }
        case DEVICE_SAMPLE_RATE: {
            var ctx = getContext();
            return ctx ? ctx.sampleRate : 0;
        }
        case DEVICE_STATE: {
            return getContextState();
        }
    }
    return 0;
}
/***/
function loadAudioSource(filepath, streaming) {
    if (!getContext()) {
        return 0;
    }
    var handle = 0;
    for (var i = 1; i < audioSources.length; ++i) {
        if (audioSources[i].isFree) {
            handle = i;
        }
    }
    if (handle === 0) {
        audioSources.push(new AudioSourceObj());
        handle = audioSources.length - 1;
    }
    var obj = audioSources[handle];
    obj.isFree = false;
    if (streaming) {
        obj.url = filepath;
    }
    else {
        var timeDecoding_1 = 0;
        fetch(new Request(filepath)).then(function (response) {
            return response.arrayBuffer();
        }).then(function (buffer) {
            var ctx = getContext();
            if (ctx) {
                timeDecoding_1 = measure();
                return ctx.decodeAudioData(buffer);
            }
            return null;
        }).then(function (buffer) {
            obj.buffer = buffer;
            if (buffer) {
                log("decoding time: " + (measure(timeDecoding_1) | 0) + " ms.");
            }
        }).catch(function (reason) {
            error("can't load audio buffer from " + filepath, reason);
        });
    }
    return handle;
}
function destroyAudioSource(source) {
    if (source === 0) {
        return;
    }
    stopAudioSource(source);
    var sourceObj = audioSources[source];
    if (sourceObj) {
        sourceObj.buffer = null;
        sourceObj.url = null;
        sourceObj.isFree = true;
    }
}
/***
 *
 * @param source
 * @param volume
 * @param pan
 * @param pitch
 * @param paused
 * @param loop
 * @param bus
 */
function play(source, volume, pan, pitch, paused, loop, bus) {
    if (volume === void 0) { volume = 1.0; }
    if (pan === void 0) { pan = 0.0; }
    if (pitch === void 0) { pitch = 1.0; }
    if (paused === void 0) { paused = false; }
    if (loop === void 0) { loop = false; }
    if (bus === void 0) { bus = 1; }
    if (source === 0) {
        return 0;
    }
    var ctx = getContext();
    if (!ctx) {
        return 0;
    }
    var sourceObj = audioSources[source];
    if (!sourceObj || sourceObj.isFree) {
        warn("audio source not found");
        return 0;
    }
    if (!sourceObj.url && !sourceObj.buffer) {
        warn("nothing to play, audio source is empty!");
        return 0;
    }
    var targetNode = _getBusGain(bus);
    if (!targetNode) {
        warn("invalid target bus!");
        return 0;
    }
    var voice = getNextVoice();
    if (!voice) {
        warn("no more free simple voices!");
        return 0;
    }
    var voiceObj = _getVoiceObj(voice);
    if (loop) {
        voiceObj.cf |= 4 /* Loop */;
    }
    if (paused) {
        voiceObj.cf |= 2 /* Paused */;
    }
    voiceObj.rate = 1.0;
    voiceObj.src = source;
    voiceObj.gain.gain.value = volume;
    voiceObj.pan.pan.value = pan;
    if (sourceObj.url) {
        var mes = getNextStreamPlayer(sourceObj.url);
        if (!mes) {
            warn("no more free media stream elements!");
            return 0;
        }
        voiceObj.stream = mes;
        mes.el.loop = loop;
        mes.node.connect(voiceObj.pan);
        if (!paused) {
            StreamPlayer_resume(mes);
            voiceObj.cf |= 1 /* Running */;
        }
    }
    else if (sourceObj.buffer) {
        Voice_prepareBuffer(voiceObj, ctx, sourceObj.buffer);
        if (!paused) {
            Voice_startBuffer(voiceObj);
        }
    }
    // maybe we need to set target before `startBuffer()`
    Voice_changeDestination(voiceObj, targetNode);
    Voice_pitch(voiceObj, pitch);
    return voice;
}
function stop(voice) {
    var obj = _getVoiceObj(voice);
    if (obj) {
        Voice_stop(obj);
    }
}
function getVoiceState(voice) {
    var obj = _getVoiceObj(voice);
    return obj ? obj.cf : 0;
}
function setPan(voice, value) {
    var obj = _getVoiceObj(voice);
    if (obj) {
        obj.pan.pan.value = value;
    }
}
function setVolume(voice, value) {
    var obj = _getVoiceObj(voice);
    if (obj) {
        obj.gain.gain.value = value;
    }
}
function setPitch(voice, value) {
    var obj = _getVoiceObj(voice);
    if (obj) {
        Voice_pitch(obj, value);
    }
}
function setPause(voice, value) {
    var obj = _getVoiceObj(voice);
    if (obj) {
        Voice_pause(obj, value);
    }
}
function setLoop(voice, value) {
    var obj = _getVoiceObj(voice);
    if (obj) {
        Voice_loop(obj, value);
    }
}
function getPause(voice) {
    var obj = _getVoiceObj(voice);
    return !!obj && (obj.cf & 2 /* Paused */) !== 0;
}
function stopAudioSource(source) {
    if (source === 0) {
        console.warn("invalid source");
        return;
    }
    for (var i = 1; i < voicePool.length; ++i) {
        var v = voicePool[i];
        if (v.src === source) {
            Voice_stop(v);
        }
    }
}
/** Bus controls **/
function setBusVolume(bus, value) {
    var gain = _getBusGain(bus);
    if (gain) {
        gain.gain.value = value;
    }
}
function setBusEnabled(bus, enabled) {
    var obj = _getBus(bus);
    if (obj) {
        Bus_enable(obj, enabled);
    }
}
function getVoiceLength(voice) {
    var obj = _getVoiceObj(voice);
    var d = 0.0;
    if (obj) {
        if (obj.buffer && obj.buffer.buffer) {
            d = obj.buffer.buffer.duration;
        }
        else if (obj.stream) {
            d = obj.stream.el.duration;
        }
    }
    return d;
}
function getVoicePosition(voice) {
    var obj = _getVoiceObj(voice);
    var d = 0.0;
    if (obj) {
        if (obj.buffer && obj.buffer) ;
        else if (obj.stream) {
            d = obj.stream.el.currentTime;
        }
    }
    return d;
}
/** Export Constants only for pre-bundled usage **/
var VOICES_IN_USE = 0 /* VoicesInUse */;
var STREAMS_IN_USE = 1 /* StreamsInUse */;
var BUFFERS_LOADED = 2 /* BuffersLoaded */;
var STREAMS_LOADED = 3 /* StreamsLoaded */;
var DEVICE_SAMPLE_RATE = 4 /* Device_SampleRate */;
var DEVICE_STATE = 5 /* Device_State */;
var BUS_MASTER = 0;
var BUS_SFX = 1;
var BUS_MUSIC$1 = 2;
var BUS_SPEECH = 2;
function getDeviceStateString(state) {
    var _a;
    return (_a = ["invalid", "running", "paused"][state]) !== null && _a !== void 0 ? _a : "undefined";
}let streamSource = null;
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
    init();
});
$("#resume").addEventListener("click", () => {
    resume();
});
$("#pause").addEventListener("click", () => {
    pause();
});
$("#shutdown").addEventListener("click", () => {
    shutdown();
});

$("#load-stream").addEventListener("click", () => {
    streamSource = loadAudioSource("assets/mp3/Kalimba.mp3", true);
    $("#play-stream").innerText = "Play";
});

$("#play-stream").addEventListener("click", (ev) => {
    if (!streamVoice) {
        streamVoice = play(streamSource,
            $("#volume").value,
            $("#pan").value,
            $("#pitch").value,
            false, false, BUS_MUSIC);
    } else {
        const paused = !getPause(streamVoice);
        setPause(streamVoice, paused);
        ev.target.innerText = paused ? "Resume" : "Pause";
    }
});

$("#stop-stream").addEventListener("click", () => {
    $("#play-stream").innerText = "Play";
    stop(streamVoice);
    streamVoice = null;
});

$("#volume").addEventListener("input", (ev) => {
    setVolume(streamVoice, ev.target.value);
});

$("#pan").addEventListener("input", (ev) => {
    setPan(streamVoice, ev.target.value);
});

$("#pitch").addEventListener("input", (ev) => {
    setPitch(streamVoice, ev.target.value);
});

$("#load-buffer").addEventListener("click", () => {
    bufferSource = loadAudioSource("assets/mp3/FUNKY_HOUSE.mp3", false);
});

$("#play-buffer").addEventListener("click", (ev) => {
    if (!bufferVoice) {
        bufferVoice = play(bufferSource, 1, 0, 1, false, $("#loop-buffer").checked);
    } else {
        const paused = !getPause(bufferVoice);
        setPause(bufferVoice, paused);
        ev.target.innerText = paused ? "Resume" : "Pause";
    }
});

$("#stop-buffer").addEventListener("click", () => {
    stop(bufferVoice);
    bufferVoice = null;
    $("#play-buffer").innerText = "Play";
});

$("#loop-buffer").addEventListener("input", (ev) => {
    if (bufferVoice) {
        setLoop(bufferVoice, ev.target.checked);
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
    multiSources = sources.map((src) => loadAudioSource(src, false));
});

$("#play-multi").addEventListener("click", () => {
    if (multiSources && multiSources.length > 0) {
        const index = (Math.random() * multiSources.length) | 0;
        const source = multiSources[index];
        play(source);
    }
});

$("#stop-multi").addEventListener("click", () => {
    if (multiSources) {
        for (const source of multiSources) {
            stopAudioSource(source);
        }
    }
});

setInterval(() => {
    $("#info").innerHTML = `<table>
<tr><td>Device State</td><td>${getDeviceStateString(getInteger(DEVICE_STATE))}</td></tr>
<tr><td>Sample Rate</td><td>${getInteger(DEVICE_SAMPLE_RATE)}</td></tr>

<tr><td>Voices</td><td>${getInteger(VOICES_IN_USE)}</td></tr>
<tr><td>Streams</td><td>${getInteger(STREAMS_IN_USE)}</td></tr>
</table>`;

    if (getVoiceState(streamVoice) & 1) {
        const len = getVoiceLength(streamVoice);
        const pos = getVoicePosition(streamVoice);
        $("#stream-playback-info").innerText = pos + " / " + len;
    }

}, 300);

let clapSource = null;
$("#load-clap").addEventListener("click", () => {
    if (!clapSource) {
        clapSource = loadAudioSource("assets/mp3/CLAP.mp3", false);
    }
});

$("#run-random-paused").addEventListener("click", () => {
    if (clapSource) {
        let delay = 0;
        for (let i = 0; i < 10; ++i) {
            const voice = play(clapSource, 1, 0, 1, true);
            setPitch(voice, 0.5 + Math.random());
            setVolume(voice, 0.5 + 0.5 * Math.random());
            setPan(voice, 2 * Math.random() - 1);
            setTimeout(() => {
                setPause(voice, false);
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
            const voice = play(clapSource, 1, 0, pitch, true);
            setTimeout(() => {
                setPause(voice, false);
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
            const voice = play(clapSource, vol, 0, 1, true);
            setTimeout(() => {
                setPause(voice, false);
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
            const voice = play(clapSource, 1, pan, 1, true);
            setTimeout(() => {
                setPause(voice, false);
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
    largeBufferSource = loadAudioSource("assets/ogg/sample1.ogg", false);
});

$("#unload-large-buffer").addEventListener("click", () => {
    destroyAudioSource(largeBufferSource);
    largeBufferSource = 0;
});

$("#play-large-buffer").addEventListener("click", (ev) => {
    if (!largeBufferVoice) {
        largeBufferVoice = play(largeBufferSource,
            $("#lb-volume").value,
            $("#lb-pan").value,
            $("#lb-pitch").value,
            false, 0,
            BUS_MUSIC
        );
    } else {
        const paused = !getPause(largeBufferVoice);
        setPause(largeBufferVoice, paused);
        ev.target.innerText = paused ? "Resume" : "Pause";
    }
});

$("#stop-large-buffer").addEventListener("click", () => {
    stop(largeBufferVoice);
    largeBufferVoice = 0;
    $("#play-large-buffer").innerText = "Play";
});

$("#lb-volume").addEventListener("input", (ev) => {
    setVolume(largeBufferVoice, ev.target.value);
});

$("#lb-pan").addEventListener("input", (ev) => {
    setPan(largeBufferVoice, ev.target.value);
});

$("#lb-pitch").addEventListener("input", (ev) => {
    setPitch(largeBufferVoice, ev.target.value);
});


/**
 * Bus controllers
 */

$("#master-volume").addEventListener("input", (ev) => {
    setBusVolume(BUS_MASTER, ev.target.value);
});

$("#sfx-volume").addEventListener("input", (ev) => {
    setBusVolume(BUS_SFX, ev.target.value);
});

$("#music-volume").addEventListener("input", (ev) => {
    setBusVolume(BUS_MUSIC$1, ev.target.value);
});

$("#speech-volume").addEventListener("input", (ev) => {
    setBusVolume(BUS_SPEECH, ev.target.value);
});

$("#master-enabled").addEventListener("input", (ev) => {
    setBusEnabled(BUS_MASTER, ev.target.checked);
});

$("#sfx-enabled").addEventListener("input", (ev) => {
    setBusEnabled(BUS_SFX, ev.target.checked);
});

$("#music-enabled").addEventListener("input", (ev) => {
    setBusEnabled(BUS_MUSIC$1, ev.target.checked);
});

$("#speech-enabled").addEventListener("input", (ev) => {
    setBusEnabled(BUS_SPEECH, ev.target.checked);
});}());//# sourceMappingURL=index.js.map
