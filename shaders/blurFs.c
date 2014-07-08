// Blur texture fragment shader

precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float uTextureW;
uniform float uTextureH;
uniform float uBlurAmount;
uniform vec2 uBlurShift;
uniform vec4 uClearColor;

void main()
{
    float OneX = 1.0 / uTextureW;
    float OneY = 1.0 / uTextureH;
    vec2 targetPos = vec2(vTextureCoord.s - uBlurShift.s * OneX, vTextureCoord.t - uBlurShift.t * OneY);
    vec4 fragmentColor;

    fragmentColor = texture2D(uSampler, vec2(targetPos.s, targetPos.t));
    fragmentColor += uBlurAmount * texture2D(uSampler, vec2(targetPos.s - OneX, targetPos.t));
    fragmentColor += uBlurAmount * texture2D(uSampler, vec2(targetPos.s + OneX, targetPos.t));
    fragmentColor += uBlurAmount * texture2D(uSampler, vec2(targetPos.s, targetPos.t - OneY));
    fragmentColor += uBlurAmount * texture2D(uSampler, vec2(targetPos.s, targetPos.t + OneY));
    gl_FragColor = vec4(uClearColor.a * uClearColor.rgb + (1.0 - uClearColor.a) * fragmentColor.rgb / (1.0 + uBlurAmount * 4.0), 1.0);
}
