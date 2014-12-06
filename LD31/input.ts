/// <reference path="game.ts" />

class Input {
    keysDown: { [id: number]: boolean; } = {};

    constructor() {
        addEventListener("keydown", (e) => {
            this.keysDown[e.keyCode] = true;
            if (e.keyCode == 32 || e.keyCode == 16) {
                e.preventDefault();
            }
        });
        addEventListener("keyup", (e) => {
            delete this.keysDown[e.keyCode];
        });
    }
}