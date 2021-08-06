const TAG = "[AUPH]";

export function log(message: string) {
    console.log(TAG, message);
}

export function warn(message: string) {
    console.warn(TAG, message);
}

export function error(message: string, reason?: any) {
    console.error(TAG, message, reason);
}

export function measure(ts: number = 0): number {
    return performance.now() - ts;
}