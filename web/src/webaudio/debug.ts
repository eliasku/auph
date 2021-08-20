import {Message} from "../protocol/interface";

const TAG = "[AUPH]";

let lastStatus = 0;

export function log(message: string | Message) {
    if (process.env.NODE_ENV !== "production") {
        console.log(TAG, message);
    }
}

export function warn(message: string | Message) {
    console.warn(TAG, message);
}

export function error(message: string | Message, reason?: any) {
    console.error(TAG, message, reason);
}

export function setError(status: Message, context?: any) {
    if (process.env.NODE_ENV !== "production") {
        error(status, context);
    }
    lastStatus = status;
}

export function measure(ts: number): number {
    if (process.env.NODE_ENV !== "production") {
        return performance.now() - ts;
    } else {
        return 0;
    }
}