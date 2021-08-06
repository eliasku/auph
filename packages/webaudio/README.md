# Auph - WebAudio

Auph is simple audio library for games. This package contains draft implementation for WebAudio.

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

### TODO

- Get AudioSource state: invalid, empty, loading, ready