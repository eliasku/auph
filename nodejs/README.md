## Auph for NodeJS

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
    auph.shutdown();
}, 2000);
```