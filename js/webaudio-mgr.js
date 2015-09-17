var SoundLib = function() {
	this.soundBuffers = [];
	this.beatsNumber = 16;
	this.context = null;

	this.setup();

};

    
SoundLib.prototype.setup = function() {
	if (typeof window.AudioContext !== undefined) {
		this.context = new window.AudioContext();
	} else if (typeof window.webkitAudioContext !== undefined) {
		this.context = new window.webkitAudioContext();
	} else {
		throw new Error('AudioContext not supported. :(');
	}
}

SoundLib.prototype.startPlay = function() {

}

SoundLib.prototype.stopPlay = function() {

}

SoundLib.prototype.loadSound = function(soundName, filename) {
	var request = new XMLHttpRequest();
	request.open("GET", filename, true);
	request.responseType = "arraybuffer";

	request.onload = function() {
		this.context.decodeAudioData(
			request.response,
			function(buffer) {
				this.soundBuffers[soundName] = buffer;
			}.bind(this));
	}.bind(this);

	request.send();   
}

SoundLib.prototype.testBuffer = function(buffernames) {
	var undefCnt = 0;
	
	for (var i = 0; i < buffernames.length; i++) {
		if (this.soundBuffers[buffernames[i]] === undefined) undefCnt++;
	}

	if (undefCnt == 0) {
		return true;
	}
	else {
		return false;
	}
}



