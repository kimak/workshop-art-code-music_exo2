precision highp float;

uniform vec3 color;
varying vec3 vux;

void main() {
	gl_FragColor = vec4( color*(vux.y*0.4+0.6), 1.0 );
}
