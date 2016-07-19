// CRT emulation

precision highp float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D uBezelSampler;
uniform sampler2D uGlowSampler;
uniform sampler2D uPhosphorSampler;

uniform int uScanlines;
uniform float uBarrelDistortion;
uniform float uVignette;

void main()
{
	vec2 centerCoord = vTextureCoord - vec2(0.5, 0.5);
	float sqDist = dot(centerCoord, centerCoord) * uBarrelDistortion;

	// Distorsion
	vec2 distorted = (vTextureCoord + centerCoord * (1.0 + sqDist) * sqDist);

	if ((distorted.s < 0.0)
		|| (distorted.t < 0.0)
		|| (distorted.s > 1.0)
		|| (distorted.t > 1.0))
	{
		//discard;
	}

	// Scanlines
	float ramp = fract(distorted.t * float(uScanlines) + 0.5) - 0.5;
	float scanlineNear = 2.0 * abs(ramp);
	bool evenLine = (ramp > 0.0);
	float discretizedTextureT = floor(distorted.t * float(uScanlines)) / float(uScanlines);

	scanlineNear = 0.5 + scanlineNear;
	if (scanlineNear > 1.0)
	{
		scanlineNear = 1.0;
	}

	vec4 fragmentColor;
	fragmentColor = texture2D(uSampler, vec2(distorted.s, discretizedTextureT));
	fragmentColor = vec4(fragmentColor.rgb * scanlineNear, 1.0);

	//fragmentColor = texture2D(uSampler, distorted);
	//fragmentColor.rgb *= texture2D(uPhosphorSampler, distorted).rgb * vec3(1.5, 1.5, 1.5);

	// Vignette
	fragmentColor.rgb *= (1.0 - uVignette * sqDist);

	// Bezel
	vec4 bezelColor;
	bezelColor = texture2D(uBezelSampler, vTextureCoord);
	
	if (bezelColor.a > 0.0)
	{
		// Image glow on bezel
		float shift = 1.0 / 256.0;
		vec4 glowLight = texture2D(uGlowSampler, vTextureCoord);
		vec4 glowColor = texture2D(uSampler, vTextureCoord);
		glowColor += texture2D(uSampler, vec2(vTextureCoord.s + 2.0 * shift, vTextureCoord.t + shift));
		glowColor += texture2D(uSampler, vec2(vTextureCoord.s - shift, vTextureCoord.t + 2.0 * shift));
		glowColor += texture2D(uSampler, vec2(vTextureCoord.s - 2.0 * shift, vTextureCoord.t - shift));
		glowColor += texture2D(uSampler, vec2(vTextureCoord.s + shift, vTextureCoord.t - 2.0 * shift));
		glowColor *= 0.2;

		glowColor.rgb *= glowLight.rgb;

		bezelColor.rgb += 0.3 * glowColor.rgb;

		// Result
		gl_FragColor = vec4((bezelColor.rgb * bezelColor.a + fragmentColor.rgb * (1.0 - bezelColor.a)), 1.0);
	}
	else
	{
		gl_FragColor = vec4(fragmentColor.rgb, 1.0);
	}
	
}
