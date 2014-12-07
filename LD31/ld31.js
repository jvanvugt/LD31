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
var Utils = (function () {
    function Utils() {
    }
    Utils.randomRange = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    Utils.randomDir = function () {
        return ((Math.random() > 0.5) ? 1 : -1);
    };
    return Utils;
})();
/// <reference path="scripts/typings/threejs/three.d.ts" />
/// <reference path="input.ts" />
/// <reference path="utils.ts" />
var Game = (function () {
    function Game(content) {
        var _this = this;
        this.treeOffset = 1000;
        this.moveSpeed = 16;
        this.isShaking = -1;
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
        this.scene = new THREE.Scene;
        this.deers = [];

        var light = new THREE.DirectionalLight(0xFDB813);
        light.position.z = 350;
        light.position.y = 300;
        light.lookAt(this.camera.position);
        this.scene.add(light);

        this.trees = [];
        var loader = new THREE.JSONLoader(true);

        loader.load("Models/road.json", function (geom, materials) {
            var road = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(materials));
            road.scale.set(3000, 1000, 250);
            road.position.y = -75;
            road.position.z = 290;
            road.rotateY(Math.PI / 2);
            road.updateMatrix();
            _this.scene.add(road);
        });

        loader.load("Models/car.json", function (geom, materials) {
            _this.carInterior = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(materials));
            _this.carInterior.position.z = 279;
            _this.carInterior.position.y = -12;
            _this.carInterior.position.x = 1;
            _this.carInterior.rotateY(Math.PI);
            _this.carInterior.scale.set(12, 8, 4);
            _this.scene.add(_this.carInterior);
        });

        loader.load("Models/deer.json", function (geom, materials) {
            _this.deerModel = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(materials));
            _this.deerModel.scale.set(80, 80, 80);
            _this.deerModel.position.y = -125;
        });

        loader.load("Models/tree.json", function (geom, materials) {
            var tree = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(materials));
            tree.position.z = -1000;
            tree.scale.set(40, 40, 40);
            for (var i = 0; i < 9 * 2; i++) {
                var newTree = tree.clone();
                newTree.translateX(350 * ((i % 2 == 0) ? -1 : 1));
                newTree.translateZ(-Math.floor(i / 2) * _this.treeOffset);
                _this.trees.push(newTree);
                _this.scene.add(newTree);
            }
        });
        this.foliage = [];
        loader.load("Models/grass.json", function (geom, materials) {
            var grass = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(materials));
            grass.scale.set(20, 40, 20);
            grass.position.z = -1000;
            grass.position.y = -75;
            for (var i = 0; i < 150; i++) {
                var newGrass = grass.clone();
                var xOffset = Utils.randomRange(400, 1600);
                newGrass.translateX(xOffset * Utils.randomDir());
                newGrass.translateZ(Math.floor(Math.random() * 3000));
                _this.foliage.push(newGrass);
            }
            _this.foliage.forEach(function (fol) {
                return _this.scene.add(fol);
            });
        });

        this.createScene();
        content.appendChild(this.renderer.domElement);
    }
    Game.prototype.start = function () {
        this.tick();
    };

    Game.prototype.update = function () {
        var _this = this;
        if (this.isShaking > 0) {
            this.shakeCamera(3);
        }
        if (this.isShaking == 0) {
            this.resetCamera();
            this.isShaking = -1;
        }

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
        if (this.carInterior)
            this.carInterior.position.x = this.camera.position.x;
        this.windscreen.position.x = this.camera.position.x;
        for (var i = 0; i < this.cracks.length; i++) {
            this.cracks[i].position.x = this.camera.position.x + this.cracksXPos[i];
        }

        if (this.deerModel) {
            if (Utils.randomRange(0, 300) == 200) {
                var newDeer = this.deerModel.clone();
                newDeer.position.z = -5000;
                newDeer.position.x = Utils.randomRange(-325, 275);
                this.scene.add(newDeer);
                this.deers.push(newDeer);
            }
        }
        this.deers.forEach(function (deer) {
            deer.translateZ(_this.moveSpeed);
            if (deer.position.z > _this.camera.position.z) {
                _this.isShaking = 30;
                _this.addCrack();
                _this.shakeCamera(3);
                delete _this.deers[_this.deers.indexOf(deer)];
                _this.scene.remove(deer);
            }
        });
    };

    Game.prototype.addCrack = function () {
        var crack = this.crackSprites[Math.floor(Math.random() * this.crackSprites.length)].clone();
        var xPos = Utils.randomRange(-40, 50);
        this.cracksXPos.push(xPos);
        crack.position.set(xPos, Utils.randomRange(-15, 15), 254);
        crack.rotateZ(Math.random() * Math.PI * 2);
        this.scene.add(crack);
        this.cracks.push(crack);
    };

    Game.prototype.render = function () {
        this.renderer.render(this.scene, this.camera);
    };

    Game.prototype.createScene = function () {
        //this.scene.fog = new THREE.Fog(0xcccccc, 0.1, 3000);
        this.scene.add(this.camera);

        this.windscreen = this.loadPlane(160, 90, "windscreen.png");
        this.windscreen.translateZ(253);
        this.scene.add(this.windscreen);
        this.skyLine = this.loadPlane(100, 100, "skyline.png");
        this.skyLine.material.setValues({ fog: false });
        this.skyLine.translateZ(-6000);
        this.skyLine.scale.x = 140;
        this.skyLine.scale.y = 30;
        this.skyLine.translateY(30 * 100 / 2 - 300);

        var sky = this.loadPlane(100, 100, "sky.png");
        sky.material.setValues({ fog: true });
        sky.translateY(2000);
        sky.translateZ(this.skyLine.position.z - 50);
        sky.scale.x = 140;
        sky.scale.y = 60;
        this.scene.add(sky);

        this.scene.add(this.skyLine);

        this.crackSprites = [];
        this.crackSprites.push(this.loadPlane(32, 32, "crack2.png"));
        this.crackSprites.push(this.loadPlane(32, 32, "crack3.png"));
        this.crackSprites.push(this.loadPlane(32, 32, "crack4.png"));
        this.cracks = [];
        this.cracksXPos = [];
    };

    Game.prototype.loadPlane = function (width, height, textureURL) {
        var texture = THREE.ImageUtils.loadTexture(textureURL);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        return new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, transparent: true }));
    };

    Game.prototype.shakeCamera = function (amount) {
        if (this.isShaking == 30) {
            this.oldCamPos = this.camera.position.clone();
        }
        this.isShaking--;
        this.camera.translateX(Math.random() * amount * Utils.randomDir());
        this.camera.translateY(Math.random() * amount * Utils.randomDir());
        this.camera.translateZ(Math.random() * amount * Utils.randomDir());
    };

    Game.prototype.resetCamera = function () {
        this.isShaking = 0;
        this.camera.position = this.oldCamPos;
    };
    return Game;
})();

window.onload = function () {
    new Game(document.getElementById('content')).start();
};
//# sourceMappingURL=ld31.js.map
