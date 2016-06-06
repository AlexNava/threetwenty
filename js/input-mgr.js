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
	this.mouse = null;
	// mouse or first touch
	this.pointer = {
		status: this.pointerStatus.NONE,
		x: 0,
		y: 0
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
			}
		}.bind(this),
		false
	);

	window.addEventListener("touchend",
		function (event) {
			event.preventDefault();
			for (var i = 0; i < event.changedTouches.length; i++){
				this.touchPoints[event.changedTouches[i].identifier] = undefined;
			}
		}.bind(this),
		false
	);

	// http://www.html5rocks.com/en/mobile/touchandmouse/
	window.addEventListener("mousedown",
		function (event) {
			// ...
			if (this.pointer.status === this.pointerStatus.NONE)
			{
				// update pointer
				this.pointer.status = this.pointerStatus.START_PRESS;
				// set timeout for longpress
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
