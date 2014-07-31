var FontMgr = function () {
    this.setup();
};

FontMgr.prototype.setup = function () {

    // load file, manage in callback
    $.get("fonts/nokia8xml.fnt",
        function(data) {
            xmlContent = data;

            var xmlParse = $.parseXML(xmlContent);
        }.bind(this),
        "text"
    );
    
};
