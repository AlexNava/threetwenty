// CRT emulation

precision highp float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform int uScanlines;
uniform float uBarrelDistortion;

void main()
{
	vec2 centerCoord = vTextureCoord - vec2(0.5, 0.5);
	float dist = dot(centerCoord, centerCoord) * uBarrelDistortion;
	vec2 distorted = (vTextureCoord + centerCoord * (1.0 + dist) * dist);

	if ((distorted.s < 0.0)
		|| (distorted.t < 0.0)
		|| (distorted.s > 1.0)
		|| (distorted.t > 1.0))
	{
		discard;
	}
		
	float ramp = fract(distorted.t * float(uScanlines) + 0.5) - 0.5;
	float scanlineNear = 2.0 * abs(ramp);
	bool evenLine = (ramp > 0.0);
	float discretizedTextureT = floor(distorted.t * float(uScanlines)) / float(uScanlines);
	/*scanlineNear = pow(scanlineNear, 1.0)*/;
	scanlineNear = 0.5 + scanlineNear;
	if (scanlineNear > 1.0)
		scanlineNear = 1.0;

	vec4 fragmentColor;
	fragmentColor = texture2D(uSampler, vec2(distorted.s, discretizedTextureT));
	gl_FragColor = vec4(fragmentColor.rgb * scanlineNear * 1.0, 1.0);
	/*
	if (evenLine)
		gl_FragColor = vec4(fragmentColor.rgb * 1.1, 1.0);
	else
		gl_FragColor = vec4(fragmentColor.rgb * 0.9, 1.0);
	*/
}
