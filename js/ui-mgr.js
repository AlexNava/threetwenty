var UiMgr = function(glMgrObject, inputMgrObject, fontMgrObject) {
	this.controlType = {
		INVALID: -1,
		AREA: 0,         // Generic control with all callbacks
		BUTTON: 1,       // Pushbutton. TODO check if it can be used for fullscreen
		CHECKBOX: 2,     // Pushbutton with an ON/OFF state
		RADIOBUTTON: 3,  // tbd
		TEXTINPUT: 4     // Textual input. TODO: use html control for mobile compatibility
	};

	this.UiControl = {
		type:    this.controlType.INVALID,
		x:       0,
		y:       0,
		width:   0,
		height:  0,
		onClick: null,
		onDrag:  null
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

UiMgr.prototype.addControl = function(alias, control) {
	if ((control.type < this.controlType.AREA) || (control.type > this.controlType.TEXTINPUT)) {
		return;
	}
	
	control.alias = alias;
	this.controls.push(control);
}

UiMgr.prototype.drawControls = function() {
	// 
}

UiMgr.prototype.findControlXY = function(x, y) {
	for (var i = this.controls.length - 1; i >= 0; --i) {
		if ((this.controls[i].type !== this.controlType.INVALID) && (x >= this.controls[i].x) && (y >= this.controls[i].y)
		&& (x < this.controls[i].x + this.controls[i].width) && (y < this.controls[i].y + this.controls[i].height)) {
			return this.controls[i];
		}
	}
	return null;
}

UiMgr.prototype.checkUI = function() {
	// obtain UI element under cursor
	var target = this.findControlXY(this.inputMgr.pointer.pixelX, this.inputMgr.pointer.pixelY);
	if (target === null)
		return;

	var pointerEvent = this.inputMgr.checkPointerEvents();
	
	switch(pointerEvent.type) {
	case this.inputMgr.pointerEvent.NONE:
	default:
		return;
	case this.inputMgr.pointerEvent.CLIC_START:
		if ((target.onDrag !== undefined) && (target.onDrag !== null))
			target.onDrag(0, 0);
		break;
	case this.inputMgr.pointerEvent.CLIC:
		if ((target.onClick !== undefined) && (target.onClick !== null))
			target.onClick();
		break;
	case this.inputMgr.pointerEvent.DRAG:
		if ((target.onDrag !== undefined) && (target.onDrag !== null))
			target.onDrag(pointerEvent.x, pointerEvent.y);
		break;
	}
};