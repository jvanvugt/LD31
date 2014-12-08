/// <reference path="scripts/typings/threejs/three.d.ts" />
/// <reference path="input.ts" />
/// <reference path="utils.ts" />


class Game {
    content: HTMLElement;
    renderer: THREE.Renderer;
    camera: THREE.Camera;
    scene: THREE.Scene;
    road: THREE.Mesh;
    trees: THREE.Mesh[];
    foliage: THREE.Mesh[];
    treeOffset: number = 1000;
    moveSpeed: number = 16;
    input: Input;
    skyLine: THREE.Mesh;
    carInterior: THREE.Mesh;
    windscreen: THREE.Mesh;
    crackSprites: THREE.Mesh[];
    cracks: THREE.Mesh[];
    cracksXPos: number[];
    isShaking: number = -1;
    oldCamPos: THREE.Vector3;
    deerModel: THREE.Mesh;
    deers: THREE.Mesh[];
    deerWidth: number = 60;
    deerHit: number = 0;
    audioPlayer: AudioPlayer;
    gui: dat.GUI;
    carModel: THREE.Mesh;
    cars: THREE.Mesh[];
    carWidth: number = 65;
    grass: THREE.Mesh;
    tree: THREE.Mesh;
    light: THREE.Light;

    constructor(content: HTMLElement) {
        this.content = content;
        this.audioPlayer = new AudioPlayer();
        this.audioPlayer.loadMusic("Sound/song1.ogg");
        this.audioPlayer.loadSFX("Sound/hit.wav");
        this.input = new Input();
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(960, 600);
        this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 10000);
        this.camera.position.z = 300;
        this.scene = new THREE.Scene;
        this.deers = [];
        this.cars = [];

        this.light = new THREE.DirectionalLight(0xFFFFFF);
        this.light.position.z = 350;
        this.light.position.y = 300;
        this.light.lookAt(this.camera.position);
        this.scene.add(this.light);

        this.trees = [];
        var loader: THREE.JSONLoader = new THREE.JSONLoader(true);

        loader.load("Models/road.json", (geom, materials) => {
            this.road = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(materials));
            this.road.scale.set(3000, 1000, 250);
            this.road.position.y = -75;
            this.road.position.z = 290;
            this.road.rotateY(Math.PI / 2);
            this.road.updateMatrix();
            this.scene.add(this.road);
        });

        loader.load("Models/nextCar.json", (geom, materials) => {
            this.carModel = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(materials));
            this.carModel.position.z = 0;
            this.carModel.position.y = -100;
            this.carModel.scale.set(30, 30, 30);
            this.carModel.rotateY(Math.PI);
            this.start();
        });

        loader.load("Models/car.json", (geom, materials) => {
            this.carInterior = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(materials));
            this.carInterior.position.z = 279;
            this.carInterior.position.y = -12;
            this.carInterior.position.x = 1;
            this.carInterior.rotateY(Math.PI);
            this.carInterior.scale.set(12, 8, 4);
            this.scene.add(this.carInterior);
        });

        loader.load("Models/deer2.json", (geom, materials) => {
            this.deerModel = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(materials));
            this.deerModel.scale.set(80, 80, 80);
            this.deerModel.position.y = -125;
        });

        loader.load("Models/tree.json", (geom, materials) => {
            this.tree = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(materials));
            this.tree.position.z = -1000;
            this.tree.scale.set(40, 40, 40);
            this.addTrees();
        });
        this.foliage = [];
        loader.load("Models/grass.json", (geom, materials) => {
            this.grass = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(materials));
            this.grass.scale.set(20, 40, 20);
            this.grass.position.z = -1000;
            this.grass.position.y = -75;
            this.addFoliage();
        });

        this.createScene();
        content.appendChild(this.renderer.domElement);
    }

    addTrees() {
        for (var i = 0; i < 9 * 2; i++) {
            var newTree: THREE.Mesh = this.tree.clone();
            newTree.translateX(350 * ((i % 2 == 0) ? -1 : 1));
            newTree.translateZ(-Math.floor(i / 2) * this.treeOffset);
            this.trees.push(newTree);
            this.scene.add(newTree);
        }
    }

    addFoliage() {
        for (var i = 0; i < 150; i++) {
            var newGrass: THREE.Mesh = this.grass.clone();
            var xOffset = Utils.randomRange(400, 1600);
            newGrass.translateX(xOffset * Utils.randomDir());
            newGrass.translateZ(Math.floor(Math.random() * 3000));
            this.foliage.push(newGrass);
            this.scene.add(newGrass);
        }
    }

    start(): void {
        this.gui = new dat.GUI({ autoPlace: false });
        this.gui.domElement.style.zoom = "200%";
        this.content.appendChild(this.gui.domElement);
        this.gui.add(this, "deerHit").listen();
        this.tick();
    }

    tick = (): void => {
        this.update();
        this.render();
        window.requestAnimationFrame(this.tick);
    }

    update() {

        if (77 in this.input.keysDown) { // M
            this.audioPlayer.mute();
        }

        if (68 in this.input.keysDown && this.camera.position.x < 160) { // D
            this.camera.position.x += 5;
        }

        if (65 in this.input.keysDown && this.camera.position.x > -180) { // A
            this.camera.position.x -= 5;
        }

        this.trees.forEach((tree: THREE.Mesh) => {
            if (tree.position.z >= this.camera.position.z) {
                tree.translateZ(-this.treeOffset * this.trees.length / 2);
            }
            else {
                tree.translateZ(this.moveSpeed);
            }
        });

        this.foliage.forEach((fol: THREE.Mesh) => {
            if (fol.position.z >= this.camera.position.z) {
                fol.translateZ(-3000);
            }
            else {
                fol.translateZ(this.moveSpeed);
            }
        });
        this.skyLine.position.x = this.camera.position.x;
        if(this.carInterior)
            this.carInterior.position.x = this.camera.position.x + 3;
        this.windscreen.position.x = this.camera.position.x;
        for (var i = 0; i < this.cracks.length; i++) {
            this.cracks[i].position.x = this.camera.position.x + this.cracksXPos[i];
        }

        if (this.deerModel) {
            if (Utils.randomRange(0, 160) == 5) {
                var newDeer = this.deerModel.clone();
                if(Math.random() > 0.5)
                    this.deerModel.rotateY(Math.PI);
                newDeer.position.z = -5000;
                newDeer.position.x = Utils.randomRange(-300, 275);
                this.scene.add(newDeer);
                this.deers.push(newDeer);
            }
        }

        if (this.carModel) {
            if (Utils.randomRange(0, 300) == 5) {
                var newCar = this.carModel.clone();
                newCar.position.z = -5000;
                newCar.position.x = Utils.randomRange(-300, 275);
                this.scene.add(newCar);
                this.cars.push(newCar);
            }
        }

        this.cars.forEach((car) => {
            car.translateZ(-this.moveSpeed * 2);
            if (car.position.z > this.carInterior.position.z) {
                if ((car.position.x - this.carWidth < this.camera.position.x + this.carWidth && car.position.x - this.carWidth > this.camera.position.x - this.carWidth) ||
                    (car.position.x + this.carWidth < this.camera.position.x + this.carWidth && car.position.x + this.carWidth > this.camera.position.x - this.carWidth)) {
                    this.audioPlayer.playSFX();
                    this.die();
                }
                delete this.cars[this.cars.indexOf(car)];
                this.scene.remove(car);
            }
        });

        this.deers.forEach((deer) => {
            deer.translateZ(this.moveSpeed * ((deer.rotation.y == 0) ? 1 : -1));
            if (deer.position.z > this.carInterior.position.z) {
                if ((deer.position.x - this.deerWidth < this.camera.position.x + this.deerWidth && deer.position.x - this.deerWidth > this.camera.position.x - this.deerWidth) ||
                    (deer.position.x + this.deerWidth < this.camera.position.x + this.deerWidth && deer.position.x + this.deerWidth > this.camera.position.x - this.deerWidth)) {
                    this.deerHit++;
                    this.audioPlayer.playSFX();
                    if (this.isShaking > 0) {
                        this.isShaking = 14;
                    }
                    else this.isShaking = 15;
                    this.addCrack();
                }
                delete this.deers[this.deers.indexOf(deer)];
                this.scene.remove(deer);
            }
        });

        if (this.isShaking > 0) {
            this.shakeCamera(2);
        }
        if (this.isShaking == 0) {
            this.resetCamera();
        }
        
    }

    addCrack() {
        var crack = this.crackSprites[Math.floor(Math.random() * this.crackSprites.length)].clone();
        var xPos = Utils.randomRange(-40, 50);
        this.cracksXPos.push(xPos);
        crack.position.set(xPos, Utils.randomRange(-15, 15), 254);
        crack.rotateZ(Math.random() * Math.PI * 2);
        this.scene.add(crack);
        this.cracks.push(crack);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    die() {
        this.cars = [];
        this.deers = [];
        this.cracks = [];
        this.trees = [];
        this.foliage = [];
        this.scene = new THREE.Scene();
        this.cracksXPos = [];
        this.isShaking = -1;
        this.deerHit = 0;
        this.scene.add(this.road);
        this.addFoliage();
        this.addTrees();
        this.scene.add(this.carInterior);
        this.scene.add(this.light);
        this.createScene();
    }

    createScene() {
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

        var sky: THREE.Mesh = this.loadPlane(100, 100, "Images/sky.png");
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
        

    }

    loadPlane(width: number, height: number, textureURL: string): THREE.Mesh {
        var texture: THREE.Texture = THREE.ImageUtils.loadTexture(textureURL);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        return new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, transparent: true}));
    }

    shakeCamera(amount: number) {
        if (this.isShaking == 15) {
            this.oldCamPos = this.camera.position.clone();
        }
        this.isShaking--;
        this.camera.translateX(Math.random() * amount * Utils.randomDir());
        this.camera.translateY(Math.random() * amount * Utils.randomDir());
        this.camera.translateZ(Math.random() * amount * Utils.randomDir());
    }

    resetCamera() {
        this.camera.position.set(this.oldCamPos.x, this.oldCamPos.y, this.oldCamPos.z);
        this.isShaking--;
    }
}

window.onload = () => {
    new Game(document.getElementById('content'));
};