const OrbitControls = require('three-orbit-controls')(THREE)

import vsBasic from "shaders/basic.vs"
import fsBasic from "shaders/basic.fs"
import fsShadow from "shaders/shadow.fs"
import vsShadow from "shaders/shadow.vs"
import audio from "mnf/audio"
import ColorPass from "postprocess/ColorPass"
import gui from 'mnf/gui'

class Main {

	constructor(){

		// -------------------------------------------------------------------------------------------------- SCENE

		this.scene = new THREE.Scene()
		this.renderer = new THREE.WebGLRenderer()
		this.renderer.setPixelRatio( window.devicePixelRatio )
		this.renderer.setSize( window.innerWidth, window.innerHeight )
		this.renderer.setClearColor( 0x222222, 1);
		document.body.appendChild( this.renderer.domElement )

		// -------------------------------------------------------------------------------------------------- CAMERA

		this.camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 1, 100000 )
		this.camera.position.z = 800
		this.controls = new OrbitControls(this.camera)

		// -------------------------------------------------------------------------------------------------- POSTPROCESS

		this.composer = new WAGNER.Composer( this.renderer, {useRGBA: false} )
		this.composer.setSize( window.innerWidth, window.innerHeight )
		this.passes = []

		const f = gui.addFolder('postprocess')
		f.open()

		//create a bloom pass
		this.bloomPass = new WAGNER.MultiPassBloomPass(128,128)
		this.bloomPass.activate = false
		// this.bloomPass.params.applyZoomBlur = true
		this.bloomPass.params.blurAmount = 0.4
		let g = f.addFolder('bloom1')
		g.add(this.bloomPass,'activate')
		g.add(this.bloomPass.params,'zoomBlurStrength',0,1)
		g.add(this.bloomPass.params,'blurAmount',0,1)
		g.add(this.bloomPass.params,'applyZoomBlur')

		this.scale = .3//.2
		this.radius = 1.3//.2
		this.colorModulo = 2

		let s = f.addFolder('custom')
		s.add(this,'scale',0,2).onChange(this.createRosace.bind(this))
		s.add(this,'radius',0,2).onChange(this.createRosace.bind(this))
		s.add(this,'colorModulo',0,20).step(1).onChange(this.createRosace.bind(this))

		//custom colorPass
		this.colorPass = new ColorPass()
		this.colorPass.createGui(f)

		this.passes.push( this.bloomPass )
		this.passes.push( this.colorPass )

		// -------------------------------------------------------------------------------------------------- YOUR SCENE
		this.createRosace();

		let geometry = new THREE.IcosahedronGeometry(100,2)
		let material = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe:false } )
		this.meshBig = new THREE.Mesh( geometry, material );
		//this.scene.add( this.meshBig )

		let customMaterial = new THREE.RawShaderMaterial( {
			uniforms: {
				color: { type: "c", value: new THREE.Color( 0x00ff00 ) }
			},
			vertexShader: vsBasic,
			fragmentShader: fsBasic
		} )
		this.meshSmall = new THREE.Mesh( geometry, customMaterial )
		this.meshSmall.scale.set( 1, 1, 1 )
		//this.scene.add( this.meshSmall )

		// if you don't want to hear the music, but keep analysing it, set 'shutup' to 'true'!
		audio.start( { live: false, shutup: true, showPreview: false } )
		audio.onBeat.add( this.onBeat )

		window.addEventListener( 'resize', this.onResize, false )
		this.animate()
	}
	createRosace(){
		if(this.rosace){
			this.scene.remove(this.rosace);
			this.rosace = null;
		}
		const nbTriangle = 18;
		const angleStep = Math.PI*2/nbTriangle;
		this.rosace = new THREE.Group();
		const scale = 1;
		this.rosace.scale.set(scale,scale,scale);

		for (var j = 30; j > 0; j--) {
			let r = Math.pow(1 + this.radius, j);
			const circleGroup = this.createCircleGroup(this.radius, nbTriangle, j);
			circleGroup.rotation.z =  j%2*(angleStep+angleStep*0.5);
			circleGroup.scale.setScalar(Math.pow(1 + this.scale, j))
			this.rosace.add(circleGroup);
		}
		this.scene.add(this.rosace);
	}
	createCircleGroup(radius = .5, nbTriangle = 18, index){
		const group = new THREE.Group();
		const triangles = [];
		const angleStep = Math.PI*2/nbTriangle;
		const colors = [0x35C39D,0xA6C92C,0xF9D026,0xF39137,0xE02348,0xB6218D,0x603381,0x356CA9,0x3894A1];

		for (var i = 0; i < nbTriangle; i++) {
			const selectColorIndex = i%(colors.length);
			triangles[i] = this.createTriangleMesh(colors[selectColorIndex]);
			const angle = angleStep*i;
			triangles[i].position.x = Math.cos(angle) * radius;
			triangles[i].position.y = Math.sin(angle) * radius;
			triangles[i].rotation.z = angle-Math.PI/2;
			group.add( triangles[i] );
		}
		return group;
	}
	createTriangleMesh(color){

		const mesh = new THREE.Mesh(
			this.createTriangleGeometry(),
			//new THREE.MeshBasicMaterial({color: color}),
			new THREE.RawShaderMaterial( {
				uniforms: {
					color: { type: "c", value: new THREE.Color( color ) }
				},
				vertexShader: vsShadow,
				fragmentShader: fsShadow
			} ),
		);
		return mesh;
	}
	createTriangleGeometry(){
		const geometry = new THREE.BufferGeometry()
		const count = 3
		const positions = new Float32Array(count * 3)
		const multiply = 1;
		positions[0] = 0.5*multiply; //x
		positions[1] = 0*multiply; //y
		positions[2] = 0*multiply; //z

		positions[3] = 0*multiply;
		positions[4] = 1*multiply;
		positions[5] = 0*multiply;

		positions[6] = -0.5*multiply;
		positions[7] = 0*multiply;
		positions[8] = 0*multiply;
		geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
		return geometry;
	}


	// -------------------------------------------------------------------------------------------------- ON BEAT

	onBeat = () => {
		this.meshSmall.material.uniforms.color.value.r = Math.random()
	}


	// -------------------------------------------------------------------------------------------------- EACH FRAME

	animate = () => {
		requestAnimationFrame( this.animate )

		this.meshBig.rotation.x += 0.005
		this.meshBig.rotation.y += 0.01
		// play with audio.volume
		let scale = 1 + .025 * audio.volume
		this.meshBig.scale.set( scale, scale, scale )

		this.meshSmall.position.x = Math.cos( this.theta ) * Math.sin( this.phi ) * this.radius
		this.meshSmall.position.y = Math.sin( this.theta ) * Math.sin( this.phi ) * this.radius
		this.meshSmall.position.z = Math.cos( this.phi ) * this.radius

		this.theta += .01
		this.phi += .05

		// play with audio.values[ 2 ], the green bar of the preview
		// There is 7 value (audio.values.length = 8)
		scale = .1 + .05 * audio.values[ 2 ]
		this.meshSmall.scale.set( scale, scale, scale )
		this.render()
	}


	// -------------------------------------------------------------------------------------------------- RENDER

	render = ()=>{
		const passes = []
		for( let i = 0, n = this.passes.length; i < n; i++ ) {
			let pass = this.passes[ i ]
			if(pass.activate && (pass.shader||pass.isLoaded())){
				passes.push(pass)
			}
		}
		if(passes.length>0){
			this.composer.reset()
			this.composer.render( this.scene, this.camera )
			for( let i = 0, n = passes.length-1; i < n; i++ ) {
				let pass = passes[ i ]
				this.composer.pass( pass )
			}
			this.composer.toScreen( passes[passes.length-1] )
		} else {
			this.renderer.render(this.scene, this.camera)
		}
	}


	// -------------------------------------------------------------------------------------------------- RESIZE
	onResize = () => {
		this.camera.aspect = window.innerWidth / window.innerHeight
		this.camera.updateProjectionMatrix()
		this.renderer.setSize( window.innerWidth, window.innerHeight )
		this.composer.setSize( this.renderer.domElement.width, this.renderer.domElement.height )
	}

}

export default new Main()
