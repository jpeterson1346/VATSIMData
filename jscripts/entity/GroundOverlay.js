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
        /**
        * Ratio (scale) of the current image.
        * @type {Number}
        */
        this._currentImageRatioX = null;
        /**
        * Ratio (scale) of the current image.
        * @type {Number}
        */
        this._currentImageRatioY = null;

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
        * South east coordinates.
        * @type {google.maps.latLng}
        */
        this.se = Object.ifNotNullOrUndefined(groundOverlayProperties["se"], null);
        /**
        * South east offset.
        * @type {Number}
        */
        this.boundsSePositionX = String.toNumber(groundOverlayProperties["boundsSePositionX"], null);
        /**
        * South east offset.
        * @type {Number}
        */
        this.boundsSePositionY = String.toNumber(groundOverlayProperties["boundsSePositionY"], null);
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
        /**
        * North west coordinates.
        * @type {google.maps.latLng}
        */
        this.nw = Object.ifNotNullOrUndefined(groundOverlayProperties["nw"], null);
        /**
        * North west offset.
        * @type {Number}
        */
        this.boundsNwPositionX = String.toNumber(groundOverlayProperties["boundsNwPositionX"], null);
        /**
        * North west offset.
        * @type {Number}
        */
        this.boundsNwPositionY = String.toNumber(groundOverlayProperties["boundsNwPositionY"], null);
        /**
        * Further info URL.
        */
        this.infoUrl = null;
        /**
        * Original chart URL.
        */
        this.originalChartUrl = null;
        /**
        * Center position offset of the bounds.
        * @type {Number}
        */
        this.boundsCenterPositionX = String.toNumber(groundOverlayProperties["boundsCenterPositionX"], null);
        /**
        * Center position offset of the bounds.
        * @type {Number}
        */
        this.boundsCenterPositionY = String.toNumber(groundOverlayProperties["boundsCenterPositionY"], null);
        /**
        * Resolution x / meter per pixel
        * @type {Number} 
        */
        this.resolutionX = String.toNumber(groundOverlayProperties["resolutionX"], null);
        /**
        * Resolution y / meter per pixel
        * @type {Number} 
        */
        this.resolutionY = String.toNumber(groundOverlayProperties["resolutionY"], null);
        /**
        * Rotate image by x degrees.
        * @type {Number} 
        */
        this.rotate = String.toNumber(groundOverlayProperties["rotate"], 0);
    };

    /**
    * Calculate properties (missing coordinates, etc).
    * @private
    */
    exports.GroundOverlay.prototype._calculateProperties = function () {
        if (Object.isNumber(this.resolutionX)) {
            // defined by resolution and center
            // calculate SW/NE
            var centerLanLon = null;
            if (Object.isNullOrUndefined(this.sw)) {
                centerLanLon = new LatLon(this.latitude, this.longitude);
                var distanceKm = (this.boundsCenterPositionX * this.resolutionX / 1000);
                var targetLanLon = centerLanLon.destinationPoint(270, distanceKm);
                distanceKm = ((this.imageSizeY - this.boundsCenterPositionY) * this.resolutionY / 1000);
                targetLanLon = targetLanLon.destinationPoint(180, distanceKm);
                this.sw = vd.util.UtilsMap.latLonToLatLng(targetLanLon);
            }
            if (Object.isNullOrUndefined(this.ne)) {
                centerLanLon = Object.ifNotNullOrUndefined(centerLanLon, new LatLon(this.latitude, this.longitude));
                distanceKm = ((this.imageSizeX - this.boundsCenterPositionX) * this.resolutionX / 1000);
                targetLanLon = centerLanLon.destinationPoint(90, distanceKm);
                distanceKm = (this.boundsCenterPositionY * this.resolutionY / 1000);
                targetLanLon = targetLanLon.destinationPoint(0, distanceKm);
                this.ne = vd.util.UtilsMap.latLonToLatLng(targetLanLon);
            }

            if (Object.isNullOrUndefined(this.vicinity)) {

                // the pixel size within image which represent the described bounds
                this.imageBoundsSizeX = this.imageSizeX;
                this.imageBoundsSizeY = this.imageSizeY;

                // set the described area as vicinity ("bounds of the overlay")
                this.vicinity = new google.maps.LatLngBounds(this.sw, this.ne);
            }
        } else {
            // defined by NW/SE instead of NE / SE?
            if (Object.isNullOrUndefined(this.sw)) {
                // calculate the missining corners
                this.sw = new google.maps.LatLng(this.se.lat(), this.nw.lng());
                this.ne = new google.maps.LatLng(this.nw.lat(), this.se.lng());

                this.boundsCenterPositionX = (this.boundsSePositionX + this.boundsNwPositionX) / 2;
                this.boundsCenterPositionY = (this.boundsSePositionY + this.boundsNwPositionY) / 2;
                this.imageBoundsSizeX = this.boundsSePositionX - this.boundsNwPositionX;
                this.imageBoundsSizeY = this.boundsSePositionY - this.boundsNwPositionY;
            }

            // defined by NE/SW
            // calculate the center of the bounds (not the center of the chart)
            if (!Object.isNumber(this.latitude)) {
                // set the described area as vicinity ("bounds of the overlay")
                this.vicinity = new google.maps.LatLngBounds(this.sw, this.ne);

                // set center
                var c = this.vicinity.getCenter();
                this.latitude = c.lat();
                this.longitude = c.lng();

                // the pixel size within image which represent the described bounds
                if (!Object.isNumber(this.imageBoundsSizeX)) {
                    this.boundsCenterPositionX = (this.boundsSwPositionX + this.boundsNePositionX) / 2;
                    this.boundsCenterPositionY = (this.boundsSwPositionY + this.boundsNePositionY) / 2;
                    this.imageBoundsSizeX = this.boundsNePositionX - this.boundsSwPositionX;
                    this.imageBoundsSizeY = this.boundsSwPositionY - this.boundsNePositionY;
                }
            }
        }

        // calculate SE / NW
        if (Object.isNullOrUndefined(this.se)) {
            // calculate the missining corners
            this.se = new google.maps.LatLng(this.sw.lat(), this.ne.lng());
            this.nw = new google.maps.LatLng(this.ne.lat(), this.sw.lng());
        }

        // calculate the pixel size of the described area, use edge for this purpose 
        if (Object.isNullOrUndefined(this._edgeX)) {
            var sw = new vd.entity.base.BaseEntityMap({ latitude: this.sw.lat(), longitude: this.sw.lng(), map: this.map });
            var se = new vd.entity.base.BaseEntityMap({ latitude: this.se.lat(), longitude: this.se.lng(), map: this.map });
            var ne = new vd.entity.base.BaseEntityMap({ latitude: this.ne.lat(), longitude: this.ne.lng(), map: this.map });
            this._edgeX = new vd.entity.helper.Edge({ from: sw, to: se, calculatePixelDistance: true });
            this._edgeY = new vd.entity.helper.Edge({ from: se, to: ne, calculatePixelDistance: true });
        } else {
            this._edgeX.calculatePixelDistance();
            this._edgeY.calculatePixelDistance();
        }

        // set map sizes
        this.mapBoundsSizeX = this._edgeX.pixelDistance;
        this.mapBoundsSizeY = this._edgeY.pixelDistance;
        this._currentImageRatioX = this.mapBoundsSizeX / this.imageBoundsSizeX;
        this._currentImageRatioY = this.mapBoundsSizeY / this.imageBoundsSizeY;
    };

    /**
    * Set by given XML node.
    * @param  {IXMLDOMNode} node
    * @return {Boolean} set successful/failed
    */
    exports.GroundOverlay.prototype.setFromXmlNode = function (node) {
        if (Object.isNullOrUndefined(node)) return false;
        var value, subNode, pos;
        for (var c = 0, len = node.childNodes.length; c < len; c++) {
            var childNode = node.childNodes[c];
            var property = childNode.tagName;
            if (String.isNullOrEmpty(property)) continue; // Firefox / Chrome check if TextNode
            property = property.toLowerCase();
            switch (property) {
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
                    if (!Object.isNullOrUndefined(childNode)) {
                        pos = this._parsePositionNode(childNode);
                        this.sw = new google.maps.LatLng(pos["lat"], pos["lng"]);
                        this.boundsSwPositionX = pos["x"];
                        this.boundsSwPositionY = pos["y"];
                    }

                    // SE
                    childNode = node.childNodes[c];
                    childNode = childNode.getElementsByTagName("se")[0];
                    if (!Object.isNullOrUndefined(childNode)) {
                        pos = this._parsePositionNode(childNode);
                        this.se = new google.maps.LatLng(pos["lat"], pos["lng"]);
                        this.boundsSePositionX = pos["x"];
                        this.boundsSePositionY = pos["y"];
                    }

                    // NE
                    childNode = node.childNodes[c];
                    childNode = childNode.getElementsByTagName("ne")[0];
                    if (!Object.isNullOrUndefined(childNode)) {
                        pos = this._parsePositionNode(childNode);
                        this.ne = new google.maps.LatLng(pos["lat"], pos["lng"]);
                        this.boundsNePositionX = pos["x"];
                        this.boundsNePositionY = pos["y"];
                    }

                    // NW
                    childNode = node.childNodes[c];
                    childNode = childNode.getElementsByTagName("nw")[0];
                    if (!Object.isNullOrUndefined(childNode)) {
                        pos = this._parsePositionNode(childNode);
                        this.nw = new google.maps.LatLng(pos["lat"], pos["lng"]);
                        this.boundsNwPositionX = pos["x"];
                        this.boundsNwPositionY = pos["y"];
                    }

                    // Center
                    childNode = node.childNodes[c];
                    childNode = childNode.getElementsByTagName("center")[0];
                    if (!Object.isNullOrUndefined(childNode)) {
                        pos = this._parsePositionNode(childNode);
                        this.longitude = pos["lng"];
                        this.latitude = pos["lat"];
                        this.boundsCenterPositionX = pos["x"];
                        this.boundsCenterPositionY = pos["y"];
                    }
                    break;
                case "originalchart":
                    if (!Object.isNullOrUndefined(childNode.firstChild) && !Object.isNullOrUndefined(childNode.firstChild.data)) {
                        value = childNode.firstChild.data.trim();
                        this.originalChartUrl = value;
                    }
                    break;
                case "info":
                    if (!Object.isNullOrUndefined(childNode.firstChild) && !Object.isNullOrUndefined(childNode.firstChild.data)) {
                        value = childNode.firstChild.data.trim();
                        this.infoUrl = value;
                    }
                    break;
                case "resolution":
                    childNode = childNode.getElementsByTagName("x")[0];
                    value = childNode.firstChild.data.trim();
                    this.resolutionX = String.toNumber(value, null); // meter per pixel
                    childNode = node.childNodes[c];
                    childNode = childNode.getElementsByTagName("y")[0];
                    value = childNode.firstChild.data.trim();
                    this.resolutionY = String.toNumber(value, null); // meter per pixel
                    break;
            }
        }

        // end        
        return true;
    };

    /**
    * Parse a position, e.g. SW to lat/lng/x/y.
    * @param  {IXMLDOMNode} node
    * @return {Object} with properties lat/lng/x/y
    * @private
    */
    exports.GroundOverlay.prototype._parsePositionNode = function (childNode) {
        var ret = { x: null, y: null, lat: null, lng: null };
        var subNode, value, lat, lng;
        if (!Object.isNullOrUndefined(childNode)) {
            subNode = childNode.getElementsByTagName("lat")[0];
            value = subNode.firstChild.data.trim();
            lat = String.toNumber(value, null);
            if (!Object.isNumber(lat)) globals.log.error("Overlay, missing latitude value");
            subNode = childNode.getElementsByTagName("lng")[0];
            value = subNode.firstChild.data.trim();
            lng = String.toNumber(value, null);
            if (!Object.isNumber(lng)) globals.log.error("Overlay, missing longitude value");
            ret["lat"] = lat;
            ret["lng"] = lng;
            subNode = childNode.getElementsByTagName("x")[0];
            value = subNode.firstChild.data.trim();
            ret["x"] = String.toNumber(value, 0);
            subNode = childNode.getElementsByTagName("y")[0];
            value = subNode.firstChild.data.trim();
            ret["y"] = String.toNumber(value, 0);
        }
        return ret;
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
        var isInBounds = this.isInBounds();
        display = display && (isInBounds || center);
        if (display) {
            this._calculateProperties();
            display = display && this.displayedAtZoomLevel();
        }

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
        this._setImage();

        var offsetX = -this.boundsCenterPositionX * this._currentImageRatioX;
        var offsetY = -this.boundsCenterPositionY * this._currentImageRatioY;
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
    * @private
    */
    exports.GroundOverlay.prototype._setImage = function () {
        if (Object.isNullOrUndefined(this._img)) {
            this._img = document.createElement('img');
            this._img.alt = this.toString();
            this._img.id = this.entity + " " + this.objectId;
            this._img.src = this.url;
        }
        this._img.width = this.imageSizeX * this._currentImageRatioX;
        this._img.height = this.imageSizeY * this._currentImageRatioY;
        if (Object.isNumber(this.rotate) && this.rotate != 0) $(this._img).rotate(this.rotate);
    };

    /**
    * Display this entity at the current map zoom level.
    * @return {Boolean}
    */
    exports.GroundOverlay.prototype.displayedAtZoomLevel = function () {
        return ((this._currentImageRatioX * this.imageSizeX) > globals.groundOverlayMinPixelX) &&
            ((this._currentImageRatioY * this.imageSizeY) > globals.groundOverlayMinPixelY);
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