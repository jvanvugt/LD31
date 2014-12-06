/// <reference path="game.ts" />
var Input = (function () {
    function Input() {
        var _this = this;
        this.keysDown = {};
        addEventListener("keydown", function (e) {
            _this.keysDown[e.keyCode] = true;
            if (e.keyCode == 32 || e.keyCode == 16) {
                e.preventDefault();
            }
        });
        addEventListener("keyup", function (e) {
            delete _this.keysDown[e.keyCode];
        });
    }
    return Input;
})();
/// <reference path="scripts/typings/threejs/three.d.ts" />
/// <reference path="input.ts" />
var Game = (function () {
    function Game(content) {
        var _this = this;
        this.treeOffset = 1000;
        this.moveSpeed = 16;
        this.tick = function () {
            _this.update();
            _this.render();
            window.requestAnimationFrame(_this.tick);
        };
        this.input = new Input();
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(960, 600);
        this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 10000);
        this.camera.position.z = 300;
        this.createScene();
        content.appendChild(this.renderer.domElement);
        this.crackSprites = [];
        this.crackSprites.push(this.loadPlane(32, 32, "crack2.png"));
        this.crackSprites.push(this.loadPlane(32, 32, "crack3.png"));
        this.crackSprites.push(this.loadPlane(32, 32, "crack4.png"));
        this.cracks = [];
        this.cracksXPos = [];
    }
    Game.prototype.start = function () {
        this.tick();
    };

    Game.prototype.update = function () {
        var _this = this;
        if (68 in this.input.keysDown && this.camera.position.x < 160) {
            this.camera.position.x += 5;
        }

        if (65 in this.input.keysDown && this.camera.position.x > -180) {
            this.camera.position.x -= 5;
        }

        if (32 in this.input.keysDown) {
            this.addCrack();
        }

        this.trees.forEach(function (tree) {
            if (tree.position.z >= _this.camera.position.z) {
                tree.translateZ(-_this.treeOffset * _this.trees.length / 2);
            } else {
                tree.translateZ(_this.moveSpeed);
            }
        });

        this.foliage.forEach(function (fol) {
            if (fol.position.z >= _this.camera.position.z) {
                fol.translateZ(-3000);
            } else {
                fol.translateZ(_this.moveSpeed);
            }
        });
        this.skyLine.position.x = this.camera.position.x;
        this.carInterior.position.x = this.camera.position.x;
        this.windscreen.position.x = this.camera.position.x;
        for (var i = 0; i < this.cracks.length; i++) {
            this.cracks[i].position.x = this.camera.position.x + this.cracksXPos[i];
        }
    };

    Game.prototype.addCrack = function () {
        var crack = this.crackSprites[Math.floor(Math.random() * this.crackSprites.length)].clone();
        var xPos = this.randomRange(-30, 80);
        this.cracksXPos.push(xPos);
        crack.position.set(xPos, this.randomRange(-30, 30), 223);
        crack.rotateZ(Math.random() * Math.PI * 2);
        this.scene.add(crack);
        this.cracks.push(crack);
    };

    Game.prototype.randomRange = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    Game.prototype.render = function () {
        this.renderer.render(this.scene, this.camera);
    };

    Game.prototype.createScene = function () {
        var _this = this;
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0xcccccc, 0.1, 3000);
        this.scene.add(this.camera);

        this.carInterior = this.loadPlane(160, 90, "interior.png");
        this.carInterior.translateZ(224);
        this.scene.add(this.carInterior);

        this.windscreen = this.loadPlane(160, 90, "windscreen.png");
        this.windscreen.translateZ(222);
        this.scene.add(this.windscreen);

        this.road = this.loadPlane(100, 100, "road.png");
        this.road.translateY(-100);
        this.road.translateZ(500);
        this.road.rotateX(-Math.PI / 2);
        this.road.scale.x = 120;
        this.road.scale.y = 1000;

        var tree = this.loadPlane(100, 200, "tree.png");
        tree.translateY(-75);
        tree.scale.y = 4;
        tree.translateZ(-1000);
        this.trees = [];
        for (var i = 0; i < 5 * 2; i++) {
            var newTree = tree.clone();
            newTree.translateX(350 * ((i % 2 == 0) ? -1 : 1));
            newTree.translateZ(Math.floor(i / 2) * this.treeOffset);
            this.trees.push(newTree);
        }

        this.skyLine = this.loadPlane(100, 100, "skyline.png");
        this.skyLine.material.setValues({ fog: false });
        this.skyLine.translateZ(-6000);
        this.skyLine.scale.x = 140;
        this.skyLine.scale.y = 30;
        this.skyLine.translateY(30 * 100 / 2 - 300);

        var grass = this.loadPlane(100, 100, "foliage.png");
        grass.translateY(-50);
        grass.scale.y = 0.5;
        grass.translateZ(-1000);
        this.foliage = [];
        for (var i = 0; i < 80; i++) {
            var newGrass = grass.clone();
            var xOffset = this.randomRange(400, 1600);
            newGrass.translateX(xOffset * ((Math.random() > 0.5) ? 1 : -1));
            newGrass.translateZ(Math.floor(Math.random() * 3000));
            this.foliage.push(newGrass);
        }
        this.foliage.forEach(function (fol) {
            return _this.scene.add(fol);
        });

        var sky = this.loadPlane(100, 100, "sky.png");
        sky.material.setValues({ fog: true });
        sky.translateY(2000);
        sky.translateZ(this.skyLine.position.z - 50);
        sky.scale.x = 140;
        sky.scale.y = 60;
        this.scene.add(sky);

        this.scene.add(this.skyLine);
        this.trees.forEach(function (tree) {
            return _this.scene.add(tree);
        });
        this.scene.add(this.road);
    };

    Game.prototype.loadPlane = function (width, height, textureURL) {
        var texture = THREE.ImageUtils.loadTexture(textureURL);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        return new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, transparent: true }));
    };
    return Game;
})();

window.onload = function () {
    new Game(document.getElementById('content')).start();
};
//# sourceMappingURL=ld31.js.map
