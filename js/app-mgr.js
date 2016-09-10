"use strict";
var AppMgr = function () {

	this.glMgr    = null;
	this.inputMgr = null;
	this.uiMgr    = null;
	this.soundMgr = null;

	this.setGlMgr = function(glMgr) {
		this.glMgr = glMgr;
	};

	this.setInputMgr = function(inputMgr) {
		this.inputMgr = inputMgr;
	};

	this.setUiMgr = function(uiMgr) {
		this.uiMgr = uiMgr;
	};


	// -------
	this.startFunc = function() {
		// todo: init all managers
		if (this.glMgr != null)
			this.glMgr.startFunc();
	};

	this.tickFunc = function(elapsed) {
		// todo: poll input states
		// todo: call ui functions
		// todo: handle sounds queue?
		if (this.glMgr != null)
			this.glMgr.displayFunc(elapsed);
	};

	// Global timer --------------------
	this.timer = {
		lastTime: 0
	};

	// Global tick function
	this.tick = function() {
		var timeNow = new Date().getTime();
		var elapsed = 0;

		if (this.timer.lastTime !== 0) {
			elapsed = timeNow - this.timer.lastTime;
		}
		this.timer.lastTime = timeNow;

		this.tickFunc(elapsed);

		requestAnimationFrame(this.tick.bind(this));
	};

	this.start = function() {
		if (this.startFunc !== null) {
			this.startFunc();
		}

		this.tick();
	};

};
