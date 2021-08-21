import {AuphBuffer, Flag, iMask, Type, u31} from "../protocol/interface";
import {error, log, measure} from "./debug";
import {nextHandle, Obj} from "./common";

export type BufferData = string | AudioBuffer | null;

export class BufferObj implements Obj {
    constructor(public h: u31,
                public s: u31,
                public b: BufferData) {
    }
}

export let buffers: (BufferObj | null)[] = [null];
const buffersMaxCount = 128;

export function getNextBufferObj(): AuphBuffer | 0 {
    for (let i = 1; i < buffers.length; ++i) {
        const buffer = buffers[i]!;
        if (buffer.s === 0) {
            return buffer.h;
        }
    }
    const next = buffers.length;
    if (next < buffersMaxCount) {
        const b = new BufferObj(next | Type.Buffer, 0, null);
        buffers.push(b);
        return b.h;
    }
    return 0;
}

export function _bufferDestroy(obj: BufferObj) {
    // TODO:
    // if ((obj.s & Flag.Stream) !== 0 && obj.data) {
    //     URL.revokeObjectURL(obj.b as string);
    // }
    obj.h = nextHandle(obj.h);
    obj.s = 0;
    obj.b = null;
}

export function _getBufferObj(buffer: AuphBuffer): BufferObj | null {
    const obj = buffers[buffer & iMask]!;
    if (obj && obj.h === buffer) {
        return obj;
    }
    return null;
}

function _decodeAudioData(ctx: AudioContext, obj: BufferObj, buffer: ArrayBuffer) {
    let timeDecoding = measure(0);
    const success = (audioBuffer: AudioBuffer): void => {
        obj.s |= Flag.Loaded;
        obj.b = audioBuffer;
        log("decoding time: " + (measure(timeDecoding) | 0) + " ms.");
    };
    const fail = (err?: DOMException): void => {
        error("Error decode audio buffer", err);
        _bufferDestroy(obj);
    };
    // TODO: maybe callbacks will be deprecated?
    ctx.decodeAudioData(buffer, success, fail);
}

export function _bufferMemory(obj: BufferObj, ctx: AudioContext, data: Uint8Array, flags: u31) {
    obj.s |= Flag.Active;
    const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    // TODO:
    // if (flags & Flag.Stream) {
    //     obj.s |= Flag.Stream;
    _decodeAudioData(ctx, obj, buffer);
}

export function _bufferLoad(obj: BufferObj, ctx: AudioContext, filepath: string, flags: u31) {
    obj.s |= Flag.Active;
    // TODO:
    //if (flags & Flag.Stream) {
    //obj.s |= Flag.Stream;

    fetch(new Request(filepath))
        .then(response => response.arrayBuffer())
        .then(buffer => _decodeAudioData(ctx, obj, buffer))
        .catch((reason) => {
            error("Error load file", reason);
            _bufferDestroy(obj);
        });
}