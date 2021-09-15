import {len} from "./common";

export function unlock(unlocked: () => boolean) {
    // "touchstart", "touchend", "mousedown", "pointerdown"
    const events = ["touchstart", "touchend", "mousedown", "click", "keydown"];
    const num = len(events);
    const doc = document;
    const handle = () => {
        if(unlocked()) {
            for (let i = 0; i < num; ++i) {
                doc.removeEventListener(events[i], handle, true);
            }
        }
    };
    for (let i = 0; i < num; ++i) {
        doc.addEventListener(events[i], handle, true);
    }
}