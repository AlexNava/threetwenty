var UiMgr = function(glMgrObject, inputMgrObject, fontMgrObject) {
	this.controlType = {
		AREA: 0,         // Generic control with all callbacks
		BUTTON: 1,       // Pushbutton. TODO check if it can be used for fullscreen
		CHECKBOX: 2,     // Pushbutton with an ON/OFF state
		RADIOBUTTON: 3,  // tbd
		TEXTINPUT: 4     // Textual input. TODO: use html control for mobile compatibility
	};

	this.glMgr = glMgrObject;
	this.inputMgr = inputMgrObject;
	this.fontMgr = fontMgrObject;

	this.controls = [];
}

// controls with these methods:
// hover
// pressed
// startPress
// shortPress
// longPress maybe in an unspecified future
// drag
// endDrag
// called by input-mgr

// pages with controls
// page methods: onEntry (construction, elements initialization); tick (animation)
// provide methods to create controls
// make it mobile friendly so no crazy keyboard handlers for text input, try to use html5 controls (maybe hidden)
//
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes

UiMgr.prototype.removeControls = function() {
	this.controls = [];
}

UiMgr.prototype.addControl = function() {
}
