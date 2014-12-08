/// <reference path="scripts/typings/webaudioapi/waa.d.ts" />
var AudioPlayer = (function () {
    function AudioPlayer() {
        try  {
            this.context = new AudioContext();
        } catch (e) {
            alert("Your browser does not support the Web Audio API. Please upgrade your browser!");
        }
    }
    AudioPlayer.prototype.loadMusic = function (songPath) {
        var _this = this;
        var request = new XMLHttpRequest();
        request.open('GET', songPath, true);
        request.responseType = 'arraybuffer';
        request.onload = function () {
            _this.context.decodeAudioData(request.response, function (buffer) {
                _this.songBuffer = buffer;
                _this.playSound(buffer);
            });
        };
        request.send();
    };

    AudioPlayer.prototype.playSound = function (buffer) {
        this.source = this.context.createBufferSource();
        this.source.buffer = buffer;
        this.source.connect(this.context.destination);
        this.source.loop = true;
        this.source.start(0);
    };

    AudioPlayer.prototype.mute = function () {
        this.source.stop(0);
    };
    return AudioPlayer;
})();
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
        this.deerWidth = 65;
        this.deerHit = 0;
        this.carWidth = 65;
        this.tick = function () {
            _this.update();
            _this.render();
            window.requestAnimationFrame(_this.tick);
        };
        this.content = content;
        this.audioPlayer = new AudioPlayer();
        this.audioPlayer.loadMusic("Sound/song1.ogg");
        this.input = new Input();
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(960, 600);
        this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 10000);
        this.camera.position.z = 300;
        this.scene = new THREE.Scene;
        this.deers = [];
        this.cars = [];

        var light = new THREE.DirectionalLight(0xFFFFFF);
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

        loader.load("Models/nextCar.json", function (geom, materials) {
            _this.carModel = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(materials));
            _this.carModel.position.z = 0;
            _this.carModel.position.y = -100;
            _this.carModel.scale.set(30, 30, 30);
            _this.carModel.rotateY(Math.PI);
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

        loader.load("Models/deer2.json", function (geom, materials) {
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
        this.gui = new dat.GUI({ autoPlace: false });
        this.gui.domElement.style.zoom = "200%";
        this.content.appendChild(this.gui.domElement);
        this.gui.add(this, "deerHit").listen();
        this.tick();
    };

    Game.prototype.update = function () {
        var _this = this;
        if (77 in this.input.keysDown) {
            this.audioPlayer.mute();
        }

        if (68 in this.input.keysDown && this.camera.position.x < 160) {
            this.camera.position.x += 5;
        }

        if (65 in this.input.keysDown && this.camera.position.x > -180) {
            this.camera.position.x -= 5;
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
            this.carInterior.position.x = this.camera.position.x + 3;
        this.windscreen.position.x = this.camera.position.x;
        for (var i = 0; i < this.cracks.length; i++) {
            this.cracks[i].position.x = this.camera.position.x + this.cracksXPos[i];
        }

        if (this.deerModel) {
            if (Utils.randomRange(0, 200) == 5) {
                var newDeer = this.deerModel.clone();
                if (Math.random() > 0.5)
                    this.deerModel.rotateY(Math.PI);
                newDeer.position.z = -5000;
                newDeer.position.x = Utils.randomRange(-300, 275);
                this.scene.add(newDeer);
                this.deers.push(newDeer);
            }
        }

        if (this.carModel) {
            if (Utils.randomRange(0, 200) == 5) {
                var newCar = this.carModel.clone();
                newCar.position.z = -5000;
                newCar.position.x = Utils.randomRange(-300, 275);
                this.scene.add(newCar);
                this.cars.push(newCar);
            }
        }

        this.cars.forEach(function (car) {
            car.translateZ(-_this.moveSpeed * 1.5);
            if (car.position.z > _this.carInterior.position.z) {
                if ((car.position.x - _this.carWidth < _this.camera.position.x + _this.carWidth && car.position.x - _this.carWidth > _this.camera.position.x - _this.carWidth) || (car.position.x + _this.carWidth < _this.camera.position.x + _this.carWidth && car.position.x + _this.carWidth > _this.camera.position.x - _this.carWidth)) {
                    _this.die();
                }
                delete _this.cars[_this.cars.indexOf(car)];
                _this.scene.remove(car);
            }
        });

        this.deers.forEach(function (deer) {
            deer.translateZ(_this.moveSpeed * ((deer.rotation.y == 0) ? 1 : -1));
            if (deer.position.z > _this.carInterior.position.z) {
                if ((deer.position.x - _this.deerWidth < _this.camera.position.x + _this.deerWidth && deer.position.x - _this.deerWidth > _this.camera.position.x - _this.deerWidth) || (deer.position.x + _this.deerWidth < _this.camera.position.x + _this.deerWidth && deer.position.x + _this.deerWidth > _this.camera.position.x - _this.deerWidth)) {
                    _this.deerHit++;
                    if (_this.isShaking > 0) {
                        _this.isShaking = 14;
                    } else
                        _this.isShaking = 15;
                    _this.addCrack();
                }
                delete _this.deers[_this.deers.indexOf(deer)];
                _this.scene.remove(deer);
            }
        });

        if (this.isShaking > 0) {
            this.shakeCamera(2);
        }
        if (this.isShaking == 0) {
            this.resetCamera();
        }
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

    Game.prototype.die = function () {
        this.cars = [];
        this.deers = [];
        this.cracks = [];
        this.scene = new THREE.Scene();
        this.createScene();
        this.cracksXPos = [];
        this.isShaking = -1;
        this.deerHit = 0;
    };

    Game.prototype.createScene = function () {
        this.scene.add(this.camera);

        this.windscreen = this.loadPlane(160, 90, "Images/windscreen.png");
        this.windscreen.translateZ(253);
        this.scene.add(this.windscreen);
        this.skyLine = this.loadPlane(100, 100, "Images/skyline.png");
        this.skyLine.material.setValues({ fog: false });
        this.skyLine.translateZ(-6000);
        this.skyLine.scale.x = 140;
        this.skyLine.scale.y = 30;
        this.skyLine.translateY(30 * 100 / 2 - 300);

        var sky = this.loadPlane(100, 100, "Images/sky.png");
        sky.material.setValues({ fog: true });
        sky.translateY(2000);
        sky.translateZ(this.skyLine.position.z - 50);
        sky.scale.x = 140;
        sky.scale.y = 60;
        this.scene.add(sky);

        this.scene.add(this.skyLine);

        this.crackSprites = [];
        this.crackSprites.push(this.loadPlane(32, 32, "Images/crack2.png"));
        this.crackSprites.push(this.loadPlane(32, 32, "Images/crack3.png"));
        this.crackSprites.push(this.loadPlane(32, 32, "Images/crack4.png"));
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
        if (this.isShaking == 15) {
            this.oldCamPos = this.camera.position.clone();
        }
        this.isShaking--;
        this.camera.translateX(Math.random() * amount * Utils.randomDir());
        this.camera.translateY(Math.random() * amount * Utils.randomDir());
        this.camera.translateZ(Math.random() * amount * Utils.randomDir());
    };

    Game.prototype.resetCamera = function () {
        this.camera.position.set(this.oldCamPos.x, this.oldCamPos.y, this.oldCamPos.z);
        this.isShaking--;
    };
    return Game;
})();

window.onload = function () {
    new Game(document.getElementById('content')).start();
};
//# sourceMappingURL=ld31.js.map
