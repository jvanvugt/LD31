/// <reference path="scripts/typings/webaudioapi/waa.d.ts" />

class AudioPlayer {

    context: AudioContext;
    songBuffer: AudioBuffer;
    source: AudioBufferSourceNode;
    sfxsrc: AudioBufferSourceNode;
    sfxBuffer: AudioBuffer;
    muted: boolean = false;

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

    loadSFX(name: string) {
        var request = new XMLHttpRequest();
        request.open('GET', name, true);
        request.responseType = 'arraybuffer';
        request.onload = () => {
            this.context.decodeAudioData(request.response, (buffer) => {
                this.sfxBuffer = buffer;
            });
        }
        request.send();
    }

    playSFX() {
        if (!this.muted) {
            this.sfxsrc = this.context.createBufferSource();
            this.sfxsrc.buffer = this.sfxBuffer;
            this.sfxsrc.connect(this.context.destination);
            this.sfxsrc.start(0);
        }
    }

    playSound(buffer: AudioBuffer) {
        this.source = this.context.createBufferSource();
        this.source.buffer = buffer;
        this.source.connect(this.context.destination);
        this.source.loop = true;
        this.source.start(0);
    }

    mute() {
        if (this.muted) {
            this.source.start(0);
            this.muted = false;
        }
        else {
            this.muted = true
            this.source.stop(0);
        }
    }

}