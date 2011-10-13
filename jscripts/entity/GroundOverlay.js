/**
* @module vd.entity
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity', function (exports, require) {

    var entityBase = require("vd.entity.base");
    var util = require("vd.util.Utils");

    /**
    * @constructor
    * @classdesc Ground overlay representing a chart etc.
    * @param {Object} [groundOverlayProperties]
    * @param {Object} [groundOverlaySettings]
    * @author KWB
    * @since 2011-10-10
    */
    exports.GroundOverlay = function (groundOverlayProperties, groundOverlaySettings) {

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
        * South east coordinates.
        * @type {google.maps.latLng}
        */
        this.se = null; // will be calculated
        /**
        * North west coordinates.
        * @type {google.maps.latLng}
        */
        this.nw = null; // will be calculated
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
        this.imageSizeX = Object.ifNotNullOrUndefined(groundOverlayProperties["offsetx"], null);
        /**
        * Offset y.
        * @type {Number}
        */
        this.imageSizeY = Object.ifNotNullOrUndefined(groundOverlayProperties["offsety"], null);
        /**
        * Size of the described bounds area.
        * @type {Number}
        */
        this.imageBoundsSizeX = null;
        /**
        * Size of the described bounds area.
        * @type {Number}
        */
        this.imageBoundsSizeY = null;
        /**
        * Center position offset of the bounds.
        * @type {Number}
        */
        this.boundsCenterPositionX = null; // calculated
        /**
        * Center position offset of the bounds.
        * @type {Number}
        */
        this.boundsCenterPositionY = null; // calculated
        /**
        * Size of the bounds area on the map.
        * This is the x dimension at the current zoom level for the described area.
        * @type {Number}
        */
        this.mapBoundsSizeX = null;
        /**
        * Size of the bounds area on the map.
        * This is the y dimension at the current zoom level for the described area.
        * @type {Number}
        */
        this.mapBoundsSizeY = null;
        /**
        * Horizontal edge.
        * @type {vd.vd.entity.helper.Edge}
        * @private
        */
        this._edgeX = null; // will be calculated
        /**
        * Vertical edge.
        * @type {vd.vd.entity.helper.Edge}
        * @private
        */
        this._edgeY = null; // will be calculated
        /**
        * Corresponding plane image.
        * @type {HTMLDOMElement}
        * @private
        */
        this._img = null;

        // further settings
        this.set(groundOverlayProperties);
    };

    /**
    * Set the properties.
    * @param {Object} groundOverlayProperties
    */
    exports.GroundOverlay.prototype.set = function (groundOverlayProperties) {
        /**
        * South west coordinates.
        * @type {google.maps.latLng}
        */
        this.sw = Object.ifNotNullOrUndefined(groundOverlayProperties["sw"], null);
        /**
        * South west offset.
        * @type {Number}
        */
        this.boundsSwPositionX = String.toNumber(groundOverlayProperties["boundsSwPositionX"], null);
        /**
        * South west offset.
        * @type {Number}
        */
        this.boundsSwPositionY = String.toNumber(groundOverlayProperties["boundsSwPositionY"], null);
        /**
        * North east coordinates.
        * @type {google.maps.latLng}
        */
        this.ne = Object.ifNotNullOrUndefined(groundOverlayProperties["ne"], null);
        /**
        * North east offset.
        * @type {Number}
        */
        this.boundsNePositionX = String.toNumber(groundOverlayProperties["boundsNePositionX"], null);
        /**
        * North east offset.
        * @type {Number}
        */
        this.boundsNePositionY = String.toNumber(groundOverlayProperties["boundsNePositionY"], null);
    };

    /**
    * Calculate properties.
    * @private
    */
    exports.GroundOverlay.prototype._calculateProperties = function () {
        if (!Object.isNullOrUndefined(this.sw) && !Object.isNullOrUndefined(this.ne)) {

            // set the described area as vicinity ("bounds of the overlay")
            this.vicinity = new google.maps.LatLngBounds(this.sw, this.ne);

            // calculate the center of the bounds (not the center of the chart)
            var c = this.vicinity.getCenter();
            this.latitude = c.lat();
            this.longitude = c.lng();
            this.boundsCenterPositionX = (this.boundsSwPositionX + this.boundsNePositionX) / 2;
            this.boundsCenterPositionY = (this.boundsSwPositionY + this.boundsNePositionY) / 2;

            // calculate the missining corners
            this.se = new google.maps.LatLng(this.sw.lat(), this.ne.lng());
            this.nw = new google.maps.LatLng(this.ne.lat(), this.sw.lng());

            // calculate the pixel size of the described area, use edge for this purpose 
            var sw = new vd.entity.base.BaseEntityMap({ latitude: this.sw.lat(), longitude: this.sw.lng(), map: this.map });
            var se = new vd.entity.base.BaseEntityMap({ latitude: this.se.lat(), longitude: this.se.lng(), map: this.map });
            var ne = new vd.entity.base.BaseEntityMap({ latitude: this.ne.lat(), longitude: this.ne.lng(), map: this.map });
            this._edgeX = new vd.entity.helper.Edge({ from: sw, to: se, calculatePixelDistance: true });
            this._edgeY = new vd.entity.helper.Edge({ from: se, to: ne, calculatePixelDistance: true });
            this.mapBoundsSizeX = this._edgeX.pixelDistance;
            this.mapBoundsSizeY = this._edgeY.pixelDistance;

            // the pixel size of image which represent the described bounds
            this.imageBoundsSizeX = Math.abs(this.boundsNePositionX - this.boundsSwPositionX);
            this.imageBoundsSizeY = Math.abs(this.boundsNePositionY - this.boundsSwPositionY);
        }
    };

    /**
    * Set by given XML node.
    * @param  {IXMLDOMNode} node
    * @return {Boolean} set successful/failed
    */
    exports.GroundOverlay.prototype.setFromXmlNode = function (node) {
        if (Object.isNullOrUndefined(node)) return false;
        var value, subNode, lat, lng;
        for (var c = 0, len = node.childNodes.length; c < len; c++) {
            var childNode = node.childNodes[c];
            var property = childNode.tagName;
            if (String.isNullOrEmpty(property)) continue; // Firefox / Chrome check if TextNode
            switch (property.toLowerCase()) {
                case "type":
                    value = childNode.firstChild.data.trim();
                    this.type = value.toUpperCase();
                    break;
                case "name":
                    value = childNode.firstChild.data.trim();
                    this.name = value;
                    break;
                case "image":
                    subNode = childNode.getElementsByTagName("file")[0];
                    value = subNode.firstChild.data.trim();
                    this.url = value.startsWith("http") ? value : vd.util.UtilsWeb.replaceCurrentPage("overlays/" + value);
                    subNode = childNode.getElementsByTagName("size")[0].getElementsByTagName("x")[0];
                    value = subNode.firstChild.data.trim();
                    this.imageSizeX = String.toNumber(value, 0);
                    subNode = childNode.getElementsByTagName("size")[0].getElementsByTagName("y")[0];
                    value = subNode.firstChild.data.trim();
                    this.imageSizeY = String.toNumber(value, 0);
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
                    subNode = childNode.getElementsByTagName("x")[0];
                    value = subNode.firstChild.data.trim();
                    this.boundsSwPositionX = String.toNumber(value, 0);
                    subNode = childNode.getElementsByTagName("y")[0];
                    value = subNode.firstChild.data.trim();
                    this.boundsSwPositionY = String.toNumber(value, 0);

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
                    subNode = childNode.getElementsByTagName("x")[0];
                    value = subNode.firstChild.data.trim();
                    this.boundsNePositionX = String.toNumber(value, 0);
                    subNode = childNode.getElementsByTagName("y")[0];
                    value = subNode.firstChild.data.trim();
                    this.boundsNePositionY = String.toNumber(value, 0);
                    break;
            }
        }

        // end        
        return true;
    };

    /**
    * String representation.
    * @return {String}
    */
    exports.GroundOverlay.prototype.toString = function () {
        var s = this.toString$BaseEntityVatsimOnMap();
        return s;
    };

    /**
    * Destructor, removing memory leak sensitive parts will go here
    * or method will be overridden by subclass.
    */
    exports.GroundOverlay.prototype.dispose = function () {
        this.display(false, false, false);
        this.dispose$BaseEntityVatsimOnMap();
    };

    /**
    * Display on map.
    * @param {Boolean} display
    * @param {Boolean} center Center on the map
    * @param {Boolean} [forceRedraw] redraw, e.g. because settings changed
    */
    exports.GroundOverlay.prototype.display = function (display, center, forceRedraw) {

        // display checks
        center = Object.ifNotNullOrUndefined(center, false);
        forceRedraw = Object.ifNotNullOrUndefined(forceRedraw, forceRedraw);
        display = display && this.groundOverlaySettings.displayOverlays;
        display = display && this.displayedAtZoomLevel(); // too small to be displayed
        var isInBounds = this.isInBounds();
        display = display && (isInBounds || center);

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
    exports.GroundOverlay.prototype._draw = function (forceRedraw) {
        if (!forceRedraw && this._drawn) return;

        // clean up
        if (!Object.isNullOrUndefined(this.overlays) && !this.overlays.isEmpty()) {
            this.overlays.clear();
        }

        // generate map ground overlay
        // Basically I wanted to display this as GM ground overlay http://code.google.com/apis/maps/documentation/javascript/overlays.html#GroundOverlays
        // However, using infobox offers more options

        // recalculate pixel sizes and ratio, it can be changed due to zoom
        this._calculateProperties();
        var imageRatioX = this.mapBoundsSizeX / this.imageBoundsSizeX;
        var imageRatioY = this.mapBoundsSizeY / this.imageBoundsSizeY;
        this._setImage(imageRatioX, imageRatioY);

        var offsetX = -this.boundsCenterPositionX * imageRatioX;
        var offsetY = -this.boundsCenterPositionY * imageRatioY;
        var center = this.latLng();
        var groundOverlayBoxStyle = {
            background: globals.styles.groundOverlayBackground,
            opacity: globals.styles.groundOverlayOpacity
        };
        var groundOverlayOptions = {
            boxStyle: groundOverlayBoxStyle,
            content: this._img,
            disableAutoPan: true,
            pixelOffset: new google.maps.Size(offsetX, offsetY),
            closeBoxURL: "",
            position: center
        };
        var groundOverlay = new InfoBox(groundOverlayOptions);
        this.overlays.add(groundOverlay);

        // mark as drawn    
        this._drawn = true;
    };

    /**
    * Adjust the image.
    * @param {Number} ratioX
    * @param {Number} ratioY
    * @private
    */
    exports.GroundOverlay.prototype._setImage = function (ratioX, ratioY) {
        if (Object.isNullOrUndefined(this._img)) {
            this._img = document.createElement('img');
            this._img.alt = this.toString();
            this._img.id = this.entity + " " + this.objectId;
            this._img.src = this.url;
        }
        this._img.width = this.imageSizeX * ratioX;
        this._img.height = this.imageSizeY * ratioY;
    };

    /**
    * Display this entity at the current map zoom level.
    * @return {Boolean}
    */
    exports.GroundOverlay.prototype.displayedAtZoomLevel = function () {
        var z = globals.map.getZoom();
        return z > globals.groundOverlayHideZoomLevel;
    };

    /**
    * Get an array of all names of the provided ground overlays.
    * @param {Array} names of the overlays
    */
    exports.GroundOverlay.names = function (overlays) {
        var names = new Array();
        for (var o = 0, len = overlays.length; o < len; o++) {
            names.push(overlays[o].name);
        }
        return names;
    };

    // Inheritance must be last!
    util.inheritPrototypes(exports.GroundOverlay, entityBase.BaseEntityVatsimOnMap, "BaseEntityVatsimOnMap");
});