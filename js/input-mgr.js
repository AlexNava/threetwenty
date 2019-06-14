var InputMgr = function (glMgrObject) {
	this.pointerStatus = {
		NONE:          -1,
		START_PRESS:   1, // as soon as mousedown or touchstart
		PRESS_TIMEOUT: 2, // to prevent dragging afterwards // not used yet
		DRAG:          3  // when dragging, prevents press or longpress afterwards
	};
	
	this.pointerEvent = {
		NONE:          -1,
		CLIC_START:    1, // mouse/touch down
		CLIC:          2, // mouse/touch release
		DRAG:          3, // mouse/touch drag
		DRAG_END:      4  // mouse/touch release after drag
	};

	this.keyCodes = {
        BACKSPACE:   8,
        TAB:         9,
        RETURN:      13,
        SHIFT:       16,
        CTRL:        17,
        ALT:         18,
        SPACE:       32,
        ARROW_LEFT:  37,
        ARROW_UP:    38,
        ARROW_RIGHT: 39,
        ARROW_DOWN:  40,
        KEY_0:       48,
        KEY_1:       49,
        KEY_2:       50,
        KEY_3:       51,
        KEY_4:       52,
        KEY_5:       53,
        KEY_6:       54,
        KEY_7:       55,
        KEY_8:       56,
        KEY_9:       57,
        KEY_A:       65,
        KEY_B:       66,
        KEY_C:       67,
        KEY_D:       68,
        KEY_E:       69,
        KEY_F:       70,
        KEY_G:       71,
        KEY_H:       72,
        KEY_I:       73,
        KEY_J:       74,
        KEY_K:       75,
        KEY_L:       76,
        KEY_M:       77,
        KEY_N:       78,
        KEY_O:       79,
        KEY_P:       80,
        KEY_Q:       81,
        KEY_R:       82,
        KEY_S:       83,
        KEY_T:       84,
        KEY_U:       85,
        KEY_V:       86,
        KEY_W:       87,
        KEY_X:       88,
        KEY_Y:       89,
        KEY_Z:       90,
        NUMPAD_0:    96,
        NUMPAD_1:    97,
        NUMPAD_2:    98,
        NUMPAD_3:    99,
        NUMPAD_4:    100,
        NUMPAD_5:    101,
        NUMPAD_6:    102,
        NUMPAD_7:    103,
        NUMPAD_8:    104,
        NUMPAD_9:    105,
        ALTGR:       225
	};

	this.glMgr = glMgrObject;
	this.uiMgr = null;

	this.setup();
};

InputMgr.prototype.setUi = function (uiMgr) {
	this.uiMgr = uiMgr;
};

InputMgr.prototype.setup = function () {
	this.keyPressed = new Array(0);
	this.touchPoints = new Array(0);
	this.timeoutID = null;
	// mouse or first touch
	this.touchAsPointer = true;
	this.pointerTouch = -1;

	this.updatePointerPixelCoords = function() {
		this.pointer.pixelX = this.glMgr.xResolution * this.pointer.x / document.body.clientWidth;
		this.pointer.pixelY = this.glMgr.yResolution -	this.glMgr.yResolution * this.pointer.y / document.body.clientHeight;
	};
	
	this.pointer = {
		status: this.pointerStatus.NONE,
		x:      0,
		y:      0,
		pixelX: 0,
		pixelY: 0
	};

	this.previousPointer = {
		status: this.pointer.status,
		x:      this.pointer.x,
		y:      this.pointer.y,
		pixelX: this.pointer.pixelX,
		pixelY: this.pointer.pixelY
	};
	
	this.pointerGraphicalInfo = {
		textureName : '',
		left :        0,
		bottom :      0,
		width :       0,
		height :      0,
		originX :     0,
		originY :     0
	};

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
					this.glMgr.xResolution * this.touchPoints[event.changedTouches[i].identifier].currentX / document.body.clientWidth;
				this.touchPoints[event.changedTouches[i].identifier].pixelY = this.glMgr.yResolution -
					this.glMgr.yResolution * this.touchPoints[event.changedTouches[i].identifier].currentY / document.body.clientHeight;
				
				if (this.touchAsPointer === true)
				{
					if (this.pointerTouch === -1)
					{
						this.pointerTouch = event.changedTouches[i].identifier;
						this.pointer.status = this.pointerStatus.START_PRESS;
						this.pointer.pixelX = this.touchPoints[event.changedTouches[i].identifier].pixelX;
						this.pointer.pixelY = this.touchPoints[event.changedTouches[i].identifier].pixelY;
						// Update target on touch start
						this.uiMgr.updateTargetControl(this.pointer.pixelX, this.pointer.pixelY);
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
					this.glMgr.xResolution * this.touchPoints[event.changedTouches[i].identifier].currentX / document.body.clientWidth;
				this.touchPoints[event.changedTouches[i].identifier].pixelY = this.glMgr.yResolution -
					this.glMgr.yResolution * this.touchPoints[event.changedTouches[i].identifier].currentY / document.body.clientHeight;

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
						if ((this.pointer.status === this.pointerStatus.START_PRESS) && (this.uiMgr !== undefined) && (this.uiMgr !== null)) {
							// fire press/click action (is set as immediate)
							if ((this.uiMgr.targetControl != null) && (this.uiMgr.targetControl.immediate === true) && (this.uiMgr.targetControl.onClick != null)) {
								this.uiMgr.targetControl.onClick();
							}
						}
						
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
			//this.pointer.x = event.offsetX;
			//this.pointer.y = event.offsetY;
			//this.updatePointerPixelCoords();
		
			if (event.button != 0) { // main button
				return;
			}

			if (this.pointer.status === this.pointerStatus.NONE) {
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
			this.pointer.x = event.offsetX;
			this.pointer.y = event.offsetY;
			this.updatePointerPixelCoords();

			switch (this.pointer.status) {
			case this.pointerStatus.NONE:
				// move pointer, update target
				this.uiMgr.updateTargetControl(this.pointer.pixelX, this.pointer.pixelY);
				break;
			case this.pointerStatus.START_PRESS:
			case this.pointerStatus.DRAG:
				// drag
				this.pointer.status = this.pointerStatus.DRAG;

				break;
			case this.pointerStatus.PRESS_TIMEOUT:
				// ignore
				break;
			}
		
		}.bind(this),
		false
	);

	window.addEventListener("mouseup",
		function (event) {
			// clear timeout as well
			//this.pointer.x = event.offsetX;
			//this.pointer.y = event.offsetY;
			//this.updatePointerPixelCoords();

			switch (this.pointer.status) {
			case this.pointerStatus.NONE:
				// Should never happen
				break;
			case this.pointerStatus.START_PRESS:
				// fire press/click action (is set as immediate)
				if ((this.uiMgr !== undefined) && (this.uiMgr !== null)) {
					if ((this.uiMgr.targetControl != null) && (this.uiMgr.targetControl.immediate === true) && (this.uiMgr.targetControl.onClick != null)) {
						this.uiMgr.targetControl.onClick();
					}
				}
				break;
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

InputMgr.prototype.checkPointerEvents = function() {
	// Only check pointer status, the hit detection will be made in ui-mgr
	// Here i'll check mouse state compared with its previous state
	var ptrEvent = {
		type: this.pointerEvent.NONE
	};

	//if (this.pointer.status === this.pointerStatus.NONE) {
	//	if (target.hover !== undefined) target.hover();
	//}
	//else {
	//	if (target.pressed !== undefined) target.pressed();
	//}

	if (this.pointer.status !== this.pointerStatus.NONE) {
		var debug = 1;
	}
	
	if ((this.pointer.status === this.pointerStatus.START_PRESS) && (this.previousPointer.status !== this.pointerStatus.START_PRESS)) {
		ptrEvent.type = this.pointerEvent.CLIC_START;
	}
	else if ((this.pointer.status === this.pointerStatus.NONE) && (this.previousPointer.status === this.pointerStatus.START_PRESS)) {
		ptrEvent.type = this.pointerEvent.CLIC;
	}
	else if ((this.pointer.status === this.pointerStatus.DRAG) /*&& ((this.pointer.x !== this.previousPointer.x) || (this.pointer.y !== this.previousPointer.y))*/) {
		ptrEvent.type = this.pointerEvent.DRAG;
		ptrEvent.x = this.pointer.pixelX - this.previousPointer.pixelX;
		ptrEvent.y = this.pointer.pixelY - this.previousPointer.pixelY;
	}
	else if ((this.pointer.status === this.pointerStatus.NONE) && (this.previousPointer.status === this.pointerStatus.DRAG)) {
		ptrEvent.type = this.pointerEvent.DRAG_END;
	}

	this.previousPointer = {
		status: this.pointer.status,
		x:      this.pointer.x,
		y:      this.pointer.y,
		pixelX: this.pointer.pixelX,
		pixelY: this.pointer.pixelY
	};

	return ptrEvent;
};