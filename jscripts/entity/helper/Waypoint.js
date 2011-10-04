﻿/**
* @module vd.entity.helper
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity.helper', function(exports, require) {

    var entityBase = require("vd.entity.base");
    var util = require("vd.util.Utils");

    /**
    * Describes a waypoint (of a flight, NDB, SID or STAR waypoint).
    * @constructor
    * @param {Array} waypointOpts
    * @param {WaypointSettings} [waypointSettings]
    * @extends vd.entity.module:base.BaseEntityVatsimOnMap
    * @see vd.entity.module:helper.Waypoints
    */
    exports.Waypoint = function(waypointProperties, waypointSettings) {

        // after this, the subclasses are merged into this class
        vd.entity.base.BaseEntityVatsimOnMap.call(this, waypointProperties);

        /**
        * Consecutive number.
        * @type {Number}
        */
        this.number = String.toNumber(waypointProperties["number"], null);
        /**
        * Type as defined, e.g. WaypointSettings.TypeFlight
        * @type {String}
        * @see vd.entity.module:helper.WaypointSettings
        */
        this.type = Object.ifNotNullOrUndefined(waypointProperties["type"], null);
        /**
        * Marker for this waypoint such as NDB, VOR, etc. Defined in WaypointSettings.MarkerXXXX.
        * @type {String}
        * @see vd.entity.module:helper.WaypointSettings
        */
        this.marker = Object.ifNotNullOrUndefined(waypointProperties["marker"], null);
        /**
        * Altitude restriction used with SID/STARs.
        * @type {Number}
        */
        this.altitudeRestriction = String.toNumber(waypointProperties["altitudeRestriction"], null);
        /**
        * If waypoints belong to a superior context.
        * @tpye {Object}
        */
        this.parentObject = Object.ifNotNullOrUndefined(waypointProperties["parentObject"], null);
        /**
        * Airway name (if applicable).
        * @type {String}
        */
        this.airway = null;
        /**
        * Corresponding waypoint settings.
        * @see vd.entity.module:helper.WaypointSettings
        */
        this.waypointSettings = (Object.isNullOrUndefined(waypointSettings)) ? globals.waypointSettings : waypointSettings;
    };

    /**
    * Display on map.
    * @param {Boolean} display
    * @param {Boolean} center: Center on the map
    * @param {Boolean} forceRedraw
    */
    exports.Waypoint.prototype.display = function(display, center, forceRedraw) {

        // display ?
        display = display && this.waypointSettings.displayedElements(this.type) > 0;
        display = display && (globals.map.getZoom() > globals.waypointHideZoomLevel); // too small to be displayed

        // drawing
        if (display) this._draw(forceRedraw);
        this.overlays.display(display);
        if (center && display) globals.map.setCenter(this.latLng());
    };

    // Draw the entity.
    // @param {Boolean} forceRedraw
    exports.Waypoint.prototype._draw = function(forceRedraw) {
        if (!forceRedraw && this._drawn) return;

        // clean up
        if (!Object.isNullOrUndefined(this.overlays) && !this.overlays.isEmpty()) this.overlays.clear();

        // position and title
        var latLng = this.latLng();
        var labelText = this._getLabelText();

        // view-source:http://google-maps-utility-library-v3.googlecode.com/svn/tags/infobox/1.1.7/examples/infobox-basic.html
        var marker = this._getMarker(latLng, labelText);
        var label = this._getLabel(latLng, labelText);

        // remark: add checks for empty markers
        this.overlays.add(marker);
        this.overlays.add(label);
        this._drawn = true;
    };

    // Gets the marker for the specified type.
    // @param {google.maps.LatLng} latLng
    // @param {String} labelText
    exports.Waypoint.prototype._getMarker = function(latLng, labelText) {
        var m = null;
        var imageUrl = null;
        switch (this.marker) {
        case vd.entity.helper.WaypointSettings.MarkerNdb:
            imageUrl = "images/NDB.png";
            break;
        case vd.entity.helper.WaypointSettings.MarkerVor:
            imageUrl = "images/VOR.png";
            break;
        default:
            break;
        }
        if (!String.isNullOrEmpty(imageUrl)) {
            // http://code.google.com/apis/maps/documentation/javascript/reference.html#MarkerImage
            imageUrl = vd.util.UtilsWeb.replaceCurrentPage(imageUrl);
            var size = new google.maps.Size(16, 16);
            var wpIcon = new google.maps.MarkerImage(imageUrl, size, null, new google.maps.Point(8, 8), size);
            m = new google.maps.Marker({
                    position: latLng,
                    map: globals.map,
                    icon: wpIcon,
                    title: labelText
                });
        }
        return m;
    };

    // Gets the label for the specified type.
    // @param {google.maps.LatLng} latLng
    // @param {String} labelText
    exports.Waypoint.prototype._getLabel = function(latLng, labelText) {
        if (String.isNullOrEmpty(labelText)) return null;
        var labelOptions = null;
        var label = null;
        switch (this.type) {
        case vd.entity.helper.WaypointSettings.TypeFlight:
            labelOptions = {
                content: labelText,
                boxStyle: {
                    border: globals.styles.wpFlightLabelBorder,
                    background: globals.styles.wpFlightLabelBackground,
                    opacity: globals.styles.wpFlightLabelOpacity,
                    textAlign: globals.styles.wpFlightLabelTextAlign,
                    fontSize: globals.styles.wpFlightLabelFontSize,
                    color: globals.styles.wpFlightLabelFontColor,
                    width: "auto",
                    "white-space": "nowrap",
                    zIndex: 0
                },
                disableAutoPan: true,
                pixelOffset: new google.maps.Size(0, 0),
                position: latLng,
                closeBoxURL: "",
                isHidden: false,
                pane: "mapPane",
                enableEventPropagation: true
            };
            break;
        case vd.entity.helper.WaypointSettings.TypeRoute:
            labelOptions = {
                content: labelText,
                boxStyle: {
                    border: globals.styles.wpRouteLabelBorder,
                    background: globals.styles.wpRouteLabelBackground,
                    opacity: globals.styles.wpRouteLabelOpacity,
                    textAlign: globals.styles.wpRouteLabelTextAlign,
                    fontSize: globals.styles.wpRouteLabelFontSize,
                    color: globals.styles.wpRouteLabelFontColor,
                    width: "auto",
                    "white-space": "nowrap",
                    zIndex: 0
                },
                disableAutoPan: true,
                pixelOffset: new google.maps.Size(16, 0),
                position: latLng,
                closeBoxURL: "",
                isHidden: false,
                pane: "mapPane",
                enableEventPropagation: true
            };
            break;
        default:
            break;
        }

        // create label
        if (!Object.isNullOrUndefined(labelOptions)) {
            label = new InfoBox(labelOptions);
            label.open(globals.map);
        }
        return label;
    };

    // Get the label text.
    // @private
    // @return {String}
    exports.Waypoint.prototype._getLabelText = function() {
        var labelText = "";
        switch (this.type) {
        case vd.entity.helper.WaypointSettings.TypeFlight:
            if (this.waypointSettings.displayFlightCallsign) labelText += this.name;
            if (this.waypointSettings.displayFlightAltitudeSpeed) labelText = labelText.appendIfThisIsNotEmpty("<br>") + this.groundspeedAndUnit() + " " + this.altitudeAndUnit();
            break;
        case vd.entity.helper.WaypointSettings.TypeRoute:
            labelText += this.name;
            if (this.waypointSettings.displayAirway && !String.isNullOrEmpty(this.airway)) labelText = labelText.appendIfThisIsNotEmpty("<br>") + this.airway;
            break;
        default:
            labelText = this.name;
            break;
        }
        return vd.util.UtilsWeb.spaceToNbsp(labelText);
    };

    /**
    * Destructor, hide and clean up.
    */
    exports.Waypoint.prototype.dispose = function() {
        this.display(false, false, false);
        this.dispose$BaseEntityVatsimOnMap();
    };

    /**
    * Get the string representation.
    * @return {String}
    */
    exports.Waypoint.prototype.toString = function() {
        var s = this.name;
        s = s.appendIfNotEmpty(this.baseEntityMapToString(), " - ");
        s = s.appendIfNotEmpty(this.baseEntityVatsimToString(), " - ");
        return s;
    };

    // Speed to pixel width.
    // @return {Number} pixel width
    exports.Waypoint.prototype.speedToWidth = function() {
        if (this.groundspeed < 200) return 1;
        if (this.groundspeed < 450) return 2;
        return 3;
    };

    // Inheritance must be last!
    util.inheritPrototypes(exports.Waypoint, entityBase.BaseEntityVatsimOnMap, "BaseEntityVatsimOnMap");
});