var UiMgr = function(glMgrObject, inputMgrObject, fontMgrObject) {
	this.glMgr = glMgrObject;
	this.inputMgr = inputMgrObject;
	this.fontMgr = fontMgrObject;
}

// pages with controls
// page methods: onEntry (construction, elements initialization); tick (animation)
// provide methods to create controls
// make it mobile friendly so no crazy keyboard handlers for text input, try to use html5 controls (maybe hidden)
//
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes