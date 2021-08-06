var Auph=function(n){"use strict";var e="[AUPH]";function t(n){console.log(e,n)}function r(n){console.warn(e,n)}function u(n,t){console.error(e,n,t)}function a(n){return void 0===n&&(n=0),performance.now()-n}var i=null,o=["mousedown","pointerdown","touchstart"],c=!1;function f(){return i?"closed"===i.state?(u("invalid state:","Context is closed"),null):i:(r("not initialized"),null)}function s(n){t("resuming..."),n.resume().then((function(){t("resumed")})).catch((function(n){c?u("error resuming AudioContext",n):(t("cannot resume until user interaction, setup unlock handler..."),function(){for(var n=document.addEventListener,e=0;e<o.length;++e)n(o[e],l)}())}))}function l(){c=!0;for(var n=document.removeEventListener,e=0;e<o.length;++e)n(o[e],l);i&&"suspended"===i.state&&s(i)}function v(){return i?(r("already initialized"),i):(i=new AudioContext({latencyHint:"interactive",sampleRate:22050}))?("running"===i.state&&function(n){t("AudioContext suspending..."),n.suspend().then((function(){t("AudioContext suspended")})).catch((function(n){u("error suspending AudioContext",n)}))}(i),t("Latency: "+i.baseLatency),t("Sample rate: "+i.sampleRate),i):(u("error create AudioContext"),null)}function d(n){t("shutdown..."),n.close().then((function(){t("shutdown completed")})).catch((function(n){u("shutdown error",n)})),i=null}var g="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAVFYAAFRWAAABAAgAZGF0YQAAAAA=",h=function(n,e){this.el=n,this.node=e};function p(n){return n.el.src===g}function m(n){var e=n.el;e.src!==g&&(e.pause(),e.src=g,e.currentTime=0,n.node.disconnect())}function A(n){n.el.play().then((function(){t("started stream player")})).catch((function(n){u("error on play stream",n)}))}var b=[];function w(n){for(var e=0;e<b.length;++e){var t=b[e];if(p(t))return t.el.src=n,t}if(b.length<4){var r=f();if(r){var u=function(n,e){var t=new Audio(e);return t.preload="auto",t.preservesPitch=!1,new h(t,n.createMediaElementSource(t))}(r,n);return b.push(u),u}}return null}var E=16776960,S=function(n,e){this.gain=n,this.pan=e,this.stream=null,this.buffer=null,this.rate=1,this.cf=0,this.target=null,this.src=0,this.v=0};function y(n){n.stream&&(m(n.stream),n.stream=null);var e=n.buffer;e&&(0!=(1&n.cf)&&e.stop(),e.disconnect(),n.buffer=null),function(n){n.target&&(n.gain.disconnect(n.target),n.target=null)}(n),n.src=0,n.cf=0,n.v=n.v+256&E}function R(n){if(0==(1&n.cf)){var e=n.buffer;e&&(e.addEventListener("ended",(function(e){n.buffer===e.target&&y(n)})),e.loop=0!=(4&n.cf),e.start(),n.cf|=1)}}function L(n,e){n.rate!==e&&(n.rate=e,n.stream?n.stream.el.playbackRate=e:n.buffer&&(2&n.cf||(n.buffer.playbackRate.value=e)))}var P=[null];function F(n){var e=P[255&n];return e&&e.v===(n&E)?e:null}function V(){for(var n=1;n<P.length;++n){var e=P[n];if(0===e.src)return n|e.v}var t=P.length;if(t<64){var r=f();if(r)return P.push(function(n){var e=n.createGain(),t=n.createStereoPanner();return t.connect(e),new S(e,t)}(r)),t}return 0}var B=function(){this.isFree=!0,this.url=null,this.buffer=null},_=[null],C=function(n,e){void 0===e&&(e=!0),this.gain=n,this.e=e},I=[];function x(n){var e=new C(n.createGain());return I.push(e),e}function k(n){return I[n]}function O(n){var e;return null===(e=k(n))||void 0===e?void 0:e.gain}function T(n){if(0!==n)for(var e=1;e<P.length;++e){var t=P[e];t.src===n&&y(t)}else console.warn("invalid source")}var D=0,G=1,M=2,N=3,U=4;return n.BUFFERS_LOADED=M,n.INFINITE_LOOPING=1073741824,n.SAMPLE_RATE=U,n.STREAMS_IN_USE=G,n.STREAMS_LOADED=N,n.VOICES_IN_USE=D,n._getAudioContext=function(){return f()},n.destroyAudioSource=function(n){if(0!==n){T(n);var e=_[n];e&&(e.buffer=null,e.url=null,e.isFree=!0)}},n.getAudioSourceLength=function(n){if(0!==n){var e=_[n];e&&(e.buffer?e.buffer.duration:e.url)}return 0},n.getBusEnabled=function(n){var e=k(n);return!!e&&e.e},n.getBusVolume=function(n){var e=O(n);return e?e.gain.value:0},n.getInteger=function(n){switch(n){case D:for(var e=0,t=1;t<P.length;++t)P[t].buffer&&++e;return e;case G:return function(){for(var n=0,e=0;e<b.length;++e)p(b[e])||++n;return n}();case M:case N:return 0;case U:var r=f();return r?r.sampleRate:0}return-1},n.getLoop=function(n){var e=F(n);return!!e&&0!=(4&e.cf)},n.getPan=function(n){var e=F(n);return e?e.pan.pan.value:0},n.getPause=function(n){var e=F(n);return!!e&&0!=(2&e.cf)},n.getPitch=function(n){var e=F(n);return e?e.rate:1},n.getVoiceLength=function(n){var e=F(n),t=0;return e&&(e.buffer&&e.buffer.buffer?t=e.buffer.buffer.duration:e.stream&&(t=e.stream.el.duration)),t},n.getVoicePosition=function(n){var e=F(n),t=0;return e&&(e.buffer&&e.buffer||e.stream&&(t=e.stream.el.currentTime)),t},n.getVoiceState=function(n){var e=F(n);return e?e.cf:0},n.getVolume=function(n){var e=F(n);return e?e.gain.gain.value:1},n.init=function(){var n=v();n&&function(n){var e=x(n).gain;e.connect(n.destination),x(n).gain.connect(e),x(n).gain.connect(e),x(n).gain.connect(e)}(n)},n.isVoiceValid=function(n){return!!(t=P[255&(e=n)])&&t.v===(e&E);var e,t},n.loadAudioSource=function(n,e){if(!f())return 0;for(var r=0,i=1;i<_.length;++i)_[i].isFree&&(r=i);0===r&&(_.push(new B),r=_.length-1);var o=_[r];if(o.isFree=!1,e)o.url=n;else{var c=0;fetch(new Request(n)).then((function(n){return n.arrayBuffer()})).then((function(n){var e=f();return e?(c=a(),e.decodeAudioData(n)):null})).then((function(n){o.buffer=n,n&&t("decoding time: "+(0|a(c))+" ms.")})).catch((function(e){u("can't load audio buffer from "+n,e)}))}return r},n.pause=function(){var n=f();n&&"running"===n.state&&(t("pausing"),n.suspend().then((function(){t("paused")})).catch((function(n){u("pause error",n)})))},n.play=function(n,e,t,u,a,i,o){if(void 0===e&&(e=1),void 0===t&&(t=0),void 0===u&&(u=1),void 0===a&&(a=!1),void 0===i&&(i=!1),void 0===o&&(o=1),0===n)return 0;var c=f();if(!c)return 0;var s=_[n];if(!s||s.isFree)return r("audio source not found"),0;if(!s.url&&!s.buffer)return r("nothing to play, audio source is empty!"),0;var l=O(o);if(!l)return r("invalid target bus!"),0;var v=V();if(!v)return r("no more free simple voices!"),0;var d=F(v);if(i&&(d.cf|=4),a&&(d.cf|=2),d.rate=1,d.src=n,d.gain.gain.value=e,d.pan.pan.value=t,s.url){var g=w(s.url);if(!g)return r("no more free media stream elements!"),0;d.stream=g,g.el.loop=i,g.node.connect(d.pan),a||(A(g),d.cf|=1)}else s.buffer&&(!function(n,e,t){var r=e.createBufferSource();r.buffer=t,r.connect(n.pan),n.buffer=r}(d,c,s.buffer),a||R(d));return function(n,e){if(e!==n.target){var t=n.gain;n.target&&t.disconnect(n.target),n.target=e,e&&t.connect(e)}}(d,l),L(d,u),v},n.resume=function(){var n=f();n&&"suspended"===n.state&&s(n)},n.setBusEnabled=function(n,e){var t=k(n);t&&function(n,e){if(n.e!==e){var t=I[0],r=n===t?f().destination:t.gain;e?n.gain.connect(r):n.gain.disconnect(r),n.e=e}}(t,e)},n.setBusVolume=function(n,e){var t=O(n);t&&(t.gain.value=e)},n.setLoop=function(n,e){var t=F(n);t&&function(n,e){e!==(0!=(4&n.cf))&&(n.cf^=4,n.stream?n.stream.el.loop=e:n.buffer&&(n.buffer.loop=e))}(t,e)},n.setPan=function(n,e){var t=F(n);t&&(t.pan.pan.value=e)},n.setPause=function(n,e){var t=F(n);t&&function(n,e){e!==(0!=(2&n.cf))&&(n.cf^=2,e?n.stream?n.stream.el.pause():n.buffer&&(n.buffer.playbackRate.value=0):n.stream?A(n.stream):n.buffer&&(n.buffer.playbackRate.value=n.rate,R(n)))}(t,e)},n.setPitch=function(n,e){var t=F(n);t&&L(t,e)},n.setVolume=function(n,e){var t=F(n);t&&(t.gain.gain.value=e)},n.shutdown=function(){var n=f();n&&(!function(){for(var n=0;n<I.length;++n)I[n].gain.disconnect();I.length=0}(),P.length=1,_.length=1,function(){for(var n=0;n<b.length;++n){var e=b[n];m(e),e.el.src=""}b.length=0}(),d(n))},n.stop=function(n){var e=F(n);e&&y(e)},n.stopAudioSource=T,Object.defineProperty(n,"__esModule",{value:!0}),n}({});//# sourceMappingURL=auph.js.map
