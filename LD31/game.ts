/// <reference path="scripts/typings/threejs/three.d.ts" />

class Game {

    renderer: THREE.Renderer;
    camera: THREE.Camera;
    scene: THREE.Scene;
    road: THREE.Mesh;

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
        
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    loadPlane(width: number, height: number, textureURL: string): THREE.Mesh {
        var texture: THREE.Texture = THREE.ImageUtils.loadTexture(textureURL);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        return new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({map: texture}));
    }
}

window.onload = () => {
    new Game(document.getElementById('content')).start();
};