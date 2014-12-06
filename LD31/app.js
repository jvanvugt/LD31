/// <reference path="scripts/typings/threejs/three.d.ts" />
var Game = (function () {
    function Game(content) {
        var _this = this;
        this.tick = function () {
            _this.update();
            _this.render();
            window.requestAnimationFrame(_this.tick);
        };
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(960, 600);
        this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
        this.camera.position.z = 300;
        this.scene = new THREE.Scene();
        this.scene.add(this.camera);
        var loader = new THREE.TextureLoader();
        var road = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({}));
        loader.load("road.png", function () {
            road.material.setValues({ map: road });
            road.material.needsUpdate = true;
        });

        this.scene.add(road);
        content.appendChild(this.renderer.domElement);
    }
    Game.prototype.start = function () {
        this.tick();
    };

    Game.prototype.update = function () {
    };

    Game.prototype.render = function () {
        this.renderer.render(this.scene, this.camera);
    };
    return Game;
})();

window.onload = function () {
    new Game(document.getElementById('content')).start();
};
//# sourceMappingURL=app.js.map
