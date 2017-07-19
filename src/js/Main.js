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


		this.scale = .3//.3
		this.radius = 1.3//1.3
		this.colorModulo = 2;
		this.radiusOffset = 0;

		let s = f.addFolder('custom')
		s.add(this,'scale',0,40).step(0.01).onChange(this.createRosace.bind(this))
		s.add(this,'radius',0,40).step(0.01).onChange(this.createRosace.bind(this))
		s.add(this,'colorModulo',0,20).step(1).onChange(this.createRosace.bind(this))

		//custom colorPass
		this.colorPass = new ColorPass()
		this.colorPass.createGui(f)

		this.passes.push( this.bloomPass )
		this.passes.push( this.colorPass )

		// -------------------------------------------------------------------------------------------------- YOUR SCENE
		this.nbTriangle = 18;
		this.nbCircle = 30;
		this.globalScale = 0;
		this.angleStep = Math.PI*2/this.nbTriangle;
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
		audio.start( { live: false, shutup: false, showPreview: false } )
		audio.onBeat.add( this.onBeat )

		window.addEventListener( 'resize', this.onResize, false )
		this.animate()
	}
	createRosace(){
		if(this.rosace){
			this.scene.remove(this.rosace);
			this.rosace = null;
		}
		this.circles = [];
		this.rosace = new THREE.Group();
		this.rosace.scale.setScalar(1)

		for (var j = this.nbCircle; j > 0; j--) {
			const group = new THREE.Group();
			const circle = this.createCircleGroup(j);
			circle.radiusOffset = 0;
			circle.group.rotation.z =  j%2*(this.angleStep+this.angleStep*0.5);
			//circle.scaleValue = 1;
			//group.scale.setScalar(Math.pow(1 + this.scale, j))
			group.add(circle.group);
			this.rosace.add(group);
			this.circles[j]=circle;
		}
		this.scene.add(this.rosace);
	}
	createCircleGroup(index){
		const group = new THREE.Group();

		const colors = [0x35C39D,0xA6C92C,0xF9D026,0xF39137,0xE02348,0xB6218D,0x603381,0x356CA9,0x3894A1];
		const triangles = [];
		for (var i = 0; i < this.nbTriangle; i++) {
			const selectColorIndex = i%(colors.length);
			triangles[i] = this.createTriangleMesh(colors[selectColorIndex]);
			const angle = this.angleStep*i;
			group.scale.setScalar(Math.pow(1 + this.scale, index))
			//group.scale.setScalar(1+this.scale*.1*index);
			//triangles[i].radius=this.radius*0.4*index;
			//triangles[i].radius=Math.pow(this.radius, index);
			//console.log(triangles[i].radius)
			//group.scale.setScalar(triangles[i].radius*this.scale);
			triangles[i].position.x = Math.cos(angle) * this.radius;
			triangles[i].position.y = Math.sin(angle) * this.radius;
			triangles[i].rotation.z = angle-Math.PI/2;
			group.add( triangles[i] );
		}
		return {group: group, triangles: triangles}
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

	//count = 0
	animate = () => {
		requestAnimationFrame( this.animate )

		this.camera.position.z += (800* audio.volume-this.camera.position.z)*0.025
		//let grow = 1.01

		//this.globalScale *= grow;

		// if (this.count === undefined)
		// 	this.count = 0
		//
		// if (this.count++ > 10) {
		// 	this.count = 0
		// 	this.globalScale = 1
		// }

		/*let step = Math.log(this.globalScale) / Math.log(grow)
		step %= Math.log(this.radius)
		this.globalScale = Math.pow(grow, step)
		this.rosace.scale.setScalar(this.globalScale);*/

		//this.globalScale+=0.001;

		for (var j = this.nbCircle; j > 0; j--) {
			const circle = this.circles[j];
			//const scalePow = Math.pow(1 + this.scale, j);

			//console.log(Math.pow(1 + this.scale, j)+circle.scaleValue)

			//console.log(circle.scaleValue)
			//circle.group.scale.setScalar(circle.scaleValue);
			//console.log(circle.group.scale);
			//circle.radiusOffset+=0.01;
			//circle.radiusOffset=Math.pow(circle.scaleValue, j);
			//circle.group.position.z += 5
			//console.log(circle.group.position.z)

			//1.3/3
			//console.log(this.circles[j].group)
			//this.circles[j].circle.position.z+=1.5;
			//if(this.circles[j].position.z>800) this.circles[j].position.z = 0;
			for (var i = 0; i < this.nbTriangle; i++) {
				const angle = this.angleStep*i;
				const triangle = this.circles[j].triangles[i]
				//triangle.position.x = Math.cos(angle) * (this.radius);//-circle.radiusOffset*0.3/1.3
				//triangle.position.y = Math.sin(angle) * (this.radius-circle.scaleValue);
				//triangle.position.z = 100 * audio.values[ 2 ]*Math.random()
			}
		}

		/*this.meshBig.rotation.x += 0.005
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
		this.meshSmall.scale.set( scale, scale, scale )*/
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
