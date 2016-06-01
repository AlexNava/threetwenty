var UiMgr = function(glMgrObject, inputMgrObject, fontMgrObject) {
	this.glMgr = glMgrObject;
	this.inputMgr = inputMgrObject;
	this.fontMgr = fontMgrObject;
}

// pages with controls
// page methods: onEntry (construction, elements initialization); tick (animation)
//
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes