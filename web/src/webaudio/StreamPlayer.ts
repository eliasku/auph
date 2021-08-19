import {getContext} from "./Mixer";
import {error, log} from "./debug";

const emptyWaveData = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAVFYAAFRWAAABAAgAZGF0YQAAAAA=";

export class StreamPlayer {
    constructor(
        readonly el: HTMLAudioElement,
        readonly node: MediaElementAudioSourceNode
    ) {
    }
}

export function StreamPlayer_create(ctx: AudioContext, url: string): StreamPlayer {
    const el = new Audio(url);
    el.preload = "metadata";
    (el as any)["preservesPitch"] = false;
    return new StreamPlayer(el, ctx.createMediaElementSource(el));
}

export function StreamPlayer_isFree(player: StreamPlayer): boolean {
    return player.el.src === emptyWaveData;
}

export function StreamPlayer_stop(player: StreamPlayer): void {
    const el = player.el;
    if (el.src !== emptyWaveData) {
        el.onended = null;
        el.pause();
        el.src = emptyWaveData;
        el.currentTime = 0;
        player.node.disconnect();
    }
}

export function _streamPlayerResume(player: StreamPlayer): void {
    player.el.play().then(() => {
        log("started stream player");
    }).catch((reason) => {
        error("error on play stream", reason);
    });
}

const players: StreamPlayer[] = [];
const playersMaxCount = 4;

export function getNextStreamPlayer(ctx: AudioContext, src: string): StreamPlayer | null {
    for (let i = 0; i < players.length; ++i) {
        const player = players[i];
        if (StreamPlayer_isFree(player)) {
            player.el.src = src;
            return player;
        }
    }
    if (players.length < playersMaxCount) {
        const mes = StreamPlayer_create(ctx, src);
        players.push(mes);
        return mes;
    }
    return null;
}

export function destroyStreamPlayersPool() {
    for (let i = 0; i < players.length; ++i) {
        const player = players[i];
        StreamPlayer_stop(player);
        player.el.src = "";
    }
    players.length = 0;
}

export function getStreamPlayersCount() {
    let count = 0;
    for (let i = 0; i < players.length; ++i) {
        if (!StreamPlayer_isFree(players[i])) {
            ++count;
        }
    }
    return count;
}