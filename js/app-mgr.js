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
		this.inputMgr.setUi(this.uiMgr);
		
		if ((this.glMgr != null) && (this.glMgr.startFunc != undefined) && (this.glMgr.startFunc != null)) {
			this.glMgr.startFunc();
		}
	};

	this.tickFunc = function(elapsed) {
		if ((this.uiMgr != null) && (this.uiMgr.checkUI != undefined) && (this.uiMgr.checkUI != null)) {
			this.uiMgr.checkUI();
		}
		// todo: handle sounds queue?
		if ((this.glMgr != null) && (this.glMgr.displayFunc != undefined) && (this.glMgr.displayFunc != null)) {
			this.glMgr.displayFunc(elapsed);
		}
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
