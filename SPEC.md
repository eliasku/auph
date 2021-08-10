### Universal Object Names

**Object Name** is unique identifier associated with allocated library resource. Name is presented with **31-bit unsigned integer**.

**Null** is **Invalid Name** - all bits are zeros.

- **T**: Object's Type - 2 bit
    - 00: Bus
    - 01: Voice
    - 10: Buffer
- **i**: Object's Index
- **v**: Object's Version
- **R**: Reserved

```
| 0-vv vvvv | vvvv vvvv | TTii iiii | iiii iiii |
```

Working with Object Names

- Voice / Bus / Buffer, InUseCount: readonly
- any, SampleRate: readonly, mixing Sample Rate
- 0, Paused: readonly, device is on pause

- Name, Index: readonly
- Name, Type: readonly
- Name, Version: readonly

```javascript
// resume playback
Auph.set(0 /* Auph.MASTER */, Auph.PAUSED, 0);
// set voice on pause
Auph.set(voice, Auph.PAUSED, 1);
```

```c
// initialize playback
auph_set(0, AUPH_RUNNING, 1)
// resume playback
auph_set(0 /* AUPH_MASTER */, AUPH_PAUSED, 0);
// set voice on pause
auph_set(voice, AUPH_PAUSED, 1);

// shutdown playback
auph_set(0, AUPH_RUNNING, 0)
```

- Bus, Muted

- Voice, Looping
- Master / Voice, Paused - pause or resume Master or Voice
- Voice, Bus: readonly, only Voice - returns Voice's associated Bus

- Buffer, Loaded: readonly
- Buffer, Stream: readonly

get(Name, EnumName) - returns integer

get object type
setFloat(obj,

isVoice(voice) - isVoiceValid(voice)

voiceFlag(voice, VoiceFlag.Paused) - isVoicePaused(voice)
voiceFlag(voice, VoiceFlag.Looping) - isVoiceLooping(voice)

voiceParam(voice, VoiceParam.Pan) - getVoicePan(voice)
voiceParam(voice, VoiceParam.Rate) - getVoiceRate(voice)
voiceParam(voice, VoiceParam.Gain) - getVoiceGain(voice)
voiceParam(voice, VoiceParam.Time) - getVoiceTime(voice)

setVoiceParam(voice, VoiceParam.Gain, 1.0) - setVoiceGain(voice, 1.0)



setFloat(voice, Param.Gain, 1.0)
setFloat(bus, Param.Gain, 1.0)

setFlag(bus, Flag.Muted, true)
setFlag(voice, Flag.Looping, true)

getState(source, State.Loaded, true)


### Q: Why 31-bit unsigned integer?
A: Efficiency for JavaScript or another virtual machines with SMI types (for small-integer optimization).