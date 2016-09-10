"use strict";
var AppMgr = function () {

	this.startFunc = function() {};
	this.tickFunc = function() {};

	this.setStartFunc = function(startFunction) {
		this.startFunc = startFunction;
	};

	this.setTickFunc = function(tickFunction) {
		this.tickFunc = tickFunction;
	};

	// Global timer --------------------
	this.timer = {
		lastTime: 0
	};

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
