// SceneSetup.js
import Experience from './Main.js'

export default class SceneSetup {
    constructor(canvas) {

        this.experience = new Experience();
        this.scene = new THREE.Scene();

        //Ressources
        this.resources = this.experience.resources

        // Canvas
        this.canvas = canvas

        this.setupCamera();
        this.setupRenderer();
        this.addLights();
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(-1, 1, 1); // Posición de la cámara para ver el objeto

    }

    setupRenderer() {     
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        })

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0xffffff); // Fondo blanco
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.renderer.toneMapping = THREE.LinearToneMapping
        this.renderer.toneMappingExposure = 1.4
        
        document.body.appendChild(this.renderer.domElement);

    }

    addLights() {
        const directionalLight = new THREE.DirectionalLight('#ffffff', 1)
        directionalLight.castShadow = true
        directionalLight.shadow.camera.far = 30
        directionalLight.shadow.mapSize.set(1024, 1024)
        directionalLight.shadow.normalBias = 0.05
        directionalLight.position.set(0.25*3, 3*3,  10.25*3)
        this.scene.add(directionalLight)

        /**
         * Environment map
         */
        /*        
        const cubeTextureLoader = new THREE.CubeTextureLoader();
        const environmentMap = cubeTextureLoader.load([
            'textures/environmentMaps/sky/px.png',
            'textures/environmentMaps/sky/nx.png',
            'textures/environmentMaps/sky/py.png',
            'textures/environmentMaps/sky/ny.png',
            'textures/environmentMaps/sky/pz.png',
            'textures/environmentMaps/sky/nz.png'
        ])*/

        const environmentMap = this.resources.items.environmentMapTexture;
        environmentMap.colorSpace = THREE.SRGBColorSpace;
        environmentMap.encoding = THREE.sRGBEncoding

        //this.scene.background = environmentMap
        this.scene.environment = environmentMap

    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}