import * as THREE from 'three';
import { OrbitControls } from "https://unpkg.com/three@0.112/examples/jsm/controls/OrbitControls.js";

import Time from './Time.js';
import SceneSetup from './SceneSetup.js';
import ModelLoader from './ModelLoader.js';
import ShadowCreator from './ShadowCreator.js';
import BottomBar from './interface/BottomBar.js';
import RightBar from './interface/RightBar.js';
import InfoTab from './interface/InfoTab.js';
import Resources from './Resources.js';
import SelectObject from './interface/SelectObject.js';
import LoadingBar from './interface/LoadingBar.js';

let instance = null;
 
export default class Experience {
    constructor(_canvas) {
        // Singleton
        if (instance) {
            return instance;
        }
        instance = this;

        // Global access
        window.experience = this;
        window.addEventListener( 'resize', this.resizeEvent.bind(this),false);
        this.canvas = _canvas;

        try{
            const quickCookie = this.getCookie('currentMoto');
            //console.log(quickCookie);
            if(quickCookie){
                this.startNoLoading(quickCookie);
            }else{
                this.startNormal();
            }
        }catch(e){
            console.log(e);
        }

    }

    startNormal(){
        // Model selection
        this.selectObject = new SelectObject();
        //Initialize the model selection interface
        this.selectObject.init();
        this.selectObject.on('modelSelected', (path) => {
            // Show canvas
            this.canvas.style.display = 'block';

            this.quickCookie(path);
            this.loadMotoData(path).then(() => {

                // Start loading resources once the object data is loaded
                this.resources = new Resources();
    
                // Set up loading bar
                this.loadingBar = new LoadingBar();
    
                // Finally load the scene when all the resources are loaded
                this.resources.on('ready', () => {
                    this.initScene();
                });
            });
        });
    }

    startNoLoading(path){
        //path = '/datos/Triumph_Speed_Triple_Se_2013.json ';
        this.loadMotoData(path).then(() => 
        {

            // Start loading resources once the object data is loaded
            this.resources = new Resources();

            // Set up loading bar
            this.loadingBar = new LoadingBar();

            // Finally load the scene when all the resources are loaded
            this.resources.on('ready', () => {
                this.initScene();
            });
        });
    }

    // Function to load JSON data
    async loadMotoData(path) {
        try {
            const response = await fetch(path);
            const jsonData = await response.json();

            // Instantiate this with data from JSON
            this.moto = {
                id: jsonData.id,
                tipo: jsonData.tipo,
                model: jsonData.model,
                url: jsonData.url,
                position: jsonData.position,
                scale: jsonData.scale,
                customs: jsonData.customs
            };

        } catch (error) {
            console.error('Error loading moto data:', error);
        }
    }

    // Function to get cookie by name
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    // Function to update cookie with current configuration
    updateCookie() {
        const config = this.moto.customs.map(custom => custom.selected);
        const selectedPieces = this.rightBar.selectedPieces;
        const piezaEditando = this.piezaEditando;
        const cookieData = {
            config,
            selectedPieces,
            piezaEditando
        };
        document.cookie = `motoConfig=${JSON.stringify(cookieData)}; path=/; max-age=31536000`; // 1 year

        //const config = this.moto.customs.map(custom => custom.selected);
        //document.cookie = `motoConfig=${JSON.stringify(config)}; path=/; max-age=31536000`; // 1 year
    }

    quickCookie(path){
        document.cookie = `currentMoto=${path}; path=/; max-age=900`; // 15 min

    }

    restartExperience() {
        //Hide temporarily webgl canvas
        this.canvas.style.display = 'none';
        document.cookie = `currentMoto=; path=/; max-age=100`; 

        // Clear interface
        if(this.bottomBar)  this.bottomBar.destroyBottomBar();
        if(this.rightBar) this.rightBar.deleteRightBar();
        if(this.infoTab) this.infoTab.deleteInfoTab();

        // Clear existing state if necessary
        if (this.scene) {
            while (this.scene.children.length > 0) {
                this.scene.remove(this.scene.children[0]);
            }
        }

        // Reinitialize the model selection interface
        this.startNormal();
    }

    // Callback function for parent square click
    onParentSquareClick(id) {
        //Check if there are already customs shown
        if( this.piezaEditando==undefined){            
            this.piezaEditando=id;
            setTimeout(() => {
                this.bottomBar.generateBottomBar(this.moto.customs,id);
                document.getElementById('ParentSquare'+id).classList.add('ParentSquareSelected');
            }, this.bottomBar.animationTimeout);
        
            //Check if we want to hide customs or to change customs
        }else {
            if( this.piezaEditando==id){
                this.piezaEditando=undefined;

                this.bottomBar.deleteBottomBar();
                if(this.infoTab) this.infoTab.disappearBox();
                this.modelLoader.loadModel(this.moto.customs[id],  id, this.moto.customs[id].selected)

                document.getElementById('ParentSquare'+id).classList.remove('ParentSquareSelected');
        
            }else{
                document.getElementById('ParentSquare'+this.piezaEditando).classList.remove('ParentSquareSelected');
                    this.piezaEditando=id;
                this.bottomBar.deleteBottomBar();
                if(this.infoTab) this.infoTab.disappearBox();
                this.modelLoader.loadModel(this.moto.customs[id],  id, this.moto.customs[id].selected)

                setTimeout(() => {
                    this.bottomBar.generateBottomBar(this.moto.customs,id);
                    document.getElementById('ParentSquare'+id).classList.add('ParentSquareSelected');

                }, this.bottomBar.animationTimeout);
            }
        }



    }

    // Callback function for square click
    onSquareClick(id) {
        //Antes de esta función se ejecuta infoTabAppear(id)

        //Estilos de seleccionar cuadrado
        // Quitar estilos a todos los squares (id pieza seleccionada, i pieza iterada)
        const piezaEditando = this.piezaEditando;
        function cuadrado(x){
            return document.getElementById('CustomSquare'+(x+1)+'Pieza'+piezaEditando);
        }
        if(cuadrado(id) && piezaEditando!=undefined){
            for(let i = 0; i < this.moto.customs[piezaEditando].id.length; i++){
                if(cuadrado(i).classList.contains('CustomSquareSelected')) cuadrado(i).classList.remove('CustomSquareSelected');      
            }

            document.getElementById('CustomSquare'+(id+1)+'Pieza'+piezaEditando).classList.add('CustomSquareSelected');
            
            this.modelLoader.idAnterior[piezaEditando] = id;
            //this.experience.moto.customs[piezaEditando].selected=id;
            //console.log("El custom seleccionado es: "+this.experience.moto.customs[piezaEditando].selected,piezaEditando)
        }

        //Ahora se llama el model loader
        this.modelLoader.loadModel(this.moto.customs[this.piezaEditando],  this.piezaEditando,id)

        // Custom clickado es el seleccionado
        if(id==this.moto.customs[this.piezaEditando].selected){
            
        }else{
            // Confirmar y añadir al carrito => Se ejecuta addToCart en right bar
            // Click fuera => disappearBox()
            // Click otro custom
        }

        if(this.rightBar) this.rightBar.updateList( this.piezaEditando, this.moto.customs[ this.piezaEditando].title[id], this.moto.customs[ this.piezaEditando].price[id]);
    }

    infoTabAppear(id){
        if(this.infoTab) this.infoTab.appearBox(this.moto.customs[this.piezaEditando],id);
    }

    onSquareUnHover(){

    }

    initScene() {
        // Initialize scene setup
        this.sceneSetup = new SceneSetup(this.canvas);
        this.scene = this.sceneSetup.scene;
        this.modelLoader = new ModelLoader(this.scene);
        this.piezaEditando = undefined;

        // Create shadows
        const shadowCreator = new ShadowCreator(this.scene);
        shadowCreator.createShadow();

        // this.Controls for rotating the scene
        this.controls = new OrbitControls(this.sceneSetup.camera, this.sceneSetup.canvas);
        this.controls.enablePan = false; // Disable panning
        this.controls.target.set(0, 0.5, 0);
        this.controls.minDistance = 1.5;
        this.controls.maxDistance = 4;
        this.controls.enableDamping = true;

        // Initialize interface
        this.rightBar = new RightBar();

        //Load cart

        // Check for existing cookie
        const cookieData = this.getCookie('motoConfig');
        if (cookieData) {
            // COOKIE DETECTED
            const savedConfig = JSON.parse(cookieData);
            this.rightBar.selectedPieces = savedConfig.selectedPieces
            for(let i = 0; i < savedConfig.selectedPieces.length; i++) {
                //console.log(this.moto.customs[savedConfig.selectedPieces[i].piezaEditando].selected,savedConfig.selectedPieces[i])
                this.moto.customs[savedConfig.selectedPieces[i].piezaEditando].selected = savedConfig.selectedPieces[i].id
            }

            this.rightBar.updateList();
            

            //document.cookie = `motoConfig=; path=/; max-age=0`;
        } else {
            // NO COOKIE DETECTED

            // Create a new cookie with the initial configuration
            this.updateCookie();
        }

        this.infoTab = new InfoTab();

        this.bottomBar = new BottomBar('square-container', this.onSquareClick.bind(this), this.onParentSquareClick.bind(this), this.infoTabAppear.bind(this), this.onSquareUnHover.bind(this));
        this.bottomBar.init();

        // Load main Object
        this.modelLoader.loadModel(this.moto, undefined, 0);

        // Generate boxes and model for each type of piece
        for (let i = 0; i < this.moto.customs.length; i++) {
            this.bottomBar.generateCustom(this.moto.customs[i], i);
            this.modelLoader.loadModel(this.moto.customs[i], i, this.moto.customs[i].selected);
        }

        // Time tick event
        this.time = new Time();
        this.time.on('tick', () => {
            this.update();
        });

        // Resize to set everything on load
        this.resizeEvent();

    }


    resizeEvent(){
        if (this.sceneSetup) this.sceneSetup.resize();
        if (this.bottomBar) this.bottomBar.resize();
    }

    update()
    {
        this.controls.update();
        this.sceneSetup.render();
    }
}