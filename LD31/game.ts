/// <reference path="scripts/typings/threejs/three.d.ts" />

class Game {

    renderer: THREE.Renderer;
    camera: THREE.Camera;
    scene: THREE.Scene;
    road: THREE.Mesh;
    trees: THREE.Mesh[];
    treeOffset: number = 1000;

    constructor(content: HTMLElement) {
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

        var tree: THREE.Mesh = this.loadPlane(100, 100, "tree.png");
        tree.translateY(-100);
        tree.scale.y = 4;
        tree.translateZ(-1000);
        this.trees = [];
        for (var i = 0; i < 5 * 2; i++) {
            var newTree: THREE.Mesh = tree.clone();
            newTree.translateX(350 * ((i % 2 == 0) ? -1 : 1));
            newTree.translateZ(Math.floor(i / 2) * this.treeOffset);
            this.trees.push(newTree);
        }

        this.trees.forEach((tree: THREE.Mesh) => this.scene.add(tree));
        this.scene.add(this.road);
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
                tree.translateZ(16)
            }
        });
    }

    render() {
        this.renderer.render(this.scene, this.camera);
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