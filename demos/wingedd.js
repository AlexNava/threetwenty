var startFunc = function () {
	wgl.checkResize();
	wgl.createFrameBuffer('mainFB');
	initTextures();
	initShaders();
    
    sprite.loadSpriteFiles("emi", "walk", "emi/emi_walk.json", "emi/emi_walk.png");
    sprite.loadSpriteFiles("fio", "walk", "fio/fio_walk.json", "fio/fio_walk.png");
    sprite.loadSpriteFiles("obstacles", "none", "obstacles/obstacles.json", "obstacles/obstacles.png");
};

initTextures = function() {
/*
	wgl.loadTexture("bezel", "shaders/crt_images/bezel.png");
	wgl.loadTexture("glow", "shaders/crt_images/glow.png");
*/
//	wgl.loadTexture("mouse", "images/pointer.png");
//	input.setPointer("mouse", 0, 0, 8, 8, 0, 7);

    wgl.loadTexture("ground", "bg/ground.png");

};

initShaders = function() {
/*
	// CRT
	wgl.loadShaderFiles("CRT", "shaders/crtVs.c", "shaders/crtFs.c", function() {
		wgl.shaderAttributeArrays("CRT", ["aVertexPosition", "aTextureCoord"]);
		wgl.shaderUniforms("CRT", ["uPMatrix", "uSampler", "uScanlines", "uBarrelDistortion", "uVignette", "uSampler", "uBezelSampler", "uGlowSampler", "uPhosphorSampler"]);
	});
*/
};

var displayFunc = function(elapsed) {
	animateFun(elapsed);
/*
	// draw scene on 1st FBO
	wgl.useFrameBuffer('macheoh');
	wgl.gl.viewport(0, 0, wgl.xResolution, wgl.yResolution);
	//wgl.gl.enable(wgl.gl.DEPTH_TEST);

	wgl.gl.clearColor(0.5, 0.5, 0.5, 1.0);
	wgl.gl.clear(wgl.gl.COLOR_BUFFER_BIT | wgl.gl.DEPTH_BUFFER_BIT);

	wgl.gl.disable(wgl.gl.DEPTH_TEST);

	wgl.gl.enable(wgl.gl.BLEND);
	wgl.gl.blendFunc(wgl.gl.SRC_ALPHA, wgl.gl.ONE_MINUS_SRC_ALPHA);

	font.setAlignment("CENTER");
	if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
		font.drawTextXy("Go fullscreen",
		                160, 100, "nokia");
	}
	else {
		font.drawTextXy("Canvas is fullscreen",
		                160, 100, "nokia");
	}

	font.setAlignment("LEFT");
	font.drawTextXy("Canvas size: " + wgl.mainCanvas.width + "x" + wgl.mainCanvas.height,
	                0, 0, "nokia");
	font.drawTextXy("Document body size: " + document.body.clientWidth + "x" + document.body.clientHeight,
	                0, 10, "nokia");
	
	input.drawPointer();

	//----------------------------------------------------------------------------------------------
	// draw textured quad from first FBO to screen
	wgl.useFrameBuffer(null);
	wgl.gl.viewport(0, 0, wgl.mainCanvas.width, wgl.mainCanvas.height);

	wgl.gl.clearColor(0.0, 0.0, 0.0, 1.0);
	wgl.gl.clear(wgl.gl.COLOR_BUFFER_BIT);

	wgl.useTextureFromFrameBuffer('macheoh');
	wgl.useTexture('bezel', 1);
	wgl.useTexture('glow', 2);

	if (wgl.shaders["CRT"] !== undefined) {
		wgl.gl.useProgram(wgl.shaders["CRT"]); // check for loading if source is in external files!        
		wgl.gl.uniform1i(wgl.shaders["CRT"].uScanlines, wgl.yResolution);
		wgl.gl.uniform1f(wgl.shaders["CRT"].uBarrelDistortion, 0.15);
		wgl.gl.uniform1f(wgl.shaders["CRT"].uVignette, 10.0);
		wgl.gl.uniform1i(wgl.shaders["CRT"].uSampler, 0);
		wgl.gl.uniform1i(wgl.shaders["CRT"].uBezelSampler, 1);
		wgl.gl.uniform1i(wgl.shaders["CRT"].uGlowSampler, 2);

		wgl.gl.uniformMatrix4fv(wgl.shaders["CRT"].uPMatrix, false, wgl.orthoProjMatrix);
	}
	else {
		wgl.gl.useProgram(wgl.shaders["texture"]);        
		wgl.gl.uniformMatrix4fv(wgl.shaders["texture"].uPMatrix, false, wgl.orthoProjMatrix);
	}
*/
	// draw scene on 1st FBO
	wgl.useFrameBuffer('mainFB');
	wgl.gl.viewport(0, 0, wgl.xResolution, wgl.yResolution);

	wgl.gl.clearColor(0.33, 0.65, 0.95, 1.0);
	wgl.gl.clear(wgl.gl.COLOR_BUFFER_BIT | wgl.gl.DEPTH_BUFFER_BIT);

	wgl.gl.disable(wgl.gl.DEPTH_TEST);

	wgl.gl.enable(wgl.gl.BLEND);
	wgl.gl.blendFunc(wgl.gl.SRC_ALPHA, wgl.gl.ONE_MINUS_SRC_ALPHA);
/*
    font.setAlignment('LEFT');
    font.setColor(0.2, 0.2, 0.2, 1);
    font.drawTextXy('Time  ' + totalTime, 10, 220, 'nokia');
    font.drawTextXy('Frame ' + cnt,       10, 210, 'nokia');
    font.drawTextXy('Speed ' + speed,     10, 200, 'nokia');
    font.drawTextXy('Dist. ' + distance,  10, 190, 'nokia');
    font.drawTextXy('Vert. ' + vertSpeed, 10, 180, 'nokia');
    font.drawTextXy('Alt.  ' + altitude,  10, 170, 'nokia');
*/
    //font.drawTextXy('Cactus ' + Math.floor(x[1] + (obstacleX[0] - distance) * 40),  10, 170, 'nokia');
    var groundOffset = Math.floor(-distance * 40) % 128;
	wgl.rect2DColor(1, 1, 1, 1);
    wgl.useTexture("ground");
    wgl.gl.texParameteri(wgl.gl.TEXTURE_2D, wgl.gl.TEXTURE_WRAP_S, wgl.gl.REPEAT);
    wgl.gl.texParameteri(wgl.gl.TEXTURE_2D, wgl.gl.TEXTURE_WRAP_T, wgl.gl.REPEAT);
    wgl.texturedRect2D(groundOffset, 0, 512, 64,
                       0, 0, 512, 64, 0);
    
    sprite.setColor(1, 1, 1, 1);
    sprite.setScale(1);
    sprite.drawSprite(Math.floor(x[0]), 40 + Math.floor(altitude[0] * 50), "emi", "walk", cnt[0]);
    sprite.drawSprite(Math.floor(x[1]), 40 + Math.floor(altitude[1] * 50), "fio", "walk", cnt[1]);
    
    sprite.drawSprite(Math.floor(x[1] + (obstacleX[0] - distance) * 40), 40, "obstacles", "none", 0);
    
    // draw textured quad from first FBO to screen
	wgl.useFrameBuffer(null);
	wgl.gl.viewport(0, 0, wgl.mainCanvas.width, wgl.mainCanvas.height);

	wgl.gl.clearColor(0.0, 0.0, 0.0, 1.0);
	wgl.gl.clear(wgl.gl.COLOR_BUFFER_BIT);

	wgl.useTextureFromFrameBuffer('mainFB');

    if (wgl.shaders["CRT"] !== undefined) {
		wgl.fullscreenRectangle("CRT");
	}
	else {
		wgl.gl.useProgram(wgl.shaders["texture"]);
		wgl.gl.uniformMatrix4fv(wgl.shaders["texture"].uPMatrix, false, wgl.orthoProjMatrix);

        wgl.fullscreenRectangle("texture");
	}
};

var updateObstacle = function(create) {
    if (obstacleX[0] === undefined || obstacleX[0] < (distance) - 1) { // obstacle not on screen
        obstacleX.shift();
        if (create === true) {
            var nextX = distance + wgl.xResolution / 40 + Math.random() * 3;
            obstacleX.push(nextX);
        }
    }
};

var animateFun = function (elapsed) {
	input.pollTouchGestures();
    if (status == 1)
    {
        totalTime = 0;
        speed = 0;
        distance = 0;
        lastStep = 0;
        altitude = [0, 0];
        vertSpeed = [0, 0];
    }
    else if (status == 2)
    {
        updateObstacle(true);
        
        x = [20, -50];
        totalTime += elapsed * 0.001;
        speed = 3;
        distance += elapsed * 0.001 * speed;
        walk(elapsed);
        if (totalTime >= 10)
            ++status; // enter 2nd character
    }
    else if (status == 3)
    {
        updateObstacle(); // no obstacles

        x = [20, -50];
        x[0] += 15 * (totalTime - 10);
        x[1] += 30 * (totalTime - 10);
        totalTime += elapsed * 0.001;
        speed = 3;
        if (totalTime > 20)
            speed += 0.05 * (totalTime - 20);

        distance += elapsed * 0.001 * speed;
        walk(elapsed);

        if (totalTime >= 12)
            ++status; // run as a couple        
    }
    else if (status == 4)
    {
        updateObstacle(true);

        totalTime += elapsed * 0.001;
        speed = 3;
        if (totalTime > 20)
            speed += 0.05 * (totalTime - 20);

        distance += elapsed * 0.001 * speed;
        walk(elapsed);
    }
    

};

var walk = function(elapsed) {
    if ((distance - lastStep) > 0.4) // 6 frames = 2 steps = 2.4m
    {
        lastStep = distance;
        if ((altitude[0] < 0.1) || (cnt[0] != 1 && cnt[0] != 4))
            cnt[0]++;
        if (cnt[0] >= 6)
            cnt[0] = 0;

        if ((altitude[1] < 0.1) || (cnt[1] != 1 && cnt[1] != 4))
            cnt[1]++;
        if (cnt[1] >= 6)
            cnt[1] = 0;
    }

    if (input.keyPressed[input.keyCodes.KEY_J] === true) { // 1st command J
        if ((altitude[0] < 0.5) && (vertSpeed[0] == 0 || vertSpeed[0] > 2))
        {
            if (vertSpeed[0] <= 0)
                cnt[0]++ // do a step when touching the ground
            if (cnt[0] >= 6)
                cnt[0] = 0;
            vertSpeed[0] = 3;
        }
    }
    if (input.keyPressed[input.keyCodes.KEY_F] === true) { // 2nd command F
        if ((altitude[1] < 0.5) && (vertSpeed[1] == 0 || vertSpeed[1] > 2))
        {
            if (vertSpeed[1] <= 0)
                cnt[1]++ // do a step when touching the ground
            if (cnt[1] >= 6)
                cnt[1] = 0;
            vertSpeed[1] = 3;
        }
    }

    vertSpeed[0] -= 9.81 * elapsed * 0.001;
    altitude[0] += vertSpeed[0] * elapsed * 0.001;
    if (altitude[0] < 0)
    {
        altitude[0] = 0;
        vertSpeed[0] = 0;
    }
    vertSpeed[1] -= 9.81 * elapsed * 0.001;
    altitude[1] += vertSpeed[1] * elapsed * 0.001;
    if (altitude[1] < 0)
    {
        altitude[1] = 0;
        vertSpeed[1] = 0;
    }
}

var wgl = new WebGlMgr();
wgl.init("MainCanvas", 320, 240);
wgl.setStartFunc(startFunc);
wgl.setDisplayFunc(displayFunc);
window.addEventListener("resize", wgl.checkResize.bind(wgl));

var input = new InputMgr(wgl);

var font = new FontMgr(wgl);
font.loadFontFiles("nokia", "threetwenty/fonts/nokia8xml.fnt", "threetwenty/fonts/nokia8xml_0.png");

var sprite = new SpriteMgr(wgl);

var app = new AppMgr();
app.setGlMgr(wgl);

var totalTime = 5; // CHEAT
var cnt = [0, 0];
var speed = 0;
var distance = 0; // only 1st player
var lastStep = 0;
var x = [20, -50];
var obstacleX = [0]; // array of items
var altitude = [0, 0];
var vertSpeed = [0, 0];

var status = 2; // 0-select 1-waitPlay 2-play 3-enter 4-double 5-alfa 6-gameover


app.start();
