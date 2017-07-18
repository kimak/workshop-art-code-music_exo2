

export default class ColorPass extends WAGNER.Pass {

	constructor() {
		super()

		this.shader = WAGNER.processShader( WAGNER.basicVs, `
		uniform sampler2D tInput;
		uniform vec2 resolution;
		varying vec2 vUv;

		uniform float gamma;
		uniform float contrast;
		uniform float brightness;
		uniform float vignetteFallOff;
		uniform float vignetteAmount;
		uniform float invertRatio;
		uniform float bw;

		vec3 toGamma( vec3 rgb ) {
			return pow( rgb, vec3( 1.0 / gamma ) );
		}

		void main() {
			vec3 rgb = texture2D(tInput, vUv).rgb;

			//Vignette
			float dist = distance(vUv, vec2(0.5, 0.5));
			rgb *= smoothstep(0.8, vignetteFallOff * 0.799, dist * (vignetteAmount + vignetteFallOff));

			//Color Correction
			rgb = (toGamma( rgb ) - .5) * contrast + .5 + vec3( brightness );

			//BW
			rgb = mix(rgb,vec3( dot( rgb, vec3( .299, 0.587, 0.114 ) ) ), bw);

			//Invert
			rgb = mix(rgb, (1. - rgb),invertRatio);

			gl_FragColor = vec4(rgb, 1.);
		}
		`)
		
		this.mapUniforms( this.shader.uniforms )
		this.params.gamma = 1
		this.params.contrast = 1
		this.params.brightness = 0
		this.params.vignetteFallOff = .05;
		this.params.vignetteAmount = .38;
		this.params.invertRatio = 1;
		this.params.bw = 0;
	}

	createGui(gui){
		const f = gui.addFolder('vj classic')
		f.add(this,'activate')
		f.add(this.params,'brightness',-2,2)
		f.add(this.params,'gamma',0,2)
		f.add(this.params,'contrast',0,2)
		f.add(this.params,'invertRatio',0,1).step(1)
		f.add(this.params,'bw',0,1).step(1)
		f.add(this.params,'vignetteFallOff',0,2).step(0.001)
		f.add(this.params,'vignetteAmount',0,2).step(0.001)
		f.open()
	}

	run( c ) {
		if(!this.shader){
			return
		}
		this.shader.uniforms.gamma.value = this.params.gamma
		this.shader.uniforms.contrast.value = this.params.contrast
		this.shader.uniforms.brightness.value = this.params.brightness
		this.shader.uniforms.vignetteFallOff.value = this.params.vignetteFallOff
		this.shader.uniforms.vignetteAmount.value = this.params.vignetteAmount
		this.shader.uniforms.invertRatio.value = this.params.invertRatio
		this.shader.uniforms.bw.value = this.params.bw
		c.pass( this.shader )
	}

}
