import {AuphBuffer, BufferFlag, iMask, vIncr, vMask} from "./types";

export type BufferData = string | AudioBuffer | null;

export class BufferObj {
    // version
    v = 0;
    // State Flags
    s = 0;

    data: BufferData = null;

    constructor() {
    }
}

export let buffers: (BufferObj | null)[] = [null];
const buffersMaxCount = 128;

export function createBufferObj(): AuphBuffer | 0 {
    for (let i = 1; i < buffers.length; ++i) {
        const buffer = buffers[i]!;
        if (buffer.s === 0) {
            buffer.s = BufferFlag.Active;
            return i | buffer.v;
        }
    }
    const next = buffers.length;
    if (next < buffersMaxCount) {
        buffers.push(new BufferObj());
        return next;
    }
    return 0;
}

export function destroyBufferObj(buffer: AuphBuffer) {
    const obj = buffers[buffer & iMask]!;
    if (obj) {
        obj.s = 0;
        obj.v = (obj.v + vIncr) & vMask;
        obj.data = null;
    }
}

export function getBufferObj(buffer: AuphBuffer): BufferObj | null {
    const obj = buffers[buffer & iMask]!;
    if (obj && obj.v === (buffer & vMask) && (obj.s & BufferFlag.Active) !== 0) {
        return obj;
    }
    return null;
}