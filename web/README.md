# Auph - WebAudio

Auph is simple audio library for games. This package contains draft implementation for WebAudio.

### Web Example

Load library:
```html
<script src="https://eliasku.github.io/auph/auph.js" type="text/javascript"></script>
```

Write some JavaScript
```javascript
auph.init();
auph.resume();
var data = auph.load("https://eliasku.github.io/auph/assets/wav/HiHat_Closed.wav", 0);
setInterval(()=>{
    auph.play(data);
}, 200);
```

