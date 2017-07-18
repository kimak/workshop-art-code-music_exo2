const OrbitControls = require('three-orbit-controls')(THREE)

import vsBasic from "shaders/basic.vs"
import fsBasic from "shaders/basic.fs"
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

		this.camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 1, 1000 )
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
		this.bloomPass.activate = true
		// this.bloomPass.params.applyZoomBlur = true
		this.bloomPass.params.blurAmount = 0.4
		let g = f.addFolder('bloom1')
		g.add(this.bloomPass,'activate')
		g.add(this.bloomPass.params,'zoomBlurStrength',0,1)
		g.add(this.bloomPass.params,'blurAmount',0,1)
		g.add(this.bloomPass.params,'applyZoomBlur')
		//custom colorPass
		this.colorPass = new ColorPass()
		this.colorPass.createGui(f)

		this.passes.push( this.bloomPass )
		this.passes.push( this.colorPass )
		
		// -------------------------------------------------------------------------------------------------- YOUR SCENE

		let geometry = new THREE.IcosahedronGeometry(100,2)
		let material = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe:false } )
		this.meshBig = new THREE.Mesh( geometry, material )
		this.scene.add( this.meshBig )

		let customMaterial = new THREE.RawShaderMaterial( { 
			uniforms: {
				color: { type: "c", value: new THREE.Color( 0x00ff00 ) }
			},
			vertexShader: vsBasic,
			fragmentShader: fsBasic
		} )
		this.meshSmall = new THREE.Mesh( geometry, customMaterial )
		this.meshSmall.scale.set( 1, 1, 1 )
		this.scene.add( this.meshSmall )

		this.theta = 0
		this.phi = 0
		this.radius = 150

		// if you don't want to hear the music, but keep analysing it, set 'shutup' to 'true'!
		audio.start( { live: false, shutup: true, showPreview: true } )
		audio.onBeat.add( this.onBeat )

		window.addEventListener( 'resize', this.onResize, false )
		this.animate()
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
