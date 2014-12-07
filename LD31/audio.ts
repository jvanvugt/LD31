/// <reference path="scripts/typings/webaudioapi/waa.d.ts" />

class AudioPlayer {

    context: AudioContext;
    songBuffer: AudioBuffer;
    source: AudioBufferSourceNode;

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
        this.source = this.context.createBufferSource();
        this.source.buffer = buffer;
        this.source.connect(this.context.destination);
        this.source.loop = true;
        this.source.start(0);
    }

    mute() {
        this.source.stop(0);
    }

}