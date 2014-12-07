/// <reference path="scripts/typings/webaudioapi/waa.d.ts" />

class AudioPlayer {

    context: AudioContext;
    songBuffer: AudioBuffer;

    constructor() {
        try {
        this.context = new AudioContext();
        } catch (e) {
            alert("Your browser does not support the Web Audio API. Please upgrade your browser!");
        }
    }

    loadMusic(songPath: string) {
        var request = new XMLHttpRequest();
        request.open('GET', songPath, true);
        request.responseType = 'arraybuffer';

        request.onload = () => {
            this.context.decodeAudioData(request.response, (buffer) => {
                this.songBuffer = buffer;
                this.playSound(buffer);
            });
        }
        request.send();
    }

    playSound(buffer: AudioBuffer) {
        var source = this.context.createBufferSource();
        source.buffer = buffer;
        source.connect(this.context.destination);
        source.loop = true;
        source.start(0);
    }

}