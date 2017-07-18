precision highp float;

/*float aastep(float threshold, float value) {
  #ifdef GL_OES_standard_derivatives
    float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;
    return smoothstep(threshold-afwidth, threshold+afwidth, value);
  #else
    return step(threshold, value);
  #endif
}*/

uniform vec3 color;
varying vec3 vux;

void main() {
	gl_FragColor = vec4( color*(smoothstep(0., 0.25,vux.y*1.0)), 1.0 );
}
