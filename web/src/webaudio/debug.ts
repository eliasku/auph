const TAG = "[AUPH]";

export function log(message: string) {
    if (process.env.NODE_ENV !== "production") {
        console.log(TAG, message);
    }
}

export function warn(message: string) {
    console.warn(TAG, message);
}

export function error(message: string, reason?: any) {
    console.error(TAG, message, reason);
}

export function measure(ts: number): number {
    if (process.env.NODE_ENV !== "production") {
        return performance.now() - ts;
    } else {
        return 0;
    }
}