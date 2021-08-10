import {_setDeviceActive, _setDeviceRunning} from "./impl/Device";
import {_getBusState} from "./impl/Bus";
import {error} from "./impl/debug";
import {audioDataPool} from "./impl/AudioData";
import {_getVoiceObjAt} from "./impl/Voice";
import {getAudioContextObject} from "./impl/Context";

export type smi = number;

const versionMask = 0x3FFF0000;
const versionIncr = 0x00010000;
const indexMask = 0x00003FFF;
const typeMask = 0x0000C000;

export const enum Name {
    Master = 0,
    Sound = 1,
    Music = 2,
    Speech = 3,
}

export const enum Param {
    Active = 0,
    Running = 1,

    Index,
    Version,
    Type,

    InUseCount,
    SampleRate,

    Stream,
    Loaded,
}

export const enum Type {
    Bus = 0x00000000,
    Voice = 0x00004000,
    Buffer = 0x00008000
}

export function set(name: smi, param: smi, value: smi): void {
    if (name === Name.Master) {
        if (param == Param.Running) {
            _setDeviceActive(value);
            return;
        } else if (param == Param.Running) {
            _setDeviceRunning(value);
            return;
        }
    }
    // if (param === Param.Index || param === Param.Type || param === Param.Version) {
    //     error("param is readonly", param);
    // }
}

// check type
// if(get(voice, Param.Type) == Type.Voice)

function getBusI(name: smi, param: Param): smi {
    switch (param) {
        case Param.Active:
            return 1;
        case Param.Running:
            return _getBusState(name & indexMask);
    }
    error("Invalid Param for Bus object", name);
    return 0;
}

function getMasterParam(): smi {

}


function getBufferFlag(name: smi, flag: BufferFlag): smi {
    const obj = audioDataPool[name & indexMask];
    return obj ? (obj.cf & flag) : 0;
}

function getVoiceFlag(name: smi, flag: VoiceFlag): smi {
    const obj = _getVoiceObjAt(name & indexMask);
    return obj ? (obj.cf & flag) : 0;
}

export function get(name: smi, param: Param): smi {
    if (name === Name.Master) {
        return getMasterI(param);
    }

    switch (param) {
        case Param.Index:
            return name & indexMask;
        case Param.Type:
            return name & typeMask;
        case Param.Version:
            return name & versionMask;
    }

    const type = name & typeMask;
    switch (type) {
        case Type.Bus:
            return getBusI(name, param);
        case Type.Buffer:
            return getBufferI(name, param);
        case Type.Voice:
            return getVoiceI(name, param);
    }

    error("Invalid Param", name);
    return 0;
}