/// <reference path="scripts/typings/threejs/three.d.ts" />
/// <reference path="input.ts" />
/// <reference path="utils.ts" />
/// <reference path="colladaloader.d.ts" />

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
    isShaking: boolean = false;
    oldCamPos: THREE.Vector3;

    constructor(content: HTMLElement) {
        this.input = new Input();
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(960, 600);
        this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 10000);
        this.camera.position.z = 300;
        this.scene = new THREE.Scene;
        var light = new THREE.PointLight(0xffffff);
        this.trees = [];
        light.position.z = 300;
        this.scene.add(light);
        var loader: THREE.JSONLoader = new THREE.JSONLoader(true);
        loader.load("Models/tree.json", (geom, materials) => {
            console.log(materials);
            var mesh = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(materials));
            mesh.position.z = -1000;
            mesh.scale.set(40, 40, 40);
            for (var i = 0; i < 7 * 2; i++) {
                var newTree: THREE.Mesh = mesh.clone();
                newTree.translateX(350 * ((i % 2 == 0) ? -1 : 1));
                newTree.translateZ(-Math.floor(i / 2) * this.treeOffset);
                this.trees.push(newTree);
                this.scene.add(newTree);
            }
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

        if (68 in this.input.keysDown && this.camera.position.x < 160) { // D
            this.camera.position.x += 5;
        }

        if (65 in this.input.keysDown && this.camera.position.x > -180) { // A
            this.camera.position.x -= 5;
        }

        if (32 in this.input.keysDown) {
            this.addCrack();
        }

        if (16 in this.input.keysDown) {
            this.shakeCamera(5);
        }

        if (!(16 in this.input.keysDown) && this.isShaking) {
            this.resetCamera();
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
        this.carInterior.position.x = this.camera.position.x;
        this.windscreen.position.x = this.camera.position.x;
        for (var i = 0; i < this.cracks.length; i++) {
            this.cracks[i].position.x = this.camera.position.x + this.cracksXPos[i];
        }
    }

    addCrack() {
        var crack = this.crackSprites[Math.floor(Math.random() * this.crackSprites.length)].clone();
        var xPos = Utils.randomRange(-30, 80);
        this.cracksXPos.push(xPos);
        crack.position.set(xPos, Utils.randomRange(-30, 30), 254);
        crack.rotateZ(Math.random() * Math.PI * 2);
        this.scene.add(crack);
        this.cracks.push(crack);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    createScene() {
        //this.scene.fog = new THREE.Fog(0xcccccc, 0.1, 3000);
        this.scene.add(this.camera);

        this.carInterior = this.loadPlane(160, 90, "interior.png");
        this.carInterior.translateZ(255);
        this.scene.add(this.carInterior);

        this.windscreen = this.loadPlane(160, 90, "windscreen.png");
        this.windscreen.translateZ(253);
        this.scene.add(this.windscreen);

        this.road = this.loadPlane(100, 100, "road.png");
        this.road.translateY(-100);
        this.road.translateZ(500);
        this.road.rotateX(-Math.PI / 2);
        this.road.scale.x = 120;
        this.road.scale.y = 1000;
        this.skyLine = this.loadPlane(100, 100, "skyline.png");
        this.skyLine.material.setValues({ fog: false });
        this.skyLine.translateZ(-6000);
        this.skyLine.scale.x = 140;
        this.skyLine.scale.y = 30;
        this.skyLine.translateY(30 * 100 / 2 - 300);

        var grass: THREE.Mesh = this.loadPlane(100, 100, "foliage.png");
        grass.translateY(-75);
        grass.scale.y = 0.5;
        grass.translateZ(-1000);
        this.foliage = [];
        for (var i = 0; i < 150; i++) {
            var newGrass: THREE.Mesh = grass.clone();
            var xOffset = Utils.randomRange(400, 1600);
            newGrass.translateX(xOffset * Utils.randomDir());
            newGrass.translateZ(Math.floor(Math.random() * 3000));
            this.foliage.push(newGrass);
        }
        this.foliage.forEach((fol: THREE.Mesh) => this.scene.add(fol));

        var sky: THREE.Mesh = this.loadPlane(100, 100, "sky.png");
        sky.material.setValues({ fog: true });
        sky.translateY(2000);
        sky.translateZ(this.skyLine.position.z - 50);
        sky.scale.x = 140;
        sky.scale.y = 60;
        this.scene.add(sky);

        this.scene.add(this.skyLine);
        this.scene.add(this.road);

        this.crackSprites = [];
        this.crackSprites.push(this.loadPlane(32, 32, "crack2.png"));
        this.crackSprites.push(this.loadPlane(32, 32, "crack3.png"));
        this.crackSprites.push(this.loadPlane(32, 32, "crack4.png"));
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
        if (!this.isShaking) {
            this.oldCamPos = this.camera.position.clone();
            this.isShaking = true;
        }

        this.camera.translateX(Math.random() * amount * Utils.randomDir());
        this.camera.translateY(Math.random() * amount * Utils.randomDir());
        this.camera.translateZ(Math.random() * amount * Utils.randomDir());
    }

    resetCamera() {
        this.isShaking = false;
        this.camera.position = this.oldCamPos;
        console.log(this.camera.position);
        console.log(this.oldCamPos);
    }
}

window.onload = () => {
    new Game(document.getElementById('content')).start();
};