import {AuphBuffer, Flag, iMask, Type, u31} from "../protocol/interface";
import {error, log, measure} from "./debug";
import {getContext} from "./Mixer";
import {nextHandle, Obj} from "./common";

export type BufferData = string | AudioBuffer | null;

export class BufferObj implements Obj {
    // handle
    h: u31;
    // State Flags
    s = 0;

    data: BufferData = null;

    constructor(index: u31) {
        this.h = index | Type.Buffer;
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
        const b = new BufferObj(next);
        buffers.push(b);
        return b.h;
    }
    return 0;
}

export function _bufferDestroy(obj: BufferObj) {
    if ((obj.s & Flag.Stream) !== 0 && obj.data) {
        URL.revokeObjectURL(obj.data as string);
    }
    obj.s = 0;
    obj.h = nextHandle(obj.h);
    obj.data = null;
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

export function _bufferMemory(obj: BufferObj, data: Uint8Array, flags: u31) {
    obj.s |= Flag.Active;
    const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    if (flags & Flag.Stream) {
        obj.s |= Flag.Stream;
        obj.data = URL.createObjectURL(new Blob([buffer]));
        obj.s |= Flag.Loaded;
    } else {
        const ctx = getContext();
        if (ctx) {
            ctx.decodeAudioData(buffer).then((audioBuffer) => {
                obj.data = audioBuffer;
                obj.s |= Flag.Loaded;
            }).catch((reason) => {
                error("Error decode audio buffer", reason);
            });
        }
    }
}

export function _bufferLoad(obj: BufferObj, filepath: string, flags: u31) {
    obj.s |= Flag.Active;
    if (flags & Flag.Stream) {
        obj.s |= Flag.Stream;
        _fetchURL(filepath, (response) => response.blob()).then((blob) => {
            obj.data = URL.createObjectURL(blob);
            obj.s |= Flag.Loaded;
        }).catch((reason) => {
            error("can't load audio stream data " + filepath, reason);
        });
    } else {
        let timeDecoding = 0;
        _fetchURL(filepath, (response) => response.arrayBuffer()).then((buffer) => {
            const ctx = getContext();
            if (ctx) {
                timeDecoding = measure(0);
                return ctx.decodeAudioData(buffer);
            }
            return null;
        }).then((buffer) => {
            obj.data = buffer;
            if (buffer) {
                log("decoding time: " + (measure(timeDecoding) | 0) + " ms.");
                obj.s |= Flag.Loaded;
            }
        }).catch((reason) => {
            error("Error decoding audio buffer", reason);
        });
    }
}