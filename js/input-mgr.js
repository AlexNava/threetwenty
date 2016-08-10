var InputMgr = function (glMgrObject) {
	this.pointerStatus = {
		NONE:          0,
		START_PRESS:   1, // as soon as mousedown or touchstart
		PRESS_TIMEOUT: 2, // to prevent dragging afterwards // not used yet
		DRAG:          3  // when dragging, prevents press or longpress afterwards
	};
	
	this.pointerEvent = {
		NONE:          0,
		CLIC_START:    1, // mouse/touch down
		CLIC:          2, // mouse/touch release
		DRAG:          3, // mouse/touch drag
		DRAG_END:      4  // mouse/touch release after drag
	};

	this.glMgr = glMgrObject;
	this.uiMgr = null;
	this.targetControl = null;
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
		this.pointer.pixelX = app.xResolution * this.pointer.x / document.body.clientWidth;
		this.pointer.pixelY = app.yResolution -	app.yResolution * this.pointer.y / document.body.clientHeight;
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
			this.pointer.x = event.offsetX;
			this.pointer.y = event.offsetY;
			this.updatePointerPixelCoords();
		
			if (event.button != 0) { // main button
				return;
			}

			if (this.pointer.status === this.pointerStatus.NONE) {
				// update pointer
				this.pointer.status = this.pointerStatus.START_PRESS;
				
				// get actions target from UI mgr
				this.targetControl = this.uiMgr.findControlXY(this.pointer.pixelX, this.pointer.pixelY);
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
				// move pointer and update actions target
				this.targetControl = this.uiMgr.findControlXY(this.pointer.pixelX, this.pointer.pixelY);
				break;
			case this.pointerStatus.START_PRESS:
			case this.pointerStatus.DRAG:
				// drag
				this.pointer.status = this.pointerStatus.DRAG;
				if ((this.targetControl.onDrag !== undefined) && (this.targetControl.onDrag !== null)) {
					this.targetControl.onDrag();
				}

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
		// ...
			this.pointer.x = event.offsetX;
			this.pointer.y = event.offsetY;
			this.updatePointerPixelCoords();

			if ((this.targetControl !== undefined) && (this.targetControl !== null)) {
				switch (this.pointer.status) {
				case this.pointerStatus.NONE:
					// Should never happen
					break;
				case this.pointerStatus.START_PRESS:
					// fire press/click action
					if ((this.targetControl.onClick !== undefined) && (this.targetControl.onClick !== null)) {
						this.targetControl.onClick();
					}
					break;
				case this.pointerStatus.DRAG:
					// end drag
//					if ((this.targetControl.onDrag !== undefined) && (this.targetControl.onDrag !== null)) {
//						this.targetControl.onDrag();
//					}
					break;
				case this.pointerStatus.PRESS_TIMEOUT:
					// ignore
					break;
				}
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