/**
* @module vd.entity
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity', function (exports, require) {

    var entityBase = require("vd.entity.base");
    var util = require("vd.util.Utils");

    /**
    * @constructor
    * @classdesc Navaid, e.g. NDB, TACAN, VOR. 
    * @param {Object} navaidProperties
    * @param {vd.entity.NavaidSettings} [navaidSettings]
    * @extends vd.entity.module:base.BaseEntityModelOnMap
    * @author KWB
    * @since 0.8, starting with 0.8 FSX support
    */
    exports.Flight = function (navaidProperties, navaidSettings) {

        // see http://stackoverflow.com/questions/2107556/how-to-inherit-from-a-class-in-javascript/2107586#2107586
        // after this, the subclasses are "merged" into flight
        vd.entity.base.BaseEntityModelOnMap.call(this, navaidProperties);

        /**
        * Entity Navaid
        * @const
        * @type {String}
        */
        this.entity = "Navaid"; // "class", simplifies debugging
        /**
        * Specific type (VOR, ..)
        * @const
        * @type {String}
        */
        this.type = navaidProperties["type"].toUpperCase();
        /**
        * Descriptive name
        * @const
        * @type {String}
        */
        this.name = navaidProperties["name"];
        /**
        * Settings for a Navaid
        * @type {vd.entity.NavaidSettings}
        */
        this.navaidSettings = Object.ifNotNullOrUndefined(navaidSettings, globals.navaidSettings);
        /**
        * Corresponding Navaid image.
        * @type {HTMLDOMElement}
        * @private
        */
        this._img = null;

        // image
        this._setImage();
    };

    /**
    * Destructor, removing memory leak sensitive parts will go here
    * or method will be overridden by subclass.
    */
    exports.Flight.prototype.dispose = function () {
        if (this.disposed) return;
        this.display(false, false, false, true);
        if (!Object.isNullOrUndefined(this._img)) {
            this._img.onmouseover = null;
            this._img.onmouseout = null;
        }
        this.dispose$BaseEntityModelOnMap();
    };

    /**
    * Adjust the image.
    * @private
    */
    exports.Flight.prototype._setImage = function () {
        var me = this;
        if (Object.isNullOrUndefined(this._img)) this._img = document.createElement('img');
        this._img.src = this._typeToImage();
        this._img.alt = this.toString();
        this._img.id = this.entity + "_" + this.objectId;
        this._img.width = globals.navaidImageWidth;
        this._img.height = globals.navaidImageHeight;
        this._img.style.visibility = true;
        this._img.onmouseover = function () { me._imageMouseover(); };
        this._img.onmouseout = function () { me._imgMouseout(); }; // creates flickering in some browser, disable in such a case
    };

    /**
    * Image name based on type.
    * @private
    * @return {String} image
    */
    exports.Flight.prototype._typeToImage = function () {
        var img = "images/";
        if (this.type === "VOR")
            img += "VOR.png";
        else if (this.type === "NDB")
            img += "VOR.png";
        else if (this.type === "VORDME")
            img += "VORDME.png";
        else if (this.type === "VORTAC")
            img += "VORDME.png";
        else
            throw "Missing image for " + this.type;
        return img;
    };

    /**
    * Mouse over image.
    * @private
    */
    exports.Flight.prototype._imageMouseover = function () {
        if (this.disposed) return; // no longer valid
        if (!Object.isNullOrUndefined(this._navaidSettings)) return; // already in this mode
        this._navaidSettings = this.navaidSettings;
        this.navaidSettings = this.navaidSettings.clone().displayAll();
        this._draw(true);

        // if the mouse out event is not available, make sure the details disappear some time later
        // also set a timeout in case the mouseout event fails
        var me = this;
        var timeout = globals.flightMouseoverTimeout;
        if (!Object.isNullOrUndefined(this._img) && Object.isNullOrUndefined(this._img.onmouseout)) timeout = timeout * 3; // in case of failing mouseout
        setTimeout(function () { me._imgMouseout(); }, timeout);
    };

    /**
    * Reset the mouse over effect, timeout based since onmouseout did not work reliable.
    * @private
    */
    exports.Flight.prototype._imgMouseout = function () {
        if (this.disposed) return; // no longer valid
        if (Object.isNullOrUndefined(this._navaidSettings)) return; // nothing to reset
        this.navaidSettings = this._navaidSettings;
        this._navaidSettings = null;
        this._draw(true);
    };

    /**
    * Display on map.
    * @param {Boolean} display
    * @param {Boolean} center Center on the map
    * @param {Boolean} [forceRedraw] redraw, e.g. because settings changed
    * @param {Boolean} [dispose] disposing, hide in any case
    */
    exports.Flight.prototype.display = function (display, center, forceRedraw, dispose) {
        dispose = Object.ifNotNullOrUndefined(dispose, false);

        // display checks
        if (dispose) {
            display = false; // force disappearing
        } else if (this.isFollowed()) {
            display = true;
        } else {
            display = display && this.navaidSettings.display; // hide anyway?
            display = display && this.displayedAtZoomLevel(); // too small to be displayed?
        }
        // display
        if (display) this._draw(forceRedraw);
        this.overlays.display(display);
        this._img.style.visibility = display; // force image to disappear
        if (center && display) globals.map.setCenter(this.latLng());
        this.displayed = display && this._drawn;
    };

    /**
    * Display this entity at the current map zoom level.
    * @return {Boolean}
    */
    exports.Flight.prototype.displayedAtZoomLevel = function () {
        return globals.map.getZoom() > globals.navaidHideZoomLevel;
    };

    /**
    * To an object containing the properties.
    * @return {Array} with property / value pairs
    */
    exports.Flight.prototype.toPropertyValue = function () {
        var pv = this.toPropertyValue$BaseEntityModelOnMap();
        pv["grounded"] = this.isGrounded();
        pv["helicopter"] = this.isHelicopter();
        return pv;
    };

    /**
    * Draw the entity.
    * @private
    * @param {Boolean} [forceRedraw]
    */
    exports.Flight.prototype._draw = function (forceRedraw) {
        if (!forceRedraw && this._drawn) return;
        var latlng = this.latLng();

        // clean up
        if (!Object.isNullOrUndefined(this.overlays) && !this.overlays.isEmpty()) {
            this.overlays.clear();
        }

        // build the plane icon
        // view-source:http://google-maps-utility-library-v3.googlecode.com/svn/tags/infobox/1.1.7/examples/infobox-basic.html
        this._setImage();
        var planeImageLabelBoxStyle = (!globals.styles.flightLabelBackgroundIfFollowedTransparent && this.isFollowed()) ? {
            background: globals.styles.flightLabelBackgroundIfFollowed,
            opacity: globals.styles.flightLabelOpacity
        } :
        // Show if in filter, but filter is not active
        // When filtered, only the selected flights are visible, so no need to highlight them
            (!globals.filtered && !globals.styles.flightLabelBackgroundIfFilteredTransparent && this.isInFilter()) ? {
                background: globals.styles.flightLabelBackgroundIfFiltered,
                opacity: globals.styles.flightLabelOpacity
            } : null;

        // IE issue, img.width/height might be 0
        var imgOffsetW = this._img.width == 0 ? globals.navaidImageWidth : this._img.width;
        var imgOffsetH = this._img.height == 0 ? globals.navaidImageHeight : this._img.height;

        var planeImageLabelOptions = {
            content: this._img,
            disableAutoPan: true,
            boxStyle: planeImageLabelBoxStyle,
            pixelOffset: new google.maps.Size(-imgOffsetW / 2, -imgOffsetH / 2),
            closeBoxURL: "",
            position: latlng,
            zIndex: 100
        };
        var navaidImageLabel = new InfoBox(planeImageLabelOptions);
        this.overlays.add(navaidImageLabel);

        // text label
        if (this.navaidSettings.displayedElements() > 0) {
            var content = this._getContent();
            var textLabelOptions = {
                content: content,
                // style goes to a div element -> see there for documentation
                boxStyle: {
                    border: globals.styles.navaidLabelBorder,
                    padding: globals.styles.navaidLabelPadding,
                    background: globals.styles.navaidLabelBackground,
                    opacity: globals.styles.navaidLabelOpacity,
                    textAlign: globals.styles.navaidLabelTextAlign,
                    fontSize: globals.styles.navaidLabelFontSize,
                    color: globals.styles.navaidLabelFontColor,
                    width: "auto",
                    "white-space": "nowrap",
                    zIndex: this.altitude < 0 ? 100 : this.altitude
                },
                zIndex: this.altitude < 0 ? 100 : this.altitude,
                disableAutoPan: true,
                pixelOffset: new google.maps.Size(0, -imgOffsetH),
                position: latlng,
                closeBoxURL: "",
                isHidden: false,
                pane: "mapPane",
                enableEventPropagation: true
            };
            var textLabel = new InfoBox(textLabelOptions);
            this.overlays.add(textLabel);
        } // text label

        // draw everything before rotating the image
        this.overlays.display(true); // assign map
        if (!this._drawn) navaidImageLabel.draw(); // 1st time force a draw, otherwise rotating the image will fail because an asynchronously drawn object has not all tags in place

        // mark as drawn    
        this._drawn = true;
    };

    /**
    * Build the content string.
    * @private
    * @return {String}
    */
    exports.Flight.prototype._getContent = function () {
        var c = (this.navaidSettings.displayCallsign) ? this.callsign : "";
        if (this.navaidSettings.displayName && !String.isNullOrEmpty(this.name)) c = c.appendIfThisIsNotEmpty(" ") + this.name;
        if (this.navaidSettings.displayFrequency && this.frequency > 100) c += " " + this.frequency + "MHz";
        if (this.navaidSettings.displayId && !String.isNullOrEmpty(this.id)) c = c.appendIfThisIsNotEmpty("<br>") + this.id;
        return vd.util.UtilsWeb.spaceToNbsp(c);
    };

    /**
    * String representation.
    * @return {String}
    */
    exports.Flight.prototype.toString = function () {
        var s = this.toString$BaseEntityModelOnMap();
        return s;
    };

    // Inheritance must be last!
    util.inheritPrototypes(exports.Flight, entityBase.BaseEntityModelOnMap, "BaseEntityModelOnMap");
});