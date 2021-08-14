## Auph for NodeJS

Work in progress

- [x] init, pause, resume, shutdown
- [x] load, unload
- [x] play, stop
- [ ] voice params control
- [ ] bus control
- [ ] get state functions

### Platforms

- [x] macOS
- [ ] Windows
- [ ] Linux

### Example

```javascript
const auph = require("auph");

auph.init();
auph.resume();

const clap = auph.load("clap.mp3", 0);
const music = auph.load("music.ogg", 0);

auph.play(clap);
auph.play(music);

setTimeout(() => {
    Auph.shutdown();
}, 2000);
```