var startFunc = function () {
    var goFullscreen = function() {
        var elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        }
    };
    
    window.addEventListener("click", goFullscreen);

    initTextures();
    initShaders();
};

initTextures = function() {
    app.loadTexture("terrainTiles", "images/terraintiles64.png");
};

initShaders = function() {
    // CRT
    app.loadShaderFiles("CRT", "shaders/crtVs.c", "shaders/crtFs.c", function() {
        app.shaderAttributeArrays("CRT", ["aVertexPosition", "aTextureCoord"]);
        app.shaderUniforms("CRT", ["uPMatrix", "uSampler", "uScanlines", "uBarrelDistortion"]);
    });
};

var displayFunc = function(elapsed) {
    animateFun(elapsed);

    // draw scene on 1st FBO
    app.gl.bindFramebuffer(app.gl.FRAMEBUFFER, app.rttFramebuffer1);
    app.gl.viewport(0, 0, app.xResolution, app.yResolution);
    //app.gl.enable(app.gl.DEPTH_TEST);

    app.gl.clearColor(0.5, 0.5, 0.5, 1.0);
    app.gl.clear(app.gl.COLOR_BUFFER_BIT | app.gl.DEPTH_BUFFER_BIT);

    app.gl.disable(app.gl.DEPTH_TEST);

    app.gl.enable(app.gl.BLEND);
    app.gl.blendFunc(app.gl.SRC_ALPHA, app.gl.ONE_MINUS_SRC_ALPHA);

    font.drawTextXy("Go fullscreen",
                    100, 100, "nokia");
    font.drawTextXy("Canvas size: " + app.mainCanvas.width + "x" + app.mainCanvas.height,
                    0, 0, "nokia");    
    font.drawTextXy("Document body size: " + document.body.clientWidth + "x" + document.body.clientHeight,
                    0, 10, "nokia");    
    //----------------------------------------------------------------------------------------------
    // draw textured quad from first FBO to screen
    app.gl.bindFramebuffer(app.gl.FRAMEBUFFER, null);
    app.gl.viewport(0, 0, app.mainCanvas.width, app.mainCanvas.height);
    
    app.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    app.gl.clear(app.gl.COLOR_BUFFER_BIT);

    app.gl.activeTexture(app.gl.TEXTURE0);
    app.gl.bindTexture(app.gl.TEXTURE_2D, app.rttTexture1);

    if (app.shaders["CRT"] !== undefined) {
        app.gl.useProgram(app.shaders["CRT"]); // check for loading if source is in external files!        
        app.gl.uniform1i(app.shaders["CRT"].uScanlines, app.yResolution * 2);
        app.gl.uniform1f(app.shaders["CRT"].uBarrelDistortion, 1.25);
        app.gl.uniformMatrix4fv(app.shaders["CRT"].uPMatrix, false, app.orthoProjMatrix);
    }
    else {
        app.gl.useProgram(app.shaders["texture"]);        
        app.gl.uniformMatrix4fv(app.shaders["texture"].uPMatrix, false, app.orthoProjMatrix);
    }

    // Draw stuff
    if (app.shaders["CRT"] !== undefined) {
        app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenVertexBuffer);
        app.gl.vertexAttribPointer(app.shaders["CRT"].aVertexPosition, app.screenVertexBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
        app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenCoordBuffer);
        app.gl.vertexAttribPointer(app.shaders["CRT"].aTextureCoord, app.screenCoordBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
    } else {
        app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenVertexBuffer);
        app.gl.vertexAttribPointer(app.shaders["texture"].aVertexPosition, app.screenVertexBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
        app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.screenCoordBuffer);
        app.gl.vertexAttribPointer(app.shaders["texture"].aTextureCoord, app.screenCoordBuffer.itemSize, app.gl.FLOAT, false, 0, 0);
    }
    app.gl.drawArrays(app.gl.TRIANGLE_STRIP, 0, app.screenVertexBuffer.numItems);
};

var animateFun = function (elapsed) {

    //input.pollTouchGestures();
};

var app = new WebGlMgr();
app.init("MainCanvas", 320, 240);
app.setStartFunc(startFunc);
app.setDisplayFunc(displayFunc);
window.addEventListener("resize", app.checkResize.bind(app));

//var input = new InputMgr();

var font = new FontMgr(app);
font.loadFontFiles("nokia", "fonts/nokia8xml.fnt", "fonts/nokia8xml_0.png");

app.start();
