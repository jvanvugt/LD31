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
        this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 10000);
        this.camera.position.z = 300;
        this.scene = new THREE.Scene();
        this.scene.add(this.camera);
        this.road = this.loadPlane(100, 100, "road.png");
        this.road.translateY(-150);
        this.road.translateZ(500);
        this.road.rotateX(-Math.PI / 2);
        this.road.scale.x = 15;
        this.road.scale.y = 1000;
        this.scene.add(this.road);
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

    Game.prototype.loadPlane = function (width, height, textureURL) {
        var texture = THREE.ImageUtils.loadTexture(textureURL);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        return new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({ map: texture }));
    };
    return Game;
})();

window.onload = function () {
    new Game(document.getElementById('content')).start();
};
//# sourceMappingURL=ld31.js.map
