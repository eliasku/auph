## 🔊 auph 🎧

Simple audio mixer for native and web

### Web Example

Load library:
```html
<script src="https://eliasku.github.io/auph/auph.js" type="text/javascript"></script>
```

Write some JavaScript
```javascript
Auph.init();
Auph.resume();
var source = Auph.loadAudioSource("https://eliasku.github.io/auph/assets/wav/HiHat_Closed.wav", false);
setInterval(()=>{
    Auph.play(source);
}, 200);
```

### API

#### Context Management

`void init()`

`void resume()`

`void pause()`

`void shutdown()`

##### private / debug

`int getInteger(Var param)`

`dynamic _getAudioContext()`

#### Loading / unloading

`AudioSource loadAudioSource(string filepath, bool streaming)`

`void destroyAudioSource(AudioSource source)`

#### Control Voices
```
Voice play(AudioSource source,
  volume = 1.0,
  pan = 0.0,
  pitch = 1.0,
  paused = false,
  loop = false
  Bus bus = 0)
```

`void stopAudioSource(AudioSource source)`

`void stop(Voice voice)`

`void setPan(Void voice, float value)`

`void setVolume(Void voice, float value)`

`void setPitch(Void voice, float value)`

`void setPause(Void voice, bool paused)`

