var auph=(function(exports){'use strict';/**
 * Object Name Identifier Layout: [00tt 0000 | vvvv vvvv | vvvv vvvv | iiii iiii]
 */
var tMask = 0x30000000;
var vMask = 0x00FFFF00;
var vIncr = 0x00000100;
var iMask = 0x000000FF;
var Mixer = 0x00000001;
// used for integer to float params conversion
var Unit = 1024;
var DefaultBus = 1 /* Sound */ | 268435456 /* Bus */;function init$2() {
}
function shutdown$2() {
}
function load$2(filepath, flags) {
    return 0;
}
function loadMemory$2(data, flags) {
    return 0;
}
function unload$2(name) {
}
function voice$1(buffer, gain, pan, rate, flags, bus) {
    return 0;
}
function stop$2(name) {
}
function set$2(name, param, value) {
}
function get$2(name, param) {
    return 0;
}
function vibrate$2(duration) {
    return 1;
}var Null=/*#__PURE__*/Object.freeze({__proto__:null,init: init$2,shutdown: shutdown$2,load: load$2,loadMemory: loadMemory$2,unload: unload$2,voice: voice$1,stop: stop$2,set: set$2,get: get$2,vibrate: vibrate$2});var TAG = "auph";
function log(message) {
    {
        console.log(TAG, message);
    }
}
function warn(message) {
    {
        console.warn(TAG, message);
    }
}
function error(message, reason) {
    {
        console.error(TAG, message, reason);
    }
}
function setError(status, context) {
    {
        error(status, context);
    }
}function nextHandle(h) {
    return ((h + vIncr) & vMask) | (h & (tMask | iMask));
}
function connectAudioNode(node, dest) {
    node.connect(dest);
}
function disconnectAudioNode(node, dest) {
    node.disconnect(dest);
}
function setAudioParamValue(param, value) {
    param.value = value;
}
function len(a) {
    return a.length;
}
function resize(a, length) {
    a.length = length;
}
function add(a, e) {
    a.push(e);
}function unlock(unlocked) {
    // "touchstart", "touchend", "mousedown", "pointerdown"
    var events = ["touchstart", "touchend", "mousedown", "click", "keydown"];
    var num = len(events);
    var doc = document;
    var handle = function () {
        if (unlocked()) {
            for (var i = 0; i < num; ++i) {
                doc.removeEventListener(events[i], handle, true);
            }
        }
    };
    for (var i = 0; i < num; ++i) {
        doc.addEventListener(events[i], handle, true);
    }
}var ctx;
var emptyAudioBuffer;
var defaultSampleRate = 22050;
function getContext() {
    if (ctx && ctx.state !== "closed") {
        return ctx;
    }
    warn(2 /* InvalidState */);
}
function getAudioContextObject() {
    return ctx;
}
function getContextState(ctx) {
    var state = 0;
    if (ctx.state !== "closed") {
        state |= 1 /* Active */;
        if (ctx.state === "running") {
            state |= 2 /* Running */;
        }
    }
    return state;
}
function audioContextResume(ctx) {
    log(3 /* DeviceResuming */);
    ctx.resume().then(function () {
        log(4 /* DeviceResumed */);
    }).catch(function (reason) {
        error(5 /* DeviceResumeError */, reason);
    });
}
function audioContextPause(ctx) {
    log(6 /* DevicePausing */);
    ctx.suspend().then(function () {
        log(7 /* DevicePaused */);
    }).catch(function (reason) {
        error(8 /* DevicePauseError */, reason);
    });
}
function newAudioContext(options) {
    var scope = window;
    var audioContext = scope.AudioContext || scope.webkitAudioContext;
    // TODO: set sample rate could lead to wrong playback on safari mobile (maybe it should be recreated after unlock?)
    //try {
    //    return new audioContext(options);
    //} catch (err) {
    //    error(Message.WebAudio_TryDefaultOptions, err);
    //}
    try {
        return new audioContext();
    }
    catch (err) {
        error(1 /* NotSupported */, err);
    }
}
function initContext() {
    if (ctx) {
        warn(14 /* Warning_AlreadyInitialized */);
        return ctx;
    }
    ctx = newAudioContext();
    if (ctx) {
        emptyAudioBuffer = ctx.createBuffer(1, 1, defaultSampleRate);
        unlock(function () {
            if (ctx.state === "suspended") {
                audioContextResume(ctx);
                return false;
            }
            return true;
        });
    }
    return ctx;
}
function closeContext(context) {
    log(9 /* DeviceClosing */);
    context.close().then(function () {
        log(10 /* DeviceClosed */);
    }).catch(function (reason) {
        error(11 /* DeviceCloseError */, reason);
    });
    ctx = undefined;
}var VoiceObj = /** @class */ (function () {
    function VoiceObj(g, p, index) {
        var _this = this;
        this.g = g;
        this.p = p;
        // handle passport
        this.h = 0;
        // Control Flags
        this.s = 0;
        // Gain
        this.G = Unit;
        // Pan
        this.P = Unit;
        // Rate
        this.R = Unit;
        // Source auph Buffer
        this.bf = 0;
        // Destination auph Bus
        this.bs = 0;
        // is source-node started: static buffer playback
        this._s = 0;
        // Source-Node
        this.sn = null;
        // Destination-Node: connected destination audio node
        this.dn = null;
        this._e = function () {
            // maybe check is useful
            //if (this.buffer === e.target || (this.stream && this.stream.el === e.target)) {
            _voiceStop(_this);
            //}
        };
        this.h = 805306368 /* Voice */ | index;
    }
    return VoiceObj;
}());
function _voiceNew(ctx, index) {
    var gain = ctx.createGain();
    var pan = ctx.createStereoPanner();
    connectAudioNode(pan, gain);
    return new VoiceObj(gain, pan, index);
}
function _voiceChangeDestination(v, target) {
    if (target !== v.dn) {
        var gain = v.g;
        if (v.dn) {
            disconnectAudioNode(gain, v.dn);
        }
        v.dn = target;
        if (target) {
            connectAudioNode(gain, target);
        }
    }
}
function _voiceResetDestination(v) {
    if (v.dn) {
        disconnectAudioNode(v.g, v.dn);
        v.dn = null;
    }
}
function _voiceStop(v) {
    // stop buffer
    var buffer = v.sn;
    if (buffer) {
        if ((v.s & 2 /* Running */) !== 0) {
            buffer.stop();
        }
        buffer.onended = null;
        disconnectAudioNode(buffer);
        try {
            buffer.buffer = emptyAudioBuffer;
        }
        catch (_a) {
        }
        v.sn = null;
    }
    _voiceResetDestination(v);
    v.bf = 0;
    v.bs = 0;
    v.s = 0;
    v.h = nextHandle(v.h);
}
function _voiceStartBuffer(v) {
    var source = v.sn;
    if (source && !v._s) {
        //source.addEventListener("ended", v._e, {once: true});
        source.onended = v._e;
        source.loop = (v.s & 4 /* Loop */) !== 0;
        source.start();
        v._s = 1;
    }
}
function _voicePrepareBuffer(v, ctx, audioBuffer) {
    var source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    connectAudioNode(source, v.p);
    v.sn = source;
    v._s = 0;
}
function _voiceSetLoop(v, value) {
    var current = (v.s & 4 /* Loop */) !== 0;
    if (value !== current) {
        v.s ^= 4 /* Loop */;
        if (v.sn) {
            v.sn.loop = value;
        }
    }
}
function _voiceSetRunning(v, value) {
    var current = !!(v.s & 2 /* Running */);
    if (value !== current) {
        v.s ^= 2 /* Running */;
        var playbackRate = value ? (v.R / Unit) : 0.0;
        if (v.sn) {
            setAudioParamValue(v.sn.playbackRate, playbackRate);
            if (value) {
                // restart if play called in pause mode
                _voiceStartBuffer(v);
            }
        }
    }
}
function _voiceApplyPitch(v, value) {
    if (!!(v.s & 2 /* Running */)) {
        if (v.sn) {
            setAudioParamValue(v.sn.playbackRate, value / Unit);
        }
    }
}
var voicePool = [null];
var voicesMaxCount = 64;
function _getVoiceObj(handle) {
    var obj = voicePool[handle & iMask];
    return (obj && obj.h === handle) ? obj : null;
}
function createVoiceObj(ctx) {
    var next = len(voicePool);
    for (var i = 1; i < next; ++i) {
        var v = voicePool[i];
        if (v.s === 0) {
            return v.h;
        }
    }
    if (next < voicesMaxCount) {
        var v = _voiceNew(ctx, next);
        v.h = 805306368 /* Voice */ | next;
        voicePool.push(v);
        return v.h;
    }
    return 0;
}var BusObj = /** @class */ (function () {
    function BusObj(g) {
        this.g = g;
        this.h = 0;
        this.s = 1 /* Active */ | 2 /* Running */;
        this.G = Unit;
    }
    return BusObj;
}());
var busLine = [];
function createBusObj(ctx) {
    var next = len(busLine);
    var obj = new BusObj(ctx.createGain());
    obj.h = next | 268435456 /* Bus */;
    add(busLine, obj);
    return obj;
}
function initBusPool(ctx) {
    var master = createBusObj(ctx).g;
    connectAudioNode(master, ctx.destination);
    connectAudioNode(createBusObj(ctx).g, master);
    connectAudioNode(createBusObj(ctx).g, master);
    connectAudioNode(createBusObj(ctx).g, master);
}
function termBusPool() {
    for (var i = 0; i < len(busLine); ++i) {
        disconnectAudioNode(busLine[i].g);
    }
    resize(busLine, 0);
}
function _getBus(bus) {
    var obj = busLine[bus & iMask];
    return (obj && obj.h === bus) ? obj : null;
}
function _getBusGain(handle) {
    var obj = _getBus(handle);
    return obj ? obj.g : undefined;
}
function _setBusConnected(bus, connected) {
    var flag = !!(bus.s & 2 /* Running */);
    if (flag !== connected) {
        var master = busLine[0];
        var dest = bus === master ? getAudioContextObject().destination : master.g;
        if (connected) {
            connectAudioNode(bus.g, dest);
        }
        else {
            disconnectAudioNode(bus.g, dest);
        }
        bus.s ^= 2 /* Running */;
    }
}var BufferObj = /** @class */ (function () {
    function BufferObj(h, s, b) {
        this.h = h;
        this.s = s;
        this.b = b;
    }
    return BufferObj;
}());
var buffers = [null];
var buffersMaxCount = 128;
function getNextBufferObj() {
    var next = len(buffers);
    for (var i = 1; i < next; ++i) {
        var buffer = buffers[i];
        if (buffer.s === 0) {
            return buffer.h;
        }
    }
    if (next < buffersMaxCount) {
        var b = new BufferObj(next | 536870912 /* Buffer */, 0, null);
        add(buffers, b);
        return b.h;
    }
    return 0;
}
function _bufferDestroy(obj) {
    // TODO:
    // if ((obj.s & Flag.Stream) !== 0 && obj.data) {
    //     URL.revokeObjectURL(obj.b as string);
    // }
    obj.h = nextHandle(obj.h);
    obj.s = 0;
    obj.b = null;
}
function _getBufferObj(buffer) {
    var obj = buffers[buffer & iMask];
    if (obj && obj.h === buffer) {
        return obj;
    }
    return null;
}
function _decodeAudioData(ctx, obj, buffer) {
    var success = function (audioBuffer) {
        obj.s |= 2 /* Loaded */;
        obj.b = audioBuffer;
    };
    var fail = function (err) {
        error(18 /* BufferDecodeError */, err);
        _bufferDestroy(obj);
    };
    // TODO: maybe callbacks will be deprecated?
    ctx.decodeAudioData(buffer, success, fail);
}
function _bufferMemory(obj, ctx, data, flags) {
    obj.s |= 1 /* Active */;
    var buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    // TODO: streaming
    // if (flags & Flag.Stream) {
    //     obj.s |= Flag.Stream;
    _decodeAudioData(ctx, obj, buffer);
}
function _bufferLoad(obj, ctx, filepath, flags) {
    obj.s |= 1 /* Active */;
    // TODO: streaming
    //if (flags & Flag.Stream) {
    //obj.s |= Flag.Stream;
    fetch(new Request(filepath))
        .then(function (response) { return response.arrayBuffer(); })
        .then(function (buffer) { return _decodeAudioData(ctx, obj, buffer); })
        .catch(function (reason) {
        error(19 /* BufferLoadError */, reason);
        _bufferDestroy(obj);
    });
}function init$1() {
    var ctx = initContext();
    if (ctx) {
        initBusPool(ctx);
    }
}
function shutdown$1() {
    var ctx = getContext();
    if (ctx) {
        termBusPool();
        resize(voicePool, 1);
        resize(buffers, 1);
        closeContext(ctx);
    }
}
function load$1(filepath, flags) {
    var handle = getNextBufferObj();
    if (handle) {
        var ctx = getAudioContextObject();
        if (!ctx) {
            setError(24 /* NotInitialized */);
            return 0;
        }
        var obj = buffers[handle & iMask];
        _bufferLoad(obj, ctx, filepath);
    }
    return handle;
}
function loadMemory$1(data, flags) {
    var handle = getNextBufferObj();
    if (handle) {
        var ctx = getAudioContextObject();
        if (!ctx) {
            setError(24 /* NotInitialized */);
            return 0;
        }
        var obj = buffers[handle & iMask];
        _bufferMemory(obj, ctx, data);
    }
    return handle;
}
function unload$1(name) {
    var obj = _getBufferObj(name);
    if (obj) {
        stop$1(name);
        _bufferDestroy(obj);
    }
}
/***
 *
 * @param buffer
 * @param gain
 * @param pan
 * @param rate
 * @param flags
 * @param bus
 */
function voice(buffer, gain, pan, rate, flags, bus) {
    // arguments check debug
    if (flags & ~(2 /* Running */ | 4 /* Loop */)) {
        setError(22 /* InvalidArguments */);
        return 0;
    }
    ///
    var ctx = getAudioContextObject();
    if (!ctx || ctx.state !== "running") {
        setError(23 /* InvalidMixerState */, ctx === null || ctx === void 0 ? void 0 : ctx.state);
        return 0;
    }
    var bufferObj = _getBufferObj(buffer);
    if (!bufferObj) {
        setError(15 /* BufferNotFound */);
        return 0;
    }
    if (!(bufferObj.s & 2 /* Loaded */)) {
        setError(16 /* BufferIsNotLoaded */);
        return 0;
    }
    if (!bufferObj.b) {
        setError(17 /* BufferNoData */);
        return 0;
    }
    var targetNode = _getBusGain(bus ? bus : DefaultBus);
    if (!targetNode) {
        setError(21 /* BusNotFound */);
        return 0;
    }
    var voice = createVoiceObj(ctx);
    if (voice === 0) {
        setError(12 /* Warning_NoFreeVoices */);
        return 0;
    }
    var voiceObj = _getVoiceObj(voice);
    voiceObj.s = 1 /* Active */ | flags;
    voiceObj.bf = buffer;
    voiceObj.G = gain;
    voiceObj.P = pan;
    voiceObj.R = rate;
    setAudioParamValue(voiceObj.g.gain, gain / Unit);
    setAudioParamValue(voiceObj.p.pan, pan / Unit - 1);
    // TODO: streamed decoding
    //if (bufferObj.s & Flag.Stream) {
    _voicePrepareBuffer(voiceObj, ctx, bufferObj.b);
    if (flags & 2 /* Running */) {
        _voiceStartBuffer(voiceObj);
    }
    // maybe we need to set target before `startBuffer()`
    _voiceChangeDestination(voiceObj, targetNode);
    _voiceApplyPitch(voiceObj, rate);
    return voice;
}
function stop$1(name) {
    if (name === 0) {
        return;
    }
    var type = name & tMask;
    if (type === 805306368 /* Voice */) {
        var obj = _getVoiceObj(name);
        if (obj) {
            _voiceStop(obj);
        }
    }
    else if (type === 536870912 /* Buffer */) {
        var obj = _getBufferObj(name);
        if (obj) {
            for (var i = 1; i < len(voicePool); ++i) {
                var v = voicePool[i];
                if (v.bf === name) {
                    _voiceStop(v);
                }
            }
        }
        else {
            setError(15 /* BufferNotFound */);
        }
    }
}
function set$1(name, param, value) {
    if (name === 0) {
        return;
    }
    if (name === Mixer && (param & 128 /* Flags */) && (param & 2 /* Running */)) {
        var ctx = getContext();
        if (ctx) {
            if (value && ctx.state === "suspended") {
                audioContextResume(ctx);
            }
            else if (!value && ctx.state === "running") {
                audioContextPause(ctx);
            }
        }
    }
    var type = name & tMask;
    if (type === 805306368 /* Voice */) {
        var obj = _getVoiceObj(name);
        if (obj) {
            if (param & 128 /* Flags */) {
                var enabled = value !== 0;
                if (param & 2 /* Running */) {
                    _voiceSetRunning(obj, enabled);
                }
                else if (param & 4 /* Loop */) {
                    _voiceSetLoop(obj, enabled);
                }
            }
            else {
                if (param === 1 /* Gain */) {
                    if (obj.G !== value) {
                        obj.G = value;
                        setAudioParamValue(obj.g.gain, value / Unit);
                    }
                }
                else if (param === 2 /* Pan */) {
                    if (obj.P !== value) {
                        obj.P = value;
                        setAudioParamValue(obj.p.pan, value / Unit - 1);
                    }
                }
                else if (param === 3 /* Rate */) {
                    if (obj.R !== value) {
                        obj.R = value;
                        _voiceApplyPitch(obj, value);
                    }
                }
                else ;
            }
        }
    }
    else if (type === 268435456 /* Bus */) {
        var obj = _getBus(name);
        if (obj) {
            if (param & 128 /* Flags */) {
                if (param & 2 /* Running */) {
                    _setBusConnected(obj, !!value);
                }
            }
            else {
                if (param === 1 /* Gain */) {
                    if (obj.G !== value) {
                        setAudioParamValue(obj.g.gain, value / Unit);
                        obj.G = value;
                    }
                }
            }
        }
    }
}
function get$1(name, param) {
    var result = 0;
    if (name === Mixer) {
        var ctx = getAudioContextObject();
        if (ctx) {
            if (param === 0 /* State */) {
                result = getContextState(ctx);
            }
            else if (param === 5 /* SampleRate */) {
                result = ctx.sampleRate | 0;
            }
        }
        return result;
    }
    var type = name & tMask;
    if ((param & 256 /* Count */) && !(name & iMask)) {
        var stateMask = param & 127 /* StateMask */;
        if (type === 805306368 /* Voice */) {
            result = _countObjectsWithFlags(voicePool, stateMask);
        }
        else if (type === 268435456 /* Bus */) {
            result = _countObjectsWithFlags(busLine, stateMask);
        }
        else if (type === 536870912 /* Buffer */) {
            result = _countObjectsWithFlags(buffers, stateMask);
        }
        return result;
    }
    if (type === 805306368 /* Voice */) {
        var obj = _getVoiceObj(name);
        if (obj) {
            if (param === 0 /* State */) {
                result = obj.s;
            }
            else if (param === 1 /* Gain */) {
                result = obj.G;
            }
            else if (param === 2 /* Pan */) {
                result = obj.P;
            }
            else if (param === 3 /* Rate */) {
                result = obj.R;
            }
            else if (param === 6 /* Duration */) {
                if (obj.sn && obj.sn.buffer) {
                    result = (obj.sn.buffer.duration * Unit) | 0;
                }
            }
            else if (param === 4 /* CurrentTime */) {
                if (obj.sn && obj.sn.buffer) ;
            }
            else {
                warn(1 /* NotSupported */);
            }
        }
        return result;
    }
    if (type === 268435456 /* Bus */) {
        var obj = _getBus(name);
        if (obj) {
            if (param === 0 /* State */) {
                result = obj.s;
            }
            else if (param === 1 /* Gain */) {
                result = obj.G;
            }
            else {
                warn(1 /* NotSupported */);
            }
        }
        return result;
    }
    if (type === 536870912 /* Buffer */) {
        var obj = _getBufferObj(name);
        if (obj) {
            if (param === 0 /* State */) {
                result = obj.s;
            }
            else if (param === 6 /* Duration */) {
                if (obj.b) {
                    result = (obj.b.duration * Unit) | 0;
                }
            }
            else {
                warn(1 /* NotSupported */);
            }
        }
    }
    return result;
}
function vibrate$1(durationMillis) {
    try {
        if (navigator.vibrate) {
            return navigator.vibrate(durationMillis) ? 0 : 1;
        }
    }
    catch (_a) {
    }
    return 1;
}
/** private helpers **/
function _countObjectsWithFlags(arr, mask) {
    var cnt = 0;
    var size = len(arr);
    for (var i = 1; i < size; ++i) {
        var obj = arr[i];
        if (obj && (obj.s & mask) === mask) {
            ++cnt;
        }
    }
    return cnt;
}var Browser=/*#__PURE__*/Object.freeze({__proto__:null,init: init$1,shutdown: shutdown$1,load: load$1,loadMemory: loadMemory$1,unload: unload$1,voice: voice,stop: stop$1,set: set$1,get: get$1,vibrate: vibrate$1});/** Export Constants only for pre-bundled usage **/
var SAMPLE_RATE = 5 /* SampleRate */;
var STATE = 0 /* State */;
var COUNT = 256 /* Count */;
var ACTIVE = 1 /* Active */;
var RUNNING = 2 /* Running */;
var STREAM = 4 /* Stream */;
var LOOP = 4 /* Loop */;
var MIXER = Mixer;
var BUS = 268435456 /* Bus */;
var VOICE = 805306368 /* Voice */;
var BUFFER = 536870912 /* Buffer */;
var BUS_MASTER = 268435456 /* Bus */ | 0;
var BUS_SFX = 268435456 /* Bus */ | 1;
var BUS_MUSIC = 268435456 /* Bus */ | 2;
var BUS_SPEECH = 268435456 /* Bus */ | 3;function haveWebAudio() {
    return typeof window !== "undefined" && !!(window.AudioContext || window.webkitAudioContext);
}
function loadDriver() {
    if (typeof process !== "undefined") {
        return require("bindings")("auph");
    }
    if (haveWebAudio()) {
        return Browser;
    }
    return Null;
}
var _ = loadDriver();
var init = _.init;
var shutdown = _.shutdown;
var set = _.set;
var get = _.get;
var load = _.load;
var loadMemory = _.loadMemory;
var unload = _.unload;
var stop = _.stop;
var vibrate = _.vibrate;
function pause(name) {
    if (name === void 0) { name = Mixer; }
    setPause(name, true);
}
function resume(name) {
    if (name === void 0) { name = Mixer; }
    setPause(name, false);
}
function play(buffer, gain, pan, rate, loop, paused, bus) {
    if (gain === void 0) { gain = 1.0; }
    if (pan === void 0) { pan = 0.0; }
    if (rate === void 0) { rate = 1.0; }
    var flags = 0;
    if (!!loop)
        flags |= 4 /* Loop */;
    if (!paused)
        flags |= 2 /* Running */;
    return _.voice(buffer, f2u(gain), f2u(+pan + 1), f2u(rate), flags, 0 | bus);
}
function getMixerStateString(state) {
    return ["closed", "paused", "", "running"][state & 3];
}
function getBufferStateString(state) {
    return ["free", "loading", "", "loaded"][state & 0x3] + ["", " streaming"][(state >>> 2) & 0x1];
}
function setGain(busOrVoice, value) {
    set(busOrVoice, 1 /* Gain */, f2u(value));
}
function getGain(busOrVoice) {
    return get(busOrVoice, 1 /* Gain */) / Unit;
}
function setPan(voice, pan) {
    set(voice, 2 /* Pan */, f2u(+pan + 1));
}
function setRate(voice, rate) {
    set(voice, 3 /* Rate */, f2u(rate));
}
function setPause(name, value) {
    set(name, 128 /* Flags */ | 2 /* Running */, 0 | !value);
}
function setLoop(voice, value) {
    set(voice, 128 /* Flags */ | 4 /* Loop */, 0 | value);
}
function getPan(voice) {
    return get(voice, 2 /* Pan */) / Unit - 1;
}
function getRate(voice) {
    return get(voice, 3 /* Rate */) / Unit;
}
function getPause(voice) {
    return !(get(voice, 0 /* State */) & 2 /* Running */);
}
function getLoop(voice) {
    return !!(get(voice, 0 /* State */) & 4 /* Loop */);
}
function getCurrentTime(voice) {
    return get(voice, 4 /* CurrentTime */) / Unit;
}
function isActive(name) {
    return !!(get(name, 0 /* State */) & 1 /* Active */);
}
function isBufferLoaded(name) {
    var mask = 1 /* Active */ | 2 /* Loaded */;
    return (get(name, 0 /* State */) & mask) === mask;
}
function getDuration(name) {
    return get(name, 6 /* Duration */) / Unit;
}
function f2u(x) {
    return (x * Unit) | 0;
}exports.ACTIVE=ACTIVE;exports.BUFFER=BUFFER;exports.BUS=BUS;exports.BUS_MASTER=BUS_MASTER;exports.BUS_MUSIC=BUS_MUSIC;exports.BUS_SFX=BUS_SFX;exports.BUS_SPEECH=BUS_SPEECH;exports.COUNT=COUNT;exports.LOOP=LOOP;exports.MIXER=MIXER;exports.RUNNING=RUNNING;exports.SAMPLE_RATE=SAMPLE_RATE;exports.STATE=STATE;exports.STREAM=STREAM;exports.VOICE=VOICE;exports.get=get;exports.getBufferStateString=getBufferStateString;exports.getCurrentTime=getCurrentTime;exports.getDuration=getDuration;exports.getGain=getGain;exports.getLoop=getLoop;exports.getMixerStateString=getMixerStateString;exports.getPan=getPan;exports.getPause=getPause;exports.getRate=getRate;exports.init=init;exports.isActive=isActive;exports.isBufferLoaded=isBufferLoaded;exports.load=load;exports.loadMemory=loadMemory;exports.pause=pause;exports.play=play;exports.resume=resume;exports.set=set;exports.setGain=setGain;exports.setLoop=setLoop;exports.setPan=setPan;exports.setPause=setPause;exports.setRate=setRate;exports.shutdown=shutdown;exports.stop=stop;exports.unload=unload;exports.vibrate=vibrate;Object.defineProperty(exports,'__esModule',{value:true});return exports;}({}));//# sourceMappingURL=auph.debug.js.map
