// Palette lookup fragment shader

precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uBufSampler;
uniform sampler2D uPalSampler;
uniform float uTextureW;
uniform float uTextureH;
uniform float uSelectedPalette;
uniform float uPaletteRows;
uniform vec2 uBlurShift;
uniform vec4 uClearColor;

void main()
{
    float OneX = 1.0 / uTextureW;
    float OneY = 1.0 / uTextureH;
    vec2 targetPos = vec2(vTextureCoord.s - uBlurShift.s * OneX, vTextureCoord.t - uBlurShift.t * OneY);
    vec4 fragmentColor = texture2D(uBufSampler, vec2(targetPos.s, targetPos.t));
	
	// Palette row selection:
	//
	//  Row N - 1 [ | | | | | | ]
	//  ...       [ | | | | | | ]
	//  Row 1     [ | | | | | | ]
	//  Row 0     [ | | | | | | ]
	//
	// Values outside [0, N) will be clamped; intermediate values will interpolate
	float row = uSelectedPalette;
	if (row < 0.0)
	{
		row = 0.0;
	}
	if (row > uPaletteRows - 1.0)
	{
		row = uPaletteRows - 1.0;
	}
	float weight = fract(row);
	
    vec4 paletteColorA = texture2D(uPalSampler, vec2(fragmentColor.r, (row + 0.5) / uPaletteRows));
    vec4 paletteColorB = texture2D(uPalSampler, vec2(fragmentColor.r, (row + 1.5) / uPaletteRows));
	vec3 paletteColor = (1.0 - weight) * paletteColorA.rgb + weight * paletteColorB.rgb;

	gl_FragColor = vec4(paletteColor, 1.0);
}
