var InputMgr = function () {
    this.setup();
};

InputMgr.prototype.setup = function () {
    this.keyPressed = new Array(0);
    this.touchPoints = new Array(0);
    this.gestureLeft = false;
    this.gestureRight = false;
    this.gestureUp = false;
    this.gestureDown = false;

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
