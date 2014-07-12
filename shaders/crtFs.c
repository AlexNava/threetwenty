// CRT emulation

precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform int uScanlines;
uniform float uBarrelDistortion;

void main()
{
    float ramp = fract(vTextureCoord.t * float(uScanlines) * 0.5 + 0.5) - 0.5;
    float scanlineNear = 2.0 * abs(ramp);
    bool evenLine = (ramp > 0.0);
    float discretizedTextureT = floor(vTextureCoord.t * float(uScanlines)) / float(uScanlines);
    /*scanlineNear = pow(scanlineNear, 1.0)*/;
    scanlineNear = 0.5 + scanlineNear;
    if (scanlineNear > 1.0)
        scanlineNear = 1.0;

    vec4 fragmentColor;
    fragmentColor = texture2D(uSampler, vec2(vTextureCoord.s, discretizedTextureT));
    gl_FragColor = vec4(fragmentColor.rgb * scanlineNear * 1.0, 1.0);
    /*
    if (evenLine)
        gl_FragColor = vec4(fragmentColor.rgb * 1.1, 1.0);
    else
        gl_FragColor = vec4(fragmentColor.rgb * 0.9, 1.0);
    */
}
