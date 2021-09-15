import {Message} from "../protocol/interface";

const TAG = "auph";

let lastStatus = 0;

export function log(message: string | Message) {
    if (process.env.NODE_ENV !== "production") {
        console.log(TAG, message);
    }
}

export function warn(message: string | Message) {
    if (process.env.NODE_ENV !== "production") {
        console.warn(TAG, message);
    }
}

export function error(message: string | Message, reason?: any) {
    if (process.env.NODE_ENV !== "production") {
        console.error(TAG, message, reason);
    }
}

export function setError(status: Message, context?: any) {
    if (process.env.NODE_ENV !== "production") {
        error(status, context);
    }
    lastStatus = status;
}