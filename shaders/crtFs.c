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

const int xSamples = 2;
const int ySamples = 3;
const vec2 pixelSize = vec2(1.0 / 1920.0, 1.0 / 1080.0);
const vec2 samplesOffset = vec2(pixelSize.x / float(xSamples), pixelSize.y / float(ySamples));
const vec2 samplesOrigin = -pixelSize / 2.0 + samplesOffset / 2.0;

void main()
{
	vec4 accuColor = vec4(0.0, 0.0, 0.0, 1.0);
	vec2 textureCoord;
	for (int ix = 0; ix < xSamples; ++ix)
	{
		for (int iy = 0; iy < ySamples; ++iy)
		{
			textureCoord = vTextureCoord + samplesOrigin;
			textureCoord.x += samplesOffset.x * float(ix);
			textureCoord.y += samplesOffset.y * float(iy);
			
			vec2 centerCoord = textureCoord - vec2(0.5, 0.5);
			float sqDist = dot(centerCoord, centerCoord) * uBarrelDistortion;

			// Distorsion
			vec2 distorted = (textureCoord + centerCoord * (1.0 + sqDist) * sqDist);

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
			float scanlineNear = 2.0 * abs(ramp);
			bool evenLine = (ramp > 0.0);
			float discretizedTextureT = floor(distorted.t * float(uScanlines)) / float(uScanlines);

			scanlineNear = 0.5 + scanlineNear;
			if (scanlineNear > 1.0)
			{
				scanlineNear = 1.0;
			}
			scanlineNear *= (4.0 / 7.0);

			vec4 fragmentColor;
			fragmentColor = texture2D(uSampler, vec2(distorted.s, discretizedTextureT));
			//fragmentColor = vec4(fragmentColor.rgb * scanlineNear, 1.0);

			// Vignette
			fragmentColor.rgb *= (1.0 - uVignette * sqDist);

			if (fragmentColor.r > 0.5)
				fragmentColor.r = mix(scanlineNear, 1.0, 2.0 * (fragmentColor.r - 0.5));
			else
				fragmentColor.r = mix(0.0, scanlineNear, 2.0 * fragmentColor.r);

			if (fragmentColor.g > 0.5)
				fragmentColor.g = mix(scanlineNear, 1.0, 2.0 * (fragmentColor.g - 0.5));
			else
				fragmentColor.g = mix(0.0, scanlineNear, 2.0 * fragmentColor.g);

			if (fragmentColor.b > 0.5)
				fragmentColor.b = mix(scanlineNear, 1.0, 2.0 * (fragmentColor.b - 0.5));
			else
				fragmentColor.b = mix(0.0, scanlineNear, 2.0 * fragmentColor.b);

			//fragmentColor = texture2D(uSampler, distorted);
			//fragmentColor.rgb *= texture2D(uPhosphorSampler, distorted).rgb * vec3(1.5, 1.5, 1.5);


			// Bezel
			vec4 bezelColor;
			bezelColor = texture2D(uBezelSampler, textureCoord);

			if (bezelColor.a > 0.0)
			{
				// Image glow on bezel
				float shift = 1.0 / 256.0;
				vec4 glowLight = texture2D(uGlowSampler, textureCoord);
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
				accuColor += vec4((bezelColor.rgb * bezelColor.a + fragmentColor.rgb * (1.0 - bezelColor.a)), 1.0);
			}
			else
			{
				accuColor += vec4(fragmentColor.rgb, 1.0);
			}
		}
	}
	gl_FragColor = accuColor / float(xSamples * ySamples);
}
