import {AudioDataFlag} from "./Constants";

export type AudioData = number;

export class AudioDataObj {
    cf = AudioDataFlag.Invalid;
    data: string | AudioBuffer | null = null;

    constructor() {

    }
}

export let audioDataPool: (AudioDataObj | null)[] = [null];
const audioDataMaxCount = 128;

export function getNextAudioData(): AudioData | 0 {
    for (let i = 1; i < audioDataPool.length; ++i) {
        if (audioDataPool[i]!.cf === 0) {
            return i;
        }
    }
    const next = audioDataPool.length;
    if (next < audioDataMaxCount) {
        audioDataPool.push(new AudioDataObj());
        return next;
    }
    return 0;
}
