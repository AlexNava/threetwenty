var webGLApp = function()
{
    this.setup();
}

webGLApp.prototype.setup = function()
{
    // Global timer
    this.timer =
    {
        lastTime: 0
    }

    this.angle = 0.0;
    this.blurriness = 0.0;
    this.blurShiftX = 1.0;
    this.blurShiftY = 1.0;

    this.triangleVertexPositionBuffer = null;
    this.triangleVertexColorBuffer = null;
    this.quadVerticesBuffer = null;
    this.quadCoordsBuffer = null;
    this.basicShaderProgram = null;
    this.textureShaderProgram = null;
    this.crtShaderProgram = null;

    this.rttFramebuffer1 = null;
    this.rttTexture1 = null;
    this.rttRenderbuffer1 = null;

    this.rttFramebuffer2 = null;
    this.rttTexture2 = null;
    this.rttRenderbuffer2 = null;
    
    this.mainCanvas = $("#MainCanvas")[0];                

    try    
    {
        this.initInputs();
    }
    catch (exception)
    {
        alert('Error while initializing keyboard handlers: ' + exception);
    }
    
    try    
    {
        this.initGL(this.mainCanvas);
    }
    catch (exception)
    {
        alert('Error while booting WebGL: ' + exception);
    }

    this.gl.enable(this.gl.DEPTH_TEST);
    
    this.mvMatrix = mat4.create();
    this.pMatrix = mat4.create();

}

webGLApp.prototype.initInputs = function() {
    this.gameKeyPressed = new Array(0);

    window.addEventListener("keydown",
        function(event) {
            this.gameKeyPressed[event.keyCode] = true;
            //console.log("keyboard event: key pressed " + event.keyCode);
        }.bind(this),
        true
    );

    window.addEventListener("keyup",
        function(event) {
            this.gameKeyPressed[event.keyCode] = false;
            //console.log("keyboard event: key pressed " + event.keyCode);
        }.bind(this),
        true
    );

    window.addEventListener("touchstart",
        function(event) {
            event.preventDefault();
            var touch = event.changedTouches[0];
        }.bind(this),
        false
    );
    
    window.addEventListener("touchmove",
        function(event) {
            event.preventDefault();
            var touch = event.changedTouches[0];
        }.bind(this),
        false
    );
    
    window.addEventListener("touchend",
        function(event) {
            event.preventDefault();
            var touch = event.changedTouches[0];
        }.bind(this),
        false
    );
    
    window.addEventListener("focusout",
        function(event) {
            this.gameKeyPressed = new Array(0);
        }.bind(this),
		false
    );
}

webGLApp.prototype.initGL = function()
{
    this.gl = this.mainCanvas.getContext("webgl") || this.mainCanvas.getContext("experimental-webgl");
    this.gl.viewportWidth = this.mainCanvas.width;
    this.gl.viewportHeight = this.mainCanvas.height;

    this.initBuffers();
    this.initShaders();
    this.initOffscreenBuffer();

    if (!this.gl)
    {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

webGLApp.prototype.initBuffers = function()
{
    // Init matrices
    this.mvMatrix = mat4.create();
    this.pMatrix = mat4.create();
    
    // Init triangle buffer
    this.triangleVertexPositionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.triangleVertexPositionBuffer);
    var vertices = [
         0.0,  1.0, 0.0, 1.0,
        -0.87, -0.5, 0.0, 1.0,
         0.87, -0.5, 0.0, 1.0
    ];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
    this.triangleVertexPositionBuffer.itemSize = 4;
    this.triangleVertexPositionBuffer.numItems = 3;

    this.triangleVertexColorBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.triangleVertexColorBuffer);
    var colors = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0
    ];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
    this.triangleVertexColorBuffer.itemSize = 4;
    this.triangleVertexColorBuffer.numItems = 3;
    
    // Init fullscreen quad buffer
    this.quadVerticesBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadVerticesBuffer);
    var quadVertices = [
        0.0, 0.0, 0.0, 1.0,
        0.0, 200.0, 0.0, 1.0,
        320.0, 0.0, 0.0, 1.0,
        320.0, 200.0, 0.0, 1.0
    ];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(quadVertices), this.gl.STATIC_DRAW);
    this.quadVerticesBuffer.itemSize = 4;
    this.quadVerticesBuffer.numItems = 4;

    this.quadCoordsBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadCoordsBuffer);
    var quadCoords = [
        0.0, 0.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0
    ];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(quadCoords), this.gl.STATIC_DRAW);
    this.quadCoordsBuffer.itemSize = 2;
    this.quadCoordsBuffer.numItems = 4;

}

webGLApp.prototype.initShaders = function()
{
    // Init basic shader
    var vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    var fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

    this.gl.shaderSource(vertexShader, BasicVertexShader);
    this.gl.compileShader(vertexShader);
    if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS))
    {
        alert(this.gl.getShaderInfoLog(vertexShader));
    }

    this.gl.shaderSource(fragmentShader, BasicFragmentShader);
    this.gl.compileShader(fragmentShader);
    if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS))
    {
        alert(this.gl.getShaderInfoLog(fragmentShader));
    }

    this.basicShaderProgram = this.gl.createProgram();
    this.gl.attachShader(this.basicShaderProgram, vertexShader);
    this.gl.attachShader(this.basicShaderProgram, fragmentShader);
    this.gl.linkProgram(this.basicShaderProgram);

    // Init basic texture shader
    var vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    var fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

    this.gl.shaderSource(vertexShader, BasicTextureVertexShader);
    this.gl.compileShader(vertexShader);
    if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS))
    {
        alert(this.gl.getShaderInfoLog(vertexShader));
    }

    this.gl.shaderSource(fragmentShader, BasicTextureFragmentShader);
    this.gl.compileShader(fragmentShader);
    if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS))
    {
        alert(this.gl.getShaderInfoLog(fragmentShader));
    }

    this.textureShaderProgram = this.gl.createProgram();
    this.gl.attachShader(this.textureShaderProgram, vertexShader);
    this.gl.attachShader(this.textureShaderProgram, fragmentShader);
    this.gl.linkProgram(this.textureShaderProgram);

    // Init blur shader
    var vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    var fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

    this.gl.shaderSource(vertexShader, BlurVertexShader);
    this.gl.compileShader(vertexShader);
    if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS))
    {
        alert(this.gl.getShaderInfoLog(vertexShader));
    }

    this.gl.shaderSource(fragmentShader, BlurFragmentShader);
    this.gl.compileShader(fragmentShader);
    if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS))
    {
        alert(this.gl.getShaderInfoLog(fragmentShader));
    }

    this.blurShaderProgram = this.gl.createProgram();
    this.gl.attachShader(this.blurShaderProgram, vertexShader);
    this.gl.attachShader(this.blurShaderProgram, fragmentShader);
    this.gl.linkProgram(this.blurShaderProgram);

    // Init CRT shader
    var vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    var fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

    this.gl.shaderSource(vertexShader, CrtVertexShader);
    this.gl.compileShader(vertexShader);
    if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS))
    {
        alert(this.gl.getShaderInfoLog(vertexShader));
    }

    this.gl.shaderSource(fragmentShader, CrtFragmentShader);
    this.gl.compileShader(fragmentShader);
    if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS))
    {
        alert(this.gl.getShaderInfoLog(fragmentShader));
    }

    this.crtShaderProgram = this.gl.createProgram();
    this.gl.attachShader(this.crtShaderProgram, vertexShader);
    this.gl.attachShader(this.crtShaderProgram, fragmentShader);
    this.gl.linkProgram(this.crtShaderProgram);

    // Check shaders
    if (!this.gl.getProgramParameter(this.basicShaderProgram, this.gl.LINK_STATUS)
       || !this.gl.getProgramParameter(this.textureShaderProgram, this.gl.LINK_STATUS)
       || !this.gl.getProgramParameter(this.blurShaderProgram, this.gl.LINK_STATUS)
       || !this.gl.getProgramParameter(this.crtShaderProgram, this.gl.LINK_STATUS))
    {
      throw "Could not initialise shaders";
    }

    // Set uniforms
    // Basic shader
    this.gl.useProgram(this.basicShaderProgram);

    this.basicShaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.basicShaderProgram, "aVertexPosition");
    this.gl.enableVertexAttribArray(this.basicShaderProgram.vertexPositionAttribute);

    this.basicShaderProgram.vertexColorAttribute = this.gl.getAttribLocation(this.basicShaderProgram, "aVertexColor");
    this.gl.enableVertexAttribArray(this.basicShaderProgram.vertexColorAttribute);

    this.basicShaderProgram.pMatrixUniform = this.gl.getUniformLocation(this.basicShaderProgram, "uPMatrix");
    this.basicShaderProgram.mvMatrixUniform = this.gl.getUniformLocation(this.basicShaderProgram, "uMVMatrix");

    // Basic texture
    this.gl.useProgram(this.textureShaderProgram);
    
    this.textureShaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.textureShaderProgram, "aVertexPosition");
    this.gl.enableVertexAttribArray(this.textureShaderProgram.vertexPositionAttribute);

    this.textureShaderProgram.textureCoordAttribute = this.gl.getAttribLocation(this.textureShaderProgram, "aTextureCoord");
    this.gl.enableVertexAttribArray(this.textureShaderProgram.textureCoordAttribute);

    this.textureShaderProgram.pMatrixUniform = this.gl.getUniformLocation(this.textureShaderProgram, "uPMatrix");
    this.textureShaderProgram.mvMatrixUniform = this.gl.getUniformLocation(this.textureShaderProgram, "uMVMatrix");
    this.textureShaderProgram.samplerUniform = this.gl.getUniformLocation(this.textureShaderProgram, "uSampler");
    this.textureShaderProgram.textureWUniform = this.gl.getUniformLocation(this.textureShaderProgram, "uTextureW");
    this.textureShaderProgram.textureHUniform = this.gl.getUniformLocation(this.textureShaderProgram, "uTextureH");

    // Blur
    this.gl.useProgram(this.blurShaderProgram);
    
    this.blurShaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.blurShaderProgram, "aVertexPosition");
    this.gl.enableVertexAttribArray(this.blurShaderProgram.vertexPositionAttribute);

    this.blurShaderProgram.textureCoordAttribute = this.gl.getAttribLocation(this.blurShaderProgram, "aTextureCoord");
    this.gl.enableVertexAttribArray(this.blurShaderProgram.textureCoordAttribute);

    this.blurShaderProgram.pMatrixUniform = this.gl.getUniformLocation(this.blurShaderProgram, "uPMatrix");
    this.blurShaderProgram.mvMatrixUniform = this.gl.getUniformLocation(this.blurShaderProgram, "uMVMatrix");
    this.blurShaderProgram.samplerUniform = this.gl.getUniformLocation(this.blurShaderProgram, "uSampler");
    this.blurShaderProgram.textureWUniform = this.gl.getUniformLocation(this.blurShaderProgram, "uTextureW");
    this.blurShaderProgram.textureHUniform = this.gl.getUniformLocation(this.blurShaderProgram, "uTextureH");
    this.blurShaderProgram.blurAmountUniform = this.gl.getUniformLocation(this.blurShaderProgram, "uBlurAmount");
    this.blurShaderProgram.blurShiftUniform = this.gl.getUniformLocation(this.blurShaderProgram, "uBlurShift");
    this.blurShaderProgram.clearColorUniform = this.gl.getUniformLocation(this.blurShaderProgram, "uClearColor");

    // CRT
    this.gl.useProgram(this.crtShaderProgram);
    
    this.crtShaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.crtShaderProgram, "aVertexPosition");
    this.gl.enableVertexAttribArray(this.crtShaderProgram.vertexPositionAttribute);

    this.crtShaderProgram.textureCoordAttribute = this.gl.getAttribLocation(this.crtShaderProgram, "aTextureCoord");
    this.gl.enableVertexAttribArray(this.crtShaderProgram.textureCoordAttribute);

    this.crtShaderProgram.pMatrixUniform = this.gl.getUniformLocation(this.crtShaderProgram, "uPMatrix");
    this.crtShaderProgram.samplerUniform = this.gl.getUniformLocation(this.crtShaderProgram, "uSampler");
    this.crtShaderProgram.scanlinesUniform = this.gl.getUniformLocation(this.crtShaderProgram, "uScanlines");
    this.crtShaderProgram.barrelUniform = this.gl.getUniformLocation(this.crtShaderProgram, "uBarrelDistortion");
    
}

var lastSizeW = 0;
var lastSizeH = 0;

webGLApp.prototype.initOffscreenBuffer = function()
{    
    // Two separate FBOs
    this.rttFramebuffer1 = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.rttFramebuffer1);
    this.rttFramebuffer1.width = 320;
    this.rttFramebuffer1.height = 200;

    // Two textures for color
    // Must specify CLAMP_TO_EDGE and no mipmap because the texture will be non-powered-of-two sized
    this.rttTexture1 = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.rttTexture1);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);    
    
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.rttFramebuffer1.width, this.rttFramebuffer1.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);

    // Two renderbuffers (for depth?)
    this.rttRenderbuffer1 = this.gl.createRenderbuffer();
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.rttRenderbuffer1);
    this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, this.rttFramebuffer1.width, this.rttFramebuffer1.height);

    // Bind to 1st FBO
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.rttTexture1, 0);
    this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, this.rttRenderbuffer1);
    
    
    // 2nd FBO
    this.rttFramebuffer2 = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.rttFramebuffer2);
    this.rttFramebuffer2.width = 320;
    this.rttFramebuffer2.height = 200;

    // 2nd texture
    this.rttTexture2 = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.rttTexture2);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);    
    
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.rttFramebuffer2.width, this.rttFramebuffer2.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);

    // 2nd renderbuffer
    this.rttRenderbuffer2 = this.gl.createRenderbuffer();
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.rttRenderbuffer2);
    this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, this.rttFramebuffer2.width, this.rttFramebuffer2.height);

    // Bind to 2nd FBO
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.rttTexture2, 0);
    this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, this.rttRenderbuffer2);
    
    // Switch to default texture/renderbuff/framebuff
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
}

webGLApp.prototype.checkResize = function(canvas, projMatrix)
{
    //if ((canvas.width !== lastSizeW) || (canvas.height !== lastSizeH))
    if ((document.body.clientWidth !== lastSizeW) || (document.body.clientHeight !== lastSizeH))
    {
        lastSizeH = document.body.clientHeight;
        lastSizeW = document.body.clientWidth;
        
        canvas.width = lastSizeW;
        canvas.height = lastSizeH;
//        this.gl.viewport(0, 0, 320, 200);
//        mat4.identity(projMatrix);
//        mat4.perspective(projMatrix, 45, 4.0 / 3.0, 0.1, 100.0);
    }
}

webGLApp.prototype.drawScene = function()
{
    this.checkResize(this.mainCanvas, this.pMatrix);

    // draw scene on 1st FBO
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.rttFramebuffer1);
    this.gl.viewport(0, 0, 320, 200);
    this.gl.enable(this.gl.DEPTH_TEST);

//    this.gl.clearColor(0.5, 0.5, 0.5, 1.0);
//    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    
    // Instead of clearing color buffer, put the previous frame on it (blurred)
    this.gl.disable(this.gl.DEPTH_TEST);
    
    {
        // Setup orthographic matrices
        var identityMv = mat4.create();
        var orthoMatrix = mat4.create();
        mat4.ortho(orthoMatrix, 0, 320, 0, 200, -1, 1);

        this.gl.useProgram(this.blurShaderProgram);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.rttTexture2);
        this.gl.uniform1i(this.blurShaderProgram.samplerUniform, 0);
        this.gl.uniform1f(this.blurShaderProgram.textureWUniform, 320);
        this.gl.uniform1f(this.blurShaderProgram.textureHUniform, 200);
        this.gl.uniform1f(this.blurShaderProgram.blurAmountUniform, 0.5);
        this.gl.uniform2f(this.blurShaderProgram.blurShiftUniform, this.blurShiftX, this.blurShiftY);
        this.gl.uniform4f(this.blurShaderProgram.clearColorUniform, 0.5, 0.5, 0.5, 0.05);

        this.gl.uniformMatrix4fv(this.blurShaderProgram.mvMatrixUniform, false, identityMv);
        this.gl.uniformMatrix4fv(this.blurShaderProgram.pMatrixUniform, false, orthoMatrix);

        // Draw stuff
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadVerticesBuffer);
        this.gl.vertexAttribPointer(this.blurShaderProgram.vertexPositionAttribute, this.quadVerticesBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadCoordsBuffer);
        this.gl.vertexAttribPointer(this.blurShaderProgram.textureCoordAttribute, this.quadCoordsBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.quadVerticesBuffer.numItems);
    }
    
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
    // End of blur-out
    
    
    mat4.identity(this.pMatrix);
    mat4.perspective(this.pMatrix, 45, 4.0 / 3.0, 0.1, 100.0);

    mat4.identity(this.mvMatrix);
    mat4.translate(this.mvMatrix, this.mvMatrix, [0.0, 0.0, -4.0]);
    mat4.rotate(this.mvMatrix, this.mvMatrix, (this.angle * 3.14159 / 180.0), [0, 0, 1]);

    this.gl.useProgram(this.basicShaderProgram);

    // Set shader matrices to those calculated
    this.gl.uniformMatrix4fv(this.basicShaderProgram.mvMatrixUniform, false, this.mvMatrix);
    this.gl.uniformMatrix4fv(this.basicShaderProgram.pMatrixUniform, false, this.pMatrix);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.triangleVertexPositionBuffer);
    this.gl.vertexAttribPointer(this.basicShaderProgram.vertexPositionAttribute, this.triangleVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.triangleVertexColorBuffer);
    this.gl.vertexAttribPointer(this.basicShaderProgram.vertexColorAttribute, this.triangleVertexColorBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.triangleVertexPositionBuffer.numItems);

    //----------------------------------------------------------------------------------------------
    // Intermediate step: draw textured quad from first FBO to second FBO
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.rttFramebuffer2);
    this.gl.viewport(0, 0, 320, 200);
    this.gl.disable(this.gl.DEPTH_TEST);
    
    // Setup orthographic matrices
    var identityMv = mat4.create();
    var orthoMatrix = mat4.create();
    mat4.ortho(orthoMatrix, 0, 320, 0, 200, -1, 1);
    
    this.gl.useProgram(this.textureShaderProgram);
    
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.rttTexture1);
    this.gl.uniform1i(this.textureShaderProgram.samplerUniform, 0);
    this.gl.uniform1f(this.textureShaderProgram.textureWUniform, 320);
    this.gl.uniform1f(this.textureShaderProgram.textureHUniform, 200);
    this.gl.uniform1f(this.textureShaderProgram.blurAmountUniform, this.blurriness);
    
    this.gl.uniformMatrix4fv(this.textureShaderProgram.mvMatrixUniform, false, identityMv);
    this.gl.uniformMatrix4fv(this.textureShaderProgram.pMatrixUniform, false, orthoMatrix);

    // Draw stuff
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadVerticesBuffer);
    this.gl.vertexAttribPointer(this.textureShaderProgram.vertexPositionAttribute, this.quadVerticesBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadCoordsBuffer);
    this.gl.vertexAttribPointer(this.textureShaderProgram.textureCoordAttribute, this.quadCoordsBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.quadVerticesBuffer.numItems);

    //----------------------------------------------------------------------------------------------
    // draw textured quad from second FBO to screen
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0, 0, this.mainCanvas.width, this.mainCanvas.height);
    
    // Setup orthographic matrices
    mat4.identity(orthoMatrix);
    mat4.ortho(orthoMatrix, 0, 320, 0, 200, -1, 1);
    
    //this.gl.useProgram(this.crtShaderProgram);
	
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.rttTexture2);
    //this.gl.uniform1i(this.crtShaderProgram.scanlinesUniform, this.mainCanvas.height / 2.5);
	this.gl.uniform1i(this.crtShaderProgram.scanlinesUniform, 200);
    this.gl.uniform1f(this.crtShaderProgram.barrelUniform, 0.0);
    
    this.gl.uniformMatrix4fv(this.crtShaderProgram.pMatrixUniform, false, orthoMatrix);

    // Draw stuff
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadVerticesBuffer);
    this.gl.vertexAttribPointer(this.crtShaderProgram.vertexPositionAttribute, this.quadVerticesBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadCoordsBuffer);
    this.gl.vertexAttribPointer(this.crtShaderProgram.textureCoordAttribute, this.quadCoordsBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.quadVerticesBuffer.numItems);
    
}

webGLApp.prototype.animate = function()
{
    var timeNow = new Date().getTime();
    if (this.timer.lastTime != 0)
    {
        var elapsed = timeNow - this.timer.lastTime;
    }
    
    // Update stuff based on timers and keys
    this.angle += 180.0 * 0.001;
    
    if ((this.gameKeyPressed[37] === true) && (this.gameKeyPressed[39] !== true)) // left
    {
//        this.angle += elapsed * 60.0 * 0.001;
        this.blurShiftX -= elapsed * 4.0 * 0.001;
        if (this.blurShiftX <= -5)
            this.blurShiftX = -5;
    }
    else if ((this.gameKeyPressed[39] === true) && (this.gameKeyPressed[37] !== true)) // right
    {
//        this.angle -= elapsed * 60.0 * 0.001;
        this.blurShiftX += elapsed * 4.0 * 0.001;
        if (this.blurShiftX >= 5)
            this.blurShiftX = 5;
    }
    
    if ((this.gameKeyPressed[38] === true) && (this.gameKeyPressed[40] !== true)) // up
    {
//        this.blurriness += elapsed * 0.001;
//        if (this.blurriness >= 1.5)
//            this.blurriness = 1.5;
        this.blurShiftY += elapsed * 4.0 * 0.001;
        if (this.blurShiftY >= 5)
            this.blurShiftY = 5;
    }
    else if ((this.gameKeyPressed[40] === true) && (this.gameKeyPressed[38] !== true)) // down
    {
//        this.blurriness -= elapsed * 0.001;
//        if (this.blurriness <= 0.0)
//            this.blurriness = 0.0;
        this.blurShiftY -= elapsed * 4.0 * 0.001;
        if (this.blurShiftY <= -5)
            this.blurShiftY = -5;
    }

    this.timer.lastTime = timeNow;
}

webGLApp.prototype.tick = function(timestamp)
{
    this.drawScene();
    this.animate();

    // bind .tick() with the appropriate execution context
    requestAnimationFrame(this.tick.bind(this));
}
