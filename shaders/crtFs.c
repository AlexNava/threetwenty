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

	if (distorted.s < 0.0)
	{
		distorted.s = -distorted.s;
	}
	if (distorted.t < 0.0)
	{
		distorted.t = -distorted.t;
	}
	if (distorted.s > 1.0)
	{
		distorted.s = 2.0 - distorted.s;
	}
	if (distorted.t > 1.0)
	{
		distorted.t = 2.0 - distorted.t;
	}

	// Scanlines
	float ramp = fract(distorted.t * float(uScanlines) + 0.5) - 0.5;
	//  Ramp
	//  .5| *   *   *   *   
	//    |/|  /|  /|  /|  /
	//   0+-|-/-|-/-|-/-|-/---> Y
	//    | |/  |/  |/  |/  
	// -.5| *   *   *   *   

	//bool evenLine = (ramp > 0.0);
	float discretizedTextureT = floor(distorted.t * float(uScanlines)) / float(uScanlines);

	float scanlineNear = 2.0 * abs(ramp);
	scanlineNear = 0.5 + scanlineNear;
	if (scanlineNear > 1.0)
	{
		scanlineNear = 1.0;
	}

	vec4 fragmentColor;
	fragmentColor = texture2D(uSampler, vec2(distorted.s, discretizedTextureT));
	//fragmentColor = vec4(fragmentColor.rgb * scanlineNear, 1.0);

	// Vignette
	fragmentColor.rgb *= (1.0 - uVignette * sqDist);
	const float threshold = 0.875; // this should be equal to the mean value of scanlineNear
	if (fragmentColor.r > threshold)
		fragmentColor.r = mix(scanlineNear, 1.0, (fragmentColor.r - threshold) / (1.0 - threshold));
	else
		fragmentColor.r = mix(0.0, scanlineNear, fragmentColor.r / threshold);
	
	if (fragmentColor.g > threshold)
		fragmentColor.g = mix(scanlineNear, 1.0, (fragmentColor.g - threshold) / (1.0 - threshold));
	else
		fragmentColor.g = mix(0.0, scanlineNear, fragmentColor.g / threshold);
	
	if (fragmentColor.b > threshold)
		fragmentColor.b = mix(scanlineNear, 1.0, (fragmentColor.b - threshold) / (1.0 - threshold));
	else
		fragmentColor.b = mix(0.0, scanlineNear, fragmentColor.b / threshold);

	//fragmentColor = texture2D(uSampler, distorted);
	//fragmentColor.rgb *= texture2D(uPhosphorSampler, distorted).rgb * vec3(1.5, 1.5, 1.5);


	// Bezel
	vec4 bezelColor;
	bezelColor = texture2D(uBezelSampler, vTextureCoord);
	
	if (bezelColor.a > 0.0)
	{
		// Image glow on bezel
		float shift = 1.0 / 256.0;
		vec4 glowLight = texture2D(uGlowSampler, vTextureCoord);
		vec4 glowColor = texture2D(uSampler, distorted);
		glowColor += texture2D(uSampler, vec2(distorted.s + 2.0 * shift, distorted.t + shift));
		glowColor += texture2D(uSampler, vec2(distorted.s - shift, distorted.t + 2.0 * shift));
		glowColor += texture2D(uSampler, vec2(distorted.s - 2.0 * shift, distorted.t - shift));
		glowColor += texture2D(uSampler, vec2(distorted.s + shift, distorted.t - 2.0 * shift));
		glowColor *= 0.2;

		glowColor.rgb *= glowLight.rgb;
		
		glowColor.rgb *= (1.0 - uVignette * sqDist);

		bezelColor.rgb += 0.7 * glowColor.rgb;

		// Result
		gl_FragColor = vec4((bezelColor.rgb * bezelColor.a + fragmentColor.rgb * (1.0 - bezelColor.a)), 1.0);
	}
	else
	{
		gl_FragColor = vec4(fragmentColor.rgb, 1.0);
	}
	
}
