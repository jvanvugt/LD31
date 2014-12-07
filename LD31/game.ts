/// <reference path="scripts/typings/threejs/three.d.ts" />
/// <reference path="input.ts" />
/// <reference path="utils.ts" />
class Game {

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
    deerWidth: number = 65;
    deerHit: number = 0;
    audioPlayer: AudioPlayer;

    constructor(content: HTMLElement) {
        this.audioPlayer = new AudioPlayer();
        this.audioPlayer.loadMusic("Sound/song1.ogg");
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
        var loader: THREE.JSONLoader = new THREE.JSONLoader(true);

        loader.load("Models/road.json", (geom, materials) => {
            var road: THREE.Mesh = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(materials));
            road.scale.set(3000, 1000, 250);
            road.position.y = -75;
            road.position.z = 290;
            road.rotateY(Math.PI / 2);
            road.updateMatrix();
            road.receiveShadow = true;
            this.scene.add(road);
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
            this.deerModel.rotateY(2);
        });

        loader.load("Models/tree.json", (geom, materials) => {
            var tree = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(materials));
            tree.position.z = -1000;
            tree.scale.set(40, 40, 40);
            tree.castShadow = true;
            for (var i = 0; i < 9 * 2; i++) {
                var newTree: THREE.Mesh = tree.clone();
                newTree.translateX(350 * ((i % 2 == 0) ? -1 : 1));
                newTree.translateZ(-Math.floor(i / 2) * this.treeOffset);
                this.trees.push(newTree);
                this.scene.add(newTree);
            }
        });
        this.foliage = [];
        loader.load("Models/grass.json", (geom, materials) => {
            var grass = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(materials));
            grass.scale.set(20, 40, 20);
            grass.position.z = -1000;
            grass.position.y = -75;
            for (var i = 0; i < 150; i++) {
                var newGrass: THREE.Mesh = grass.clone();
                var xOffset = Utils.randomRange(400, 1600);
                newGrass.translateX(xOffset * Utils.randomDir());
                newGrass.translateZ(Math.floor(Math.random() * 3000));
                this.foliage.push(newGrass);
            }
            this.foliage.forEach((fol: THREE.Mesh) => this.scene.add(fol));

        });

        this.createScene();
        content.appendChild(this.renderer.domElement);
    }

    start(): void {
        this.tick();
    }

    tick = (): void => {
        this.update();
        this.render();
        window.requestAnimationFrame(this.tick);
    }

    update() {



        console.log(this.camera.position);

        if (68 in this.input.keysDown && this.camera.position.x < 160) { // D
            this.camera.position.x += 5;
        }

        if (65 in this.input.keysDown && this.camera.position.x > -180) { // A
            this.camera.position.x -= 5;
        }

        if (32 in this.input.keysDown) {
            this.addCrack();
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
            if (Utils.randomRange(0, 200) == 5) {
                var newDeer = this.deerModel.clone();
                newDeer.position.z = -5000;
                newDeer.position.x = Utils.randomRange(-325, 275);
                this.scene.add(newDeer);
                this.deers.push(newDeer);
            }
        }
        this.deers.forEach((deer) => {
            deer.translateZ(this.moveSpeed);
            if (deer.position.z > this.carInterior.position.z) {
                if ((deer.position.x - this.deerWidth < this.camera.position.x + this.deerWidth && deer.position.x - this.deerWidth > this.camera.position.x - this.deerWidth) ||
                    (deer.position.x + this.deerWidth < this.camera.position.x + this.deerWidth && deer.position.x + this.deerWidth > this.camera.position.x - this.deerWidth)) {
                    this.deerHit++;
                    if (this.isShaking > 0)
                        this.isShaking = 14;
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
        this.camera.position = this.oldCamPos;
    }
}

window.onload = () => {
    new Game(document.getElementById('content')).start();
};