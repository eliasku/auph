export function unlock(unlocked: () => boolean) {
    // "touchstart", "touchend", "mousedown", "pointerdown"
    const events = ["touchstart", "touchend", "mousedown", "click", "keydown"];
    const num = events.length;
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