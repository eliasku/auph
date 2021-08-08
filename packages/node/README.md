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
const Auph = require("auph-node");

Auph.init();
Auph.resume();

const clap = Auph.load("clap.mp3", false);
const music = Auph.load("music.ogg", false);

Auph.play(clap);
Auph.play(music);

setTimeout(() => {
    Auph.shutdown();
}, 2000);
```