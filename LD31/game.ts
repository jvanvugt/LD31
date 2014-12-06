/// <reference path="scripts/typings/threejs/three.d.ts" />

class Game {

    renderer: THREE.Renderer;
    camera: THREE.Camera;
    scene: THREE.Scene;
    road: THREE.Mesh;
    trees: THREE.Mesh[];
    foliage: THREE.Mesh[];
    treeOffset: number = 1000;
    moveSpeed: number = 16;

    constructor(content: HTMLElement) {
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(960, 600);
        this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 10000);
        this.camera.position.z = 300;
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
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    createScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0xcccccc, 0.1, 5000);
        this.scene.add(this.camera);

        this.road = this.loadPlane(100, 100, "road.png");
        this.road.translateY(-150);
        this.road.translateZ(500);
        this.road.rotateX(-Math.PI / 2);
        this.road.scale.x = 120;
        this.road.scale.y = 1000;

        var tree: THREE.Mesh = this.loadPlane(100, 100, "tree.png");
        tree.translateY(-125);
        tree.scale.y = 4;
        tree.translateZ(-1000);
        this.trees = [];
        for (var i = 0; i < 5 * 2; i++) {
            var newTree: THREE.Mesh = tree.clone();
            newTree.translateX(350 * ((i % 2 == 0) ? -1 : 1));
            newTree.translateZ(Math.floor(i / 2) * this.treeOffset);
            this.trees.push(newTree);
        }

        var skyline: THREE.Mesh = this.loadPlane(400, 100, "skyline.png");
        skyline.translateZ(-6000);
        skyline.scale.x = 140;
        skyline.scale.y = 30;
        skyline.translateY(30 * 100 / 2 - 300);

        var grass: THREE.Mesh = this.loadPlane(100, 100, "foliage.png");
        grass.translateY(-100);
        grass.scale.y = 0.5;
        grass.translateZ(-1000);
        this.foliage = [];
        for (var i = 0; i < 80; i++) {
            var newGrass: THREE.Mesh = grass.clone();
            var xOffset = Math.floor(Math.random() * (1600 - 400 + 1)) + 400;
            newGrass.translateX(xOffset * ((Math.random() > 0.5) ? 1 : -1));
            newGrass.translateZ(Math.floor(Math.random() * 3000));
            this.foliage.push(newGrass);
        }
        this.foliage.forEach((fol: THREE.Mesh) => this.scene.add(fol));

        this.scene.add(skyline);
        this.trees.forEach((tree: THREE.Mesh) => this.scene.add(tree));
        this.scene.add(this.road);
    }

    loadPlane(width: number, height: number, textureURL: string): THREE.Mesh {
        var texture: THREE.Texture = THREE.ImageUtils.loadTexture(textureURL);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        return new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({ map: texture, transparent: true}));
    }
}

window.onload = () => {
    new Game(document.getElementById('content')).start();
};