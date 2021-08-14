import {iMask, tMask, u31, vIncr, vMask} from "../protocol/interface";

export interface Obj {
    h: u31;
    s: u31;
}

export function nextHandle(h: u31) {
    return ((h + vIncr) & vMask) | (h & (tMask | iMask));
}

