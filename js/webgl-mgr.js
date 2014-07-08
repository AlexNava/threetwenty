var WebGlMgr = function () {

    this.mainCanvas = null;
    this.X_RESOLUTION = 0;
    this.Y_RESOLUTION = 0;

    this.startFunc = function() {};
    this.displayFunc = function() {};

    this.setStartFunc = function(startFunction) {
        this.startFunc = startFunction;
    };

    this.setDisplayFunc = function(displayFunction) {
        this.displayFunc = displayFunction;
    };

    this.tick = function() {
        var timeNow = new Date().getTime();
        var elapsed = 0;

        if (this.timer.lastTime !== 0) {
            elapsed = timeNow - this.timer.lastTime;
        }
        this.timer.lastTime = timeNow;

        this.displayFunc(elapsed);

        requestAnimationFrame(this.tick.bind(this));
    };

    this.start = function() {
        if (this.startFunc !== null) {
            this.startFunc();
        }

        this.tick();
    };

    // Initialization ------------------
    this.init = function (canvasName, hResolution, vResolution) {
        this.X_RESOLUTION = hResolution;
        this.Y_RESOLUTION = vResolution;

        this.mainCanvas = document.getElementById(canvasName);

        try {
            this.initGL(this.mainCanvas);
        } catch (exception) {
            alert('Error while booting WebGL: ' + exception);
        }

        // Builtin framebuffer objects -----
        this.rttFramebuffer1 = null;
        this.rttTexture1 = null;
        this.rttRenderbuffer1 = null;

        this.rttFramebuffer2 = null;
        this.rttTexture2 = null;
        this.rttRenderbuffer2 = null;

        this.triangleVertexPosBuffer = null;
        this.triangleVertexColBuffer = null;
        this.screenVertexBuffer = null;
        this.screenCoordBuffer = null;
        this.basicShaderProgram = null;
        this.textureShaderProgram = null;
        this.crtShaderProgram = null;

        this.initOffscreenBuffers();
        this.initBuffers();
        this.initShaders();
    };

    this.initGL = function() {
        this.gl = this.mainCanvas.getContext("webgl") || this.mainCanvas.getContext("experimental-webgl");
        this.gl.viewportWidth = this.mainCanvas.width;
        this.gl.viewportHeight = this.mainCanvas.height;

        if (!this.gl)
        {
            alert("Could not initialise WebGL, sorry :-(");
        }
    };

    this.initOffscreenBuffers = function() {
        // Two separate FBOs
        this.rttFramebuffer1 = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.rttFramebuffer1);
        this.rttFramebuffer1.width = this.X_RESOLUTION;
        this.rttFramebuffer1.height = this.Y_RESOLUTION;

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
        this.rttFramebuffer2.width = this.X_RESOLUTION;
        this.rttFramebuffer2.height = this.Y_RESOLUTION;

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

    // Shader utils --------------------
    this.shaders = [];
    this.loadShader = function(alias, vertexFile, fragmentFile) {
        var vertexSource = "", fragmentSource = "";

        $.get(vertexFile,
            function(data) {
                vertexSource = data;

                // load fragment source right after vertex source
                $.get(fragmentFile,
                    function(data) {
                        fragmentSource = data;

                        sourcesLoaded();
                    },
                    "text"
                );
            },
            "text"
        );

        var sourcesLoaded = function() {
            //alert("all loaded");
        }

    }

    // Texture utils -------------------
    this.textures = [];
    this.loadTexture = function(alias, fileName) {
        var tempTexture = this.gl.createTexture();
        var tempImage = new Image();
        var WebGlMgrContext = this;
        tempImage.onload = function() {
            WebGlMgrContext.textureLoadHandler(alias, tempImage, tempTexture);
        }
        tempImage.src = fileName;
    };

    this.textureLoadHandler = function(alias, image, texture) {
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        this.textures[alias] = texture;
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    };

    this.useTexture = function(alias, textureUnit) {
        if (textureUnit == undefined){
            textureUnit = 0;
        }
        this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[alias]);
    };

    // global timer
    this.timer = {
        lastTime: 0
    };
};

WebGlMgr.prototype.initBuffers = function() {
    // Init matrices
    this.mvMatrix = mat4.create();
    this.pMatrix = mat4.create();

    // Init triangle buffer
    this.triangleVertexPosBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.triangleVertexPosBuffer);
    var vertices = [
         0.0,  1.0, 0.0, 1.0,
        -0.87, -0.5, 0.0, 1.0,
         0.87, -0.5, 0.0, 1.0
    ];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
    this.triangleVertexPosBuffer.itemSize = 4;
    this.triangleVertexPosBuffer.numItems = 3;

    this.triangleVertexColBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.triangleVertexColBuffer);
    var colors = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0
    ];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
    this.triangleVertexColBuffer.itemSize = 4;
    this.triangleVertexColBuffer.numItems = 3;

    // Init generic textured quad buffer
    this.quadVertexPosBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadVertexPosBuffer);
    var quadVertices = [
        -0.5, -0.5, 0.0, 1.0,
        -0.5, 0.5, 0.0, 1.0,
        0.5, -0.5, 0.0, 1.0,
        0.5, 0.5, 0.0, 1.0
    ];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(quadVertices), this.gl.STATIC_DRAW);
    this.quadVertexPosBuffer.itemSize = 4;
    this.quadVertexPosBuffer.numItems = 4;

    this.quadCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadCoordBuffer);
    var quadCoords = [
        0.0, 0.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0
    ];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(quadCoords), this.gl.STATIC_DRAW);
    this.quadCoordBuffer.itemSize = 2;
    this.quadCoordBuffer.numItems = 4;

    // Init fullscreen quad buffer
    this.screenVertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.screenVertexBuffer);
    var quadVertices = [
        0.0, 0.0, 0.0, 1.0,
        0.0, this.Y_RESOLUTION, 0.0, 1.0,
        this.X_RESOLUTION, 0.0, 0.0, 1.0,
        this.X_RESOLUTION, this.Y_RESOLUTION, 0.0, 1.0
    ];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(quadVertices), this.gl.STATIC_DRAW);
    this.screenVertexBuffer.itemSize = 4;
    this.screenVertexBuffer.numItems = 4;

    this.screenCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.screenCoordBuffer);
    var quadCoords = [
        0.0, 0.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0
    ];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(quadCoords), this.gl.STATIC_DRAW);
    this.screenCoordBuffer.itemSize = 2;
    this.screenCoordBuffer.numItems = 4;
};

WebGlMgr.prototype.initShaders = function() {
    // Init basic shader
    var vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    var fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

    this.gl.shaderSource(vertexShader, BasicVertexShader);
    this.gl.compileShader(vertexShader);
    if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
        alert(this.gl.getShaderInfoLog(vertexShader));
    }

    this.gl.shaderSource(fragmentShader, BasicFragmentShader);
    this.gl.compileShader(fragmentShader);
    if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
        alert(this.gl.getShaderInfoLog(fragmentShader));
    }

    this.basicShaderProgram = this.gl.createProgram();
    this.gl.attachShader(this.basicShaderProgram, vertexShader);
    this.gl.attachShader(this.basicShaderProgram, fragmentShader);
    this.gl.linkProgram(this.basicShaderProgram);

    // Init basic texture shader
    vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

    this.gl.shaderSource(vertexShader, BasicTextureVertexShader);
    this.gl.compileShader(vertexShader);
    if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
        alert(this.gl.getShaderInfoLog(vertexShader));
    }

    this.gl.shaderSource(fragmentShader, BasicTextureFragmentShader);
    this.gl.compileShader(fragmentShader);
    if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
        alert(this.gl.getShaderInfoLog(fragmentShader));
    }

    this.textureShaderProgram = this.gl.createProgram();
    this.gl.attachShader(this.textureShaderProgram, vertexShader);
    this.gl.attachShader(this.textureShaderProgram, fragmentShader);
    this.gl.linkProgram(this.textureShaderProgram);

    // Init blur shader
    vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

    this.gl.shaderSource(vertexShader, BlurVertexShader);
    this.gl.compileShader(vertexShader);
    if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
        alert(this.gl.getShaderInfoLog(vertexShader));
    }

    this.gl.shaderSource(fragmentShader, BlurFragmentShader);
    this.gl.compileShader(fragmentShader);
    if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
        alert(this.gl.getShaderInfoLog(fragmentShader));
    }

    this.blurShaderProgram = this.gl.createProgram();
    this.gl.attachShader(this.blurShaderProgram, vertexShader);
    this.gl.attachShader(this.blurShaderProgram, fragmentShader);
    this.gl.linkProgram(this.blurShaderProgram);

    // Init CRT shader
    vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

    this.gl.shaderSource(vertexShader, CrtVertexShader);
    this.gl.compileShader(vertexShader);
    if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
        alert(this.gl.getShaderInfoLog(vertexShader));
    }

    this.gl.shaderSource(fragmentShader, CrtFragmentShader);
    this.gl.compileShader(fragmentShader);
    if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
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
        || !this.gl.getProgramParameter(this.crtShaderProgram, this.gl.LINK_STATUS)) {
        throw "Could not initialise shaders";
    }

    // Set uniforms and attributes
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
};

