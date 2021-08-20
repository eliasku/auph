var auph=function(n){"use strict";var t=805306368,e=255,r=1024;var a=Object.freeze({__proto__:null,init:function(){},shutdown:function(){},load:function(n,t){return 0},loadMemory:function(n,t){return 0},unload:function(n){},voice:function(n,t,e,r,a,u){return 0},stop:function(n){},set:function(n,t,e){},get:function(n,t){return 0}}),u="[AUPH]";function i(n){console.warn(u,n)}function o(n,t){console.error(u,n,t)}var f="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAVFYAAFRWAAABAAgAZGF0YQAAAAA=",c=function(n,t){this.el=n,this.node=t};function s(n){return n.el.src===f}function l(n){var t=n.el;t.src!==f&&(t.onended=null,t.pause(),t.src=f,t.currentTime=0,n.node.disconnect())}function d(n){n.el.play().then((function(){})).catch((function(n){o("error on play stream",n)}))}var v=[];function h(n,t){for(var e=0;e<v.length;++e){var r=v[e];if(s(r))return r.el.src=t,r}if(v.length<4){var a=function(n,t){var e=new Audio(t);return e.preload="metadata",e.preservesPitch=!1,new c(e,n.createMediaElementSource(e))}(n,t);return v.push(a),a}return null}var g=null,p=["click","keydown"];function b(){return g&&"closed"!==g.state?g:(i(2),null)}function _(){return g}function A(n){n.resume().then((function(){})).catch((function(n){o(5,n)}))}function m(){for(var n=0;n<p.length;++n)document.removeEventListener(p[n],m,!0);g&&"suspended"===g.state&&A(g)}function w(){return g?(i(14),g):((g=function(n){try{var t=window;return new(t.AudioContext||t.webkitAudioContext)(n)}catch(n){o(1)}return null}({latencyHint:"interactive",sampleRate:22050}))&&"suspended"===g.state&&function(){for(var n=0;n<p.length;++n)document.addEventListener(p[n],m,!0)}(),g)}function R(n){n.close().then((function(){})).catch((function(n){o(11,n)})),g=null}function y(n,t){n.value!==t&&(n.value=t)}function S(n){return n+256&16776960|805306623&n}var E=function(n,t,e){var a=this;this.gain=n,this.pan=t,this.h=0,this.s=0,this._gain=r,this._pan=r,this._rate=r,this.data=0,this.bus=0,this.stream=null,this._started=!1,this.buffer=null,this.target=null,this._e=function(){U(a)},this.h=805306368|e};function U(n){n.stream&&(l(n.stream),n.stream=null);var t=n.buffer;t&&(0!=(2&n.s)&&t.stop(),t.disconnect(),n.buffer=null),function(n){n.target&&(n.gain.disconnect(n.target),n.target=null)}(n),n.data=0,n.bus=0,n.s=0,n.h=S(n.h)}function B(n){var t=n.buffer;t&&!n._started&&(t.onended=n._e,t.loop=0!=(4&n.s),t.start(),n._started=!0)}function L(n,t){n._rate!==t&&(n._rate=t,n.stream?n.stream.el.playbackRate=t/r:n.buffer&&0!=(2&n.s)&&(n.buffer.playbackRate.value=t/r))}var M=[null];function O(n){var t=M[n&e];return t&&t.h===n?t:null}function k(n){for(var t=1;t<M.length;++t){if(0===(e=M[t]).s)return e.h}var e,r=M.length;return r<64?((e=function(n,t){var e=n.createGain(),r=n.createStereoPanner();return r.connect(e),new E(e,r,t)}(n,r)).h=805306368|r,M.push(e),e.h):0}var P=function(n){this.gain=n,this.h=0,this.s=3,this._gain=r},C=[];function T(n){var t=C.length,e=new P(n.createGain());return e.h=268435456|t,C.push(e),e}function F(n){var t=C[n&e];return t&&t.h===n?t:null}var G=function(n){this.s=0,this.data=null,this.h=536870912|n},j=[null];function I(){for(var n=1;n<j.length;++n){var t=j[n];if(0===t.s)return t.h}var e=j.length;if(e<128){var r=new G(e);return j.push(r),r.h}return 0}function x(n){var t=j[n&e];return t&&t.h===n?t:null}function N(n,t){return fetch(new Request(n)).then(t)}function V(n){if(0!==n){var e=n&t;if(805306368===e)(r=O(n))&&U(r);else if(536870912===e){var r;if(r=x(n))for(var a=1;a<M.length;++a){var u=M[a];u.data===n&&U(u)}}}}function D(n,t){for(var e=0,r=1;r<n.length;++r){var a=n[r];a&&(a.s&t)===t&&++e}return e}var H=Object.freeze({__proto__:null,init:function(){var n=w();n&&function(n){var t=T(n).gain;t.connect(n.destination),T(n).gain.connect(t),T(n).gain.connect(t),T(n).gain.connect(t)}(n)},shutdown:function(){var n=b();n&&(!function(){for(var n=0;n<C.length;++n)C[n].gain.disconnect();C.length=0}(),M.length=1,j.length=1,function(){for(var n=0;n<v.length;++n){var t=v[n];l(t),t.el.src=""}v.length=0}(),R(n))},load:function(n,t){var r=I();return r&&function(n,t,e){n.s|=1,4&e?(n.s|=4,N(t,(function(n){return n.blob()})).then((function(t){n.data=URL.createObjectURL(t),n.s|=2})).catch((function(n){o("can't load audio stream data "+t,n)}))):N(t,(function(n){return n.arrayBuffer()})).then((function(n){var t=b();return t?t.decodeAudioData(n):null})).then((function(t){n.data=t,t&&(n.s|=2)})).catch((function(n){o("Error decoding audio buffer",n)}))}(j[r&e],n,t),r},loadMemory:function(n,t){var r=I();return r&&function(n,t,e){n.s|=1;var r=t.buffer.slice(t.byteOffset,t.byteOffset+t.byteLength);if(4&e)n.s|=4,n.data=URL.createObjectURL(new Blob([r])),n.s|=2;else{var a=b();a&&a.decodeAudioData(r).then((function(t){n.data=t,n.s|=2})).catch((function(n){o("Error decode audio buffer",n)}))}}(j[r&e],n,t),r},unload:function(n){var t=x(n);t&&(V(n),function(n){0!=(4&n.s)&&n.data&&URL.revokeObjectURL(n.data),n.s=0,n.h=S(n.h),n.data=null}(t))},voice:function(n,t,e,a,u,i){if(-7&u)return 0;var o=_();if(!o||"running"!==o.state)return null==o||o.state,0;var f=x(n);if(!f)return 0;if(!(2&f.s))return 0;if(!f.data)return 0;var c,s=(c=F(i||268435457))?c.gain:void 0;if(!s)return 0;var l=k(o);if(0===l)return 0;var v=O(l);if(v.s=1|u,v.data=n,v._rate=a,v._gain=t,v._pan=e,v.gain.gain.value=t/r,v.pan.pan.value=e/r-1,4&f.s){var g=h(o,f.data);if(!g)return 0;v.stream=g,g.el.loop=!!(4&u),g.node.connect(v.pan),g.el.onended=v._e,2&u&&d(g)}else!function(n,t,e){var r=t.createBufferSource();r.buffer=e,r.connect(n.pan),n.buffer=r,n._started=!1}(v,o,f.data),2&u&&B(v);return function(n,t){if(t!==n.target){var e=n.gain;n.target&&e.disconnect(n.target),n.target=t,t&&e.connect(t)}}(v,s),L(v,a),l},stop:V,set:function(n,e,a){if(0!==n){if(1===n&&128&e&&2&e){var u=b();u&&(a&&"suspended"===u.state?A(u):a||"running"!==u.state||function(n){n.suspend().then((function(){})).catch((function(n){o(8,n)}))}(u))}var i=n&t;if(805306368===i){if(c=O(n))if(128&e){var f=0!==a;2&e?function(n,t){t!==!!(2&n.s)&&(n.s^=2,n.stream?t?d(n.stream):n.stream.el.pause():n.buffer&&(n.buffer.playbackRate.value=t?n._rate/r:0,t&&B(n)))}(c,f):4&e&&function(n,t){t!==(0!=(4&n.s))&&(n.s^=4,n.stream?n.stream.el.loop=t:n.buffer&&(n.buffer.loop=t))}(c,f)}else switch(e){case 1:c._gain!==a&&(c._gain=a,y(c.gain.gain,a/r));break;case 2:c._pan!==a&&(c._pan=a,y(c.pan.pan,a/r-1));break;case 3:L(c,a)}}else if(268435456===i){var c;if(c=F(n))if(128&e)2&e&&function(n,t){if(!!(2&n.s)!==t){var e=C[0],r=n===e?_().destination:e.gain;t?n.gain.connect(r):n.gain.disconnect(r),n.s^=2}}(c,!!a);else switch(e){case 1:c._gain!==a&&y(c.gain.gain,a/r)}}}},get:function(n,a){if(1===n){var u=_();if(u){if(0===a)return function(n){var t=0;return"closed"!==n.state&&(t|=1,"running"===n.state&&(t|=2)),t}(u);if(5===a)return 0|u.sampleRate}return 0}var o=n&t;if(256&a&&!(n&e)){var f=127&a;return 805306368===o?D(M,f):268435456===o?D(C,f):536870912===o?D(j,f):0}if(805306368===o){if(s=O(n))switch(a){case 0:return s.s;case 1:return s._gain;case 2:return s._pan;case 3:return s._rate;case 6:var c=0;return s.buffer&&s.buffer.buffer?c=s.buffer.buffer.duration*r:s.stream&&(c=s.stream.el.duration*r),c*r|0;case 4:c=0;return s.buffer&&s.buffer.buffer||s.stream&&(c=s.stream.el.currentTime),c*r|0;default:i(1)}return 0}if(268435456===o){if(s=F(n))switch(a){case 0:return s.s;case 1:return s._gain;default:i(1)}return 0}if(536870912===o){var s;if(s=x(n))switch(a){case 0:return s.s;case 6:c=0;return 4&s.s?i(1):s.data&&(c=s.data.duration),c*r|0;default:i(1)}return 0}return 0}});var Q="undefined"!=typeof process?require("bindings")("auph"):"undefined"!=typeof window&&(window.AudioContext||window.webkitAudioContext)?H:a,X=Q.init,Z=Q.shutdown,q=Q.set,z=Q.get,Y=Q.load,W=Q.loadMemory,J=Q.unload,K=Q.stop;function $(n,t){q(n,130,0|!t)}function nn(n){return n*r|0}return n.ACTIVE=1,n.BUFFER=536870912,n.BUS=268435456,n.BUS_MASTER=268435456,n.BUS_MUSIC=268435458,n.BUS_SFX=268435457,n.BUS_SPEECH=268435459,n.COUNT=256,n.LOOP=4,n.MIXER=1,n.RUNNING=2,n.SAMPLE_RATE=5,n.STATE=0,n.STREAM=4,n.VOICE=805306368,n.get=z,n.getBufferStateString=function(n){return["free","loading","","loaded"][3&n]+[""," streaming"][n>>>2&1]},n.getCurrentTime=function(n){return z(n,4)/r},n.getDuration=function(n){return z(n,6)/r},n.getGain=function(n){return z(n,1)/r},n.getLoop=function(n){return!!(4&z(n,0))},n.getMixerStateString=function(n){return["closed","paused","","running"][3&n]},n.getPan=function(n){return z(n,2)/r-1},n.getPause=function(n){return!(2&z(n,0))},n.getRate=function(n){return z(n,3)/r},n.init=X,n.isActive=function(n){return!!(1&z(n,0))},n.isBufferLoaded=function(n){return 3==(3&z(n,0))},n.load=Y,n.loadMemory=W,n.pause=function(n){void 0===n&&(n=1),$(n,!0)},n.play=function(n,t,e,r,a,u,i){void 0===t&&(t=1),void 0===e&&(e=0),void 0===r&&(r=1);var o=0;return a&&(o|=4),u||(o|=2),Q.voice(n,nn(t),nn(+e+1),nn(r),o,0|i)},n.resume=function(n){void 0===n&&(n=1),$(n,!1)},n.set=q,n.setGain=function(n,t){q(n,1,nn(t))},n.setLoop=function(n,t){q(n,132,0|t)},n.setPan=function(n,t){q(n,2,nn(+t+1))},n.setPause=$,n.setRate=function(n,t){q(n,3,nn(t))},n.shutdown=Z,n.stop=K,n.unload=J,Object.defineProperty(n,"__esModule",{value:!0}),n}({});//# sourceMappingURL=auph.js.map
