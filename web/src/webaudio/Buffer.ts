import {AuphBuffer, Flag, iMask, Type, u31} from "../protocol/interface";
import {error, log, measure} from "./debug";
import {getContext} from "./Mixer";
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

function _fetchURL<T>(filepath: string, cb: (response: Response) => Promise<T>): Promise<T> {
    return fetch(new Request(filepath)).then(cb);
}

export function _bufferMemory(obj: BufferObj, ctx: AudioContext, data: Uint8Array, flags: u31) {
    obj.s |= Flag.Active;
    const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    // TODO:
    // if (flags & Flag.Stream) {
    //     obj.s |= Flag.Stream;
    ctx.decodeAudioData(buffer).then((audioBuffer) => {
        obj.s |= Flag.Loaded;
        obj.b = audioBuffer;
    }).catch((reason) => {
        error("Error decode audio buffer", reason);
    });
}

export function _bufferLoad(obj: BufferObj, ctx: AudioContext, filepath: string, flags: u31) {
    obj.s |= Flag.Active;
    // TODO:
    //if (flags & Flag.Stream) {
    //obj.s |= Flag.Stream;
    let timeDecoding = 0;
    _fetchURL(filepath, (response) => response.arrayBuffer()).then((buffer) => {
        timeDecoding = measure(0);
        return ctx.decodeAudioData(buffer);
    }).then((buffer) => {
        obj.b = buffer;
        if (buffer) {
            log("decoding time: " + (measure(timeDecoding) | 0) + " ms.");
            obj.s |= Flag.Loaded;
        }
    }).catch((reason) => {
        error("Error decoding audio buffer", reason);
    });
}