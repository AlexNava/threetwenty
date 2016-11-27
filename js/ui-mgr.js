ControlType = {
	INVALID: -1,
	AREA: 1,         // Generic control with all callbacks
	BUTTON: 2,       // Pushbutton. TODO check if it can be used for fullscreen
	CHECKBOX: 3,     // Pushbutton with an ON/OFF state
	RADIOBUTTON: 4,  // tbd
	TEXTINPUT: 5     // Textual input. TODO: use html control for mobile compatibility
};

ControlMode = {
	INVALID: -1,
	MENU_UI: 1,
	GAME_UI: 2
}

var UiControl = function() {
	this.type      = ControlType.INVALID;
	this.x         = 0;
	this.y         = 0;
	this.width     = 0;
	this.height    = 0;
	this.onClick   = null;
	this.onDrag    = null;
	this.immediate = false;
};

var UiMgr = function(glMgrObject, inputMgrObject, fontMgrObject) {
	this.glMgr = glMgrObject;
	this.inputMgr = inputMgrObject;
	this.fontMgr = fontMgrObject;

	this.controls = [];
	this.targetControl = null;
	this.mode = ControlMode.MENU_UI;
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
//
// TODO: game controls - multitouch with methods:
// click (endpress)
// press (continuous, even with drag) // x, y
// drag (finger moved)                // xRel, yRel, 
//
// MAYBE LATER. MAYBE.
// pages with controls
// page methods: onEntry (construction, elements initialization); tick (animation)
// provide methods to create controls
// make it mobile friendly so no crazy keyboard handlers for text input, try to use html5 controls (maybe hidden)
//
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes

UiMgr.prototype.setMode = function(newMode) {
	if ((newMode === ControlMode.MENU_UI) || (newMode === ControlMode.GAME_UI)){
		this.mode = newMode;
		// clear commands and actions?
	}
}

UiMgr.prototype.removeControls = function() {
	this.controls = [];
}

UiMgr.prototype.addControl = function(alias, control) {
	if ((control.type < ControlType.AREA) || (control.type > ControlType.TEXTINPUT)) {
		return;
	}

	control.alias = alias;
	this.controls.push(control);
}

UiMgr.prototype.drawControls = function() {
	// 
}

UiMgr.prototype.updateTargetControl = function(x, y) {
	this.targetControl = null;
	for (var i = this.controls.length - 1; i >= 0; --i) {
		if ((this.controls[i].type !== ControlType.INVALID) && (x >= this.controls[i].x) && (y >= this.controls[i].y)
		&& (x < this.controls[i].x + this.controls[i].width) && (y < this.controls[i].y + this.controls[i].height)) {
			this.targetControl = this.controls[i];
			break;
		}
	}
	return this.targetControl;
}

UiMgr.prototype.checkUI = function() {
	if ((this.targetControl === null) || (this.targetControl.immediate === true))
		return;

	var pointerEvent = this.inputMgr.checkPointerEvents();
	
	switch(pointerEvent.type) {
	case this.inputMgr.pointerEvent.NONE:
	default:
		return;
	case this.inputMgr.pointerEvent.CLIC_START:
		if ((this.targetControl.onDrag !== undefined) && (this.targetControl.onDrag !== null))
			this.targetControl.onDrag(0, 0);
		break;
	case this.inputMgr.pointerEvent.CLIC:
		if ((this.targetControl.onClick !== undefined) && (this.targetControl.onClick !== null))
			this.targetControl.onClick();
		break;
	case this.inputMgr.pointerEvent.DRAG:
		if ((this.targetControl.onDrag !== undefined) && (this.targetControl.onDrag !== null))
			this.targetControl.onDrag(pointerEvent.x, pointerEvent.y);
		break;
	}
};