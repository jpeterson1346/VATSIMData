/**
* @module vd.entity
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity', function(exports, require) {

    var entityBase = require("vd.entity.base");
    var util = require("vd.util.Utils");

    /**
    * @constructor
    * @classdesc Ground overlay representing a chart etc.
    * @param {Object} [groundOverlayProperties]
    * @param {Object} [groundOverlaySettings]
    * @author KWB
    */
    exports.GroundOverlay = function(groundOverlayProperties, groundOverlaySettings) {

        // inherit attributes
        vd.entity.base.BaseEntityVatsimOnMap.call(this, groundOverlayProperties);

        /**
        * Entity "GroundOverlay".
        * @type {String}
        * @const
        */
        this.entity = "GroundOverlay"; // "class", simplifies debugging
        /**
        * Ground overlay settings.
        * @type {vd.entity.groundOverlaySettings}
        */
        this.groundOverlaySettings = (Object.isNullOrUndefined(groundOverlaySettings)) ? globals.groundOverlaySettings : groundOverlaySettings;
        /**
        * Object id (unique)
        * @type {Number} 
        */
        this.objectId = globals.register(this);
        /**
        * South west coordinates.
        * @type {google.maps.latLng}
        */
        this.sw = Object.ifNotNullOrUndefined(groundOverlayProperties["sw"], null);
        /**
        * North east coordinates.
        * @type {google.maps.latLng}
        */
        this.ne = Object.ifNotNullOrUndefined(groundOverlayProperties["ne"], null);
        /**
        * Overlay (image) url.
        * @type {String}
        */
        this.url = Object.ifNotNullOrUndefined(groundOverlayProperties["url"], null);
        /**
        * Type.
        * @type {String}
        */
        this.type = Object.ifNotNullOrUndefined(groundOverlayProperties["type"], null);
        /**
        * Offset x.
        * @type {Number}
        */
        this.offsetX = Object.ifNotNullOrUndefined(groundOverlayProperties["offsetx"], null);
        /**
        * Offset y.
        * @type {Number}
        */
        this.offsetY = Object.ifNotNullOrUndefined(groundOverlayProperties["offsety"], null);

        // further settings
        this._calculateProperties();
    };

    /**
    * Calculate properties.
    * @return {Boolean} set successful/failed
    * @private
    */
    exports.GroundOverlay.prototype._calculateProperties = function() {
        if (!Object.isNullOrUndefined(this.sw) && !Object.isNullOrUndefined(this.ne)) {
            this.vicinity = new google.maps.LatLngBounds(this.sw, this.ne);
            var c = this.vicinity.getCenter();
            this.latitude = c.lat();
            this.longitude = c.lng();
        }
    };

    /**
    * Set by given XML node.
    * @param  {IXMLDOMNode} node
    * @return {Boolean} set successful/failed
    */
    exports.GroundOverlay.prototype.setFromXmlNode = function(node) {
        if (Object.isNullOrUndefined(node)) return false;
        var value, subNode, lat, lng;
        for (var c = 0, len = node.childNodes.length; c < len; c++) {
            var childNode = node.childNodes[c];
            var property = childNode.tagName;
            if (String.isNullOrEmpty(property)) globals.log.error("Missing property in GroundOverlay node");
            switch (property.toLowerCase()) {
            case "type":
                value = childNode.firstChild.data.trim();
                this.type = value.toUpperCase();
                break;
            case "name":
                value = childNode.firstChild.data.trim();
                this.name = value;
                break;
            case "file":
                value = childNode.firstChild.data.trim();
                this.url = value.startsWith("http") ? value : vd.util.UtilsWeb.replaceCurrentPage("overlays/" + value);
                break;
            case "bounds":
                    // SW
                childNode = childNode.getElementsByTagName("sw")[0];
                subNode = childNode.getElementsByTagName("lat")[0];
                value = subNode.firstChild.data.trim();
                lat = String.toNumber(value, null);
                if (!Object.isNumber(lat)) globals.log.error("Overlay, SW missing latitude value");
                subNode = childNode.getElementsByTagName("lng")[0];
                value = subNode.firstChild.data.trim();
                lng = String.toNumber(value, null);
                if (!Object.isNumber(lat)) globals.log.error("Overlay, SW missing longitude value");
                this.sw = new google.maps.LatLng(lat, lng);

                    // NE
                childNode = node.childNodes[c];
                childNode = childNode.getElementsByTagName("ne")[0];
                subNode = childNode.getElementsByTagName("lat")[0];
                value = subNode.firstChild.data.trim();
                lat = String.toNumber(value, null);
                if (!Object.isNumber(lat)) globals.log.error("Overlay, NE missing latitude value");
                subNode = childNode.getElementsByTagName("lng")[0];
                value = subNode.firstChild.data.trim();
                lng = String.toNumber(value, null);
                if (!Object.isNumber(lat)) globals.log.error("Overlay, NE missing longitude value");
                this.ne = new google.maps.LatLng(lat, lng);
                break;
            case "offsets":
                value = childNode.getElementsByTagName("x")[0].firstChild.data.trim();
                this.offsetX = String.toNumber(value, 0);
                value = childNode.getElementsByTagName("y")[0].firstChild.data.trim();
                this.offsetY = String.toNumber(value, 0);
                break;
            }
        }

        // further settings
        this._calculateProperties();

        // end        
        return true;
    };

    /**
    * String representation.
    * @return {String}
    */
    exports.GroundOverlay.prototype.toString = function() {
        var s = this.toString$BaseEntityVatsimOnMap();
        return s;
    };

    /**
    * Destructor, removing memory leak sensitive parts will go here
    * or method will be overridden by subclass.
    */
    exports.GroundOverlay.prototype.dispose = function() {
        this.display(false, false, false);
        this.dispose$BaseEntityVatsimOnMap();
    };

    /**
    * Display on map.
    * @param {Boolean} display
    * @param {Boolean} center Center on the map
    * @param {Boolean} [forceRedraw] redraw, e.g. because settings changed
    */
    exports.GroundOverlay.prototype.display = function(display, center, forceRedraw) {

        // display checks
        display = display && this.groundOverlaySettings.displayOverlays;
        display = display && (globals.map.getZoom() > globals.groundOverlayHideZoomLevel); // too small to be displayed
        // var isInBounds = this.isInBounds();

        // display    
        if (display) this._draw(forceRedraw);
        this.overlays.display(display);
        if (center && display) globals.map.setCenter(this.latLng());
        this.displayed = display && this._drawn;
    };

    /**
    * Draw the entity.
    * @private
    * @param {Boolean} [forceRedraw]
    */
    exports.GroundOverlay.prototype._draw = function(forceRedraw) {
        if (!forceRedraw && this._drawn) return;

        // clean up
        if (!Object.isNullOrUndefined(this.overlays) && !this.overlays.isEmpty()) {
            this.overlays.clear();
        }
        this.overlays.display(true);

        // mark as drawn    
        this._drawn = true;
    };

    /**
    * Get an array of all names of the provided ground overlays.
    * @param {Array} names of the overlays
    */
    exports.GroundOverlay.names = function(overlays) {
        var names = new Array();
        for (var o = 0, len = overlays.length; o < len; o++) {
            names.push(overlays[o].name);
        }
        return names;
    };

    // Inheritance must be last!
    util.inheritPrototypes(exports.GroundOverlay, entityBase.BaseEntityVatsimOnMap, "BaseEntityVatsimOnMap");
});