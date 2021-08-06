export type AudioSource = number;

export class AudioSourceObj {
    isFree = true;
    url: string | null = null;
    buffer: AudioBuffer | null = null;

    constructor() {

    }
}

export let audioSources: (AudioSourceObj | null)[] = [null];
