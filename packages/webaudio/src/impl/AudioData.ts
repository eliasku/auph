export type AuBuffer = number;

export type BufferData = string | AudioBuffer | undefined;

const bufferMaxCount = 128;
export const bufferVersion = new Uint8Array(bufferMaxCount);
export const bufferState = new Uint8Array(bufferMaxCount);
export const bufferData: BufferData[] = [];

export function getNextBuffer(): AuBuffer | 0 {
    for (let i = 1; i < bufferState.length; ++i) {
        if (bufferState[i] === 0) {
            return i;
        }
    }
    return 0;
}

export function destroyBuffer(buffer: AuBuffer) {
    bufferState[buffer] = 0;
    bufferData[buffer] = undefined;
    bufferVersion[buffer] = bufferVersion[buffer] + 1;
}
