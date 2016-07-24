var InputMgr = function (glMgrObject) {
	this.pointerStatus = {
		NONE:          0,
		START_PRESS:   1, // as soon as mousedown or touchstart
		PRESS_TIMEOUT: 2, // to prevent dragging afterwards
		DRAG:          3  // when dragging, prevents press or longpress afterwards
	};

	this.glMgr = glMgrObject;
	this.setup();
};

InputMgr.prototype.setup = function () {
	this.keyPressed = new Array(0);
	this.touchPoints = new Array(0);
	this.timeoutID = null;
	// mouse or first touch
	this.touchAsPointer = true;
	this.pointerTouch = -1;
	this.pointer = {
		status: this.pointerStatus.NONE,
		x: 0,
		y: 0
	};
	this.previousPointer = this.pointer;
	this.pointerGraphicalInfo = {
		textureName : '',
		left :        0,
		bottom :      0,
		width :       0,
		height :      0,
		originX :     0,
		originY :     0
	}
	this.gestureLeft = false;
	this.gestureRight = false;
	this.gestureUp = false;
	this.gestureDown = false;

	this.fingersOnScreen = function () {
		var fingersCnt = 0;
		for (var i = 0; i < touchPoints.length; ++i) {
			if (touchPoints[i] != undefined)
				++fingersCnt;
		}
		return fingersCnt;
	};

	window.addEventListener("keydown",
		function (event) {
			this.keyPressed[event.keyCode] = true;
			//console.log("keyboard event: key pressed " + event.keyCode);
		}.bind(this),
		true
	);

	window.addEventListener("keyup",
		function (event) {
			this.keyPressed[event.keyCode] = false;
			//console.log("keyboard event: key pressed " + event.keyCode);
		}.bind(this),
		true
	);

	// Unfortunately, touch events don't have offsetx/y properties relative to a target.
	// Fortunately they will be only used on mobile with a fullscreen canvas
	window.addEventListener("touchstart",
		function (event) {
			event.preventDefault();
			var timeNow = new Date().getTime();
			for (var i = 0; i < event.changedTouches.length; i++) {
				this.touchPoints[event.changedTouches[i].identifier] = {
					startX : event.changedTouches[i].clientX,
					startY : event.changedTouches[i].clientY,
					startTime: timeNow
				};
				this.touchPoints[event.changedTouches[i].identifier].currentX = this.touchPoints[event.changedTouches[i].identifier].startX;
				this.touchPoints[event.changedTouches[i].identifier].currentY = this.touchPoints[event.changedTouches[i].identifier].startY;

				this.touchPoints[event.changedTouches[i].identifier].pixelX =
					app.xResolution * this.touchPoints[event.changedTouches[i].identifier].currentX / document.body.clientWidth;
				this.touchPoints[event.changedTouches[i].identifier].pixelY = app.yResolution -
					app.yResolution * this.touchPoints[event.changedTouches[i].identifier].currentY / document.body.clientHeight;
				
				if (this.touchAsPointer === true)
				{
					if (this.pointerTouch === -1)
					{
						this.pointerTouch = event.changedTouches[i].identifier;
						this.pointer.status = this.pointerStatus.START_PRESS;
						this.pointer.pixelX = this.touchPoints[event.changedTouches[i].identifier].pixelX;
						this.pointer.pixelY = this.touchPoints[event.changedTouches[i].identifier].pixelY;
					}
				}
			}
		}.bind(this),
		false
	);

	window.addEventListener("touchmove",
		function (event) {
			event.preventDefault();
			for (var i = 0; i < event.changedTouches.length; i++) {
				if (this.touchPoints[event.changedTouches[i].identifier].checked === false) {
					this.touchPoints[event.changedTouches[i].identifier].currentX = event.changedTouches[i].clientX;
					this.touchPoints[event.changedTouches[i].identifier].currentY = event.changedTouches[i].clientY;
				} else {
					this.touchPoints[event.changedTouches[i].identifier].lastX = this.touchPoints[event.changedTouches[i].identifier].currentX;
					this.touchPoints[event.changedTouches[i].identifier].lastY = this.touchPoints[event.changedTouches[i].identifier].currentY;
					this.touchPoints[event.changedTouches[i].identifier].currentX = event.changedTouches[i].clientX;
					this.touchPoints[event.changedTouches[i].identifier].currentY = event.changedTouches[i].clientY;
					this.touchPoints[event.changedTouches[i].identifier].checked = false;
				}
				this.touchPoints[event.changedTouches[i].identifier].pixelX =
					app.xResolution * this.touchPoints[event.changedTouches[i].identifier].currentX / document.body.clientWidth;
				this.touchPoints[event.changedTouches[i].identifier].pixelY = app.yResolution -
					app.yResolution * this.touchPoints[event.changedTouches[i].identifier].currentY / document.body.clientHeight;

				if (this.touchAsPointer === true)
				{
					if (this.pointerTouch === event.changedTouches[i].identifier)
					{
						this.pointer.status = this.pointerStatus.DRAG;
						this.pointer.pixelX = this.touchPoints[event.changedTouches[i].identifier].pixelX;
						this.pointer.pixelY = this.touchPoints[event.changedTouches[i].identifier].pixelY;
					}
				}
			}
		}.bind(this),
		false
	);

	window.addEventListener("touchend",
		function (event) {
			event.preventDefault();
			for (var i = 0; i < event.changedTouches.length; i++){
				this.touchPoints[event.changedTouches[i].identifier] = undefined;

				if (this.touchAsPointer === true)
				{
					if (this.pointerTouch === event.changedTouches[i].identifier)
					{
						this.pointerTouch = -1;
						this.pointer.status = this.pointerStatus.NONE;
						//this.pointer.x = this.touchPoints[event.changedTouches[i].identifier].pixelX;
						//this.pointer.y = this.touchPoints[event.changedTouches[i].identifier].pixelY;
					}
				}
			}

		}.bind(this),
		false
	);

	// http://www.html5rocks.com/en/mobile/touchandmouse/
	window.addEventListener("mousedown",
		function (event) {
			// ...
			if (event.button != 0) // main button
				return;
			if (this.pointer.status === this.pointerStatus.NONE)
			{
				// update pointer
				this.pointer.status = this.pointerStatus.START_PRESS;
				// set timeout for longpress (i don't want to care right now)
				//this.timeoutID = window.setTimeout();
			}
		}.bind(this),
		false
	);

	window.addEventListener("mousemove",
		function (event) {
			// clear longpress timeout
			switch (this.pointer.status) {
			case this.pointerStatus.NONE:
				// just move pointer
				this.pointer.x = event.offsetX;
				this.pointer.y = event.offsetY;
				break;
			case this.pointerStatus.START_PRESS:
			case this.pointerStatus.DRAG:
				// drag
				this.pointer.status = this.pointerStatus.DRAG;
				this.pointer.x = event.offsetX;
				this.pointer.y = event.offsetY;
				break;
			case this.pointerStatus.PRESS_TIMEOUT:
				// ignore
				break;
			}
			this.pointer.pixelX = Math.round(app.xResolution * this.pointer.x / document.body.clientWidth);
			this.pointer.pixelY = Math.round(app.yResolution - app.yResolution * this.pointer.y / document.body.clientHeight);
		
		}.bind(this),
		false
	);

	window.addEventListener("mouseup",
		function (event) {
		// clear timeout as well
		// ...
			switch (this.pointer.status) {
			case this.pointerStatus.NONE:
				// Should never happen
				break;
			case this.pointerStatus.START_PRESS:
				// fire press/click action
			case this.pointerStatus.DRAG:
				// end drag
				break;
			case this.pointerStatus.PRESS_TIMEOUT:
				// ignore
				break;
			}
			this.pointer.status = this.pointerStatus.NONE;
		}.bind(this),
		false
	);



	window.addEventListener("focusout",
		function (event) {
			this.keyPressed = new Array(0);
			this.touchPoints = new Array(0);
		}.bind(this),
		false
	);
};

InputMgr.prototype.pollTouchGestures = function() {
	// check motion on 4 directions
	this.gestureLeft = false;
	this.gestureRight = false;
	this.gestureUp = false;
	this.gestureDown = false;
	if (this.touchPoints[0] !== undefined) {
		if (this.touchPoints[0].checked === false) {
			var deltaX = this.touchPoints[0].currentX - this.touchPoints[0].lastX;
			var deltaY = this.touchPoints[0].currentY - this.touchPoints[0].lastY;
			if (deltaX < -2) {
				this.gestureLeft = true;
			}
			if (deltaX > 2) {
				this.gestureRight = true;
			}
			if (deltaY < -2) {
				this.gestureUp = true;
			}
			if (deltaY > 2) {
				this.gestureDown = true;
			}
			this.touchPoints[0].checked = true;
		}
	}
};

InputMgr.prototype.setPointer = function(textureName, left, bottom, width, height, originX, originY) {
	this.pointerGraphicalInfo = {
		textureName : textureName,
		left :        left,
		bottom :      bottom,
		width :       width,
		height :      height,
		originX :     originX,
		originY :     originY
	}
};

InputMgr.prototype.drawPointer = function() {
	this.glMgr.useTexture(this.pointerGraphicalInfo.textureName);
	this.glMgr.texturedRect2D(
		this.pointer.pixelX - this.pointerGraphicalInfo.originX,
		this.pointer.pixelY - this.pointerGraphicalInfo.originY,
		this.pointerGraphicalInfo.width,
		this.pointerGraphicalInfo.height,
		this.pointerGraphicalInfo.left,
		this.pointerGraphicalInfo.bottom,
		this.pointerGraphicalInfo.width,
		this.pointerGraphicalInfo.height
	);
};

InputMgr.prototype.checkUI = function(uiMgr) {
	// obtain UI element under cursor
	var target = null;//uiMgr.findElement(this.pointer.x, this.pointer.y);
	
	// Here i'll check mouse state compared with its previous state and will call the appropriate function on the target

	if (this.pointer.status === this.pointerStatus.NONE) {
		if (target.hover !== undefined) target.hover();
	}
	else {
		if (target.pressed !== undefined) target.pressed();
	}
	if ((this.pointer.status === this.pointerStatus.START_PRESS) && (this.pointer.status !== this.pointerStatus.START_PRESS))
		if (target.startPress !== undefined) target.startPress();
	if ((this.pointer.status === this.pointerStatus.NONE) && (this.pointer.status !== this.pointerStatus.START_PRESS))
		if (target.shortPress !== undefined) target.shortPress();
	if ((this.pointer.status === this.pointerStatus.DRAG) && ((this.pointer.x !== this.previousPointer.x) || (this.pointer.y - this.previousPointer.y)))
		if (target.drag !== undefined) target.drag(this.pointer.x - this.previousPointer.x, this.pointer.y - this.previousPointer.y);
	if ((this.pointer.status === this.pointerStatus.NONE) && (this.pointer.status !== this.pointerStatus.DRAG))
		if (target.endDrag !== undefined) target.endDrag();

	this.previousPointer = this.pointer;
};