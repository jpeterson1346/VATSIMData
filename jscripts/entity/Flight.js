/**
* @module vd.entity
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity', function (exports, require) {

    var entityBase = require("vd.entity.base");
    var util = require("vd.util.Utils");

    /**
    * @constructor
    * @classdesc A flight (on VATSIM and FSX). 
    * @param {Object} flightProperties
    * @param {vd.entity.FlightSettings} [flightSettings]
    * @extends vd.entity.module:base.BaseEntityModelOnMap
    * @author KWB
    * @since 0.7, starting with 0.8 FSX support
    */
    exports.Flight = function (flightProperties, flightSettings) {

        // see http://stackoverflow.com/questions/2107556/how-to-inherit-from-a-class-in-javascript/2107586#2107586
        // after this, the subclasses are "merged" into flight
        vd.entity.base.BaseEntityModelOnMap.call(this, flightProperties);

        /**
        * Entity Flight
        * @const
        * @type {String}
        */
        this.entity = "Flight"; // "class", simplifies debugging
        /**
        * Settings for a flight
        * @type {vd.entity.FlightSettings}
        */
        this.flightSettings = Object.ifNotNullOrUndefined(flightSettings, globals.flightSettings);
        /**
        * Settings temporarily saved.
        * @type {vd.entity.FlightSettings}
        * @private
        */
        this._flightSettings = null;
        /**
        * Aircraft.
        * @type {String}
        * @example B737, C172, J41
        */
        this.aircraft = Object.ifNotNullOrUndefined(flightProperties["aircraft"], null);
        /**
        * Pilot.
        * @type {String}
        */
        this.pilot = String.isNullOrEmpty(this.name) ? Object.ifNotNullOrUndefined(flightProperties["pilot"], null) : this.name;
        /**
        * Flightplan.
        * @type {vd.entity.helper.Flightplan}
        */
        this.flightplan = Object.ifNotNullOrUndefined(flightProperties["flightplan"], null);
        if (this.isFsxBased() && Object.isNullOrUndefined(this.flightplan))
            this.flightplan = vd.entity.helper.Flightplan.getFsxDummyFlightplan();
        /**
        * Array of waypoints.
        * @type {Array}
        * @see vd.entity.helper.Waypoint
        */
        this.waypoints = new Array();
        /**
        * Transponder code.
        * @type {String}
        * @example 7000, 2000
        */
        this.transponder = String.isNullOrEmpty(flightProperties["transponder"]) ? null : flightProperties["transponder"];
        /**
        * Bank angle [deg].
        * @type {Number}
        * @example 5, 10
        */
        this.bankAngle = String.toNumber(flightProperties["bankangle"], 0, 2);
        /**
        * Pitch angle [deg].
        * @type {Number}
        * @example 5, 10
        */
        this.pitchAngle = String.toNumber(flightProperties["pitchangle"], 0, 2);
        /**
        * Angle of attack angle [deg].
        * @type {Number}
        * @example 5, 10
        */
        this.angleOfAttack = String.toNumber(flightProperties["aoa"], 0, 2);
        /**
        * Vertical speed [ft/s].
        * @type {Number}
        * @example 100, 1000
        */
        this.verticalSpeed = String.toNumber(flightProperties["verticalspeed"], 0, 2);
        /**
        * Is grounded, also caching the value of isGrounded (for grids).
        * VATSIM: Requires a call of isGrounded to get a valid value.
        * FSX: Passes this value.
        * @type {Boolean}
        * @protected
        */
        this._isGrounded = Object.ifNotNullOrUndefined(flightProperties["grounded"], false);
        /**
        * Helicopter?.
        * VATSIM: Requires a call of isHelicopter to get a valid value.
        * FSX: Passes this value.
        * @type {Boolean}
        * @protected
        */
        this._isHelicopter = Object.ifNotNullOrUndefined(flightProperties["helicopter"], false);
        /**
        * Corresponding plane image.
        * @type {HTMLDOMElement}
        * @private
        */
        this._img = null;

        // image
        this._setImage();

        // post fixes
        if (this.isFsxBased()) {
            if (String.isNullOrEmpty(this.pilot)) this.pilot = "FSX";
        } else if (this.isVatsimBased()) {
            // cast string values, correct other values
            if (String.isNullOrEmpty(this.name) && !String.isNullOrEmpty(this.pilot)) this.name = this.pilot;
        }

        // init the 1st waypoint if we have valid values
        return this._insertNewWaypoint();
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
        this._img.alt = this.toString();
        this._img.id = this.entity + "_" + this.objectId;
        if (this.isHelicopter()) {
            this._img.src = (this.isGrounded()) ? "images/HelicopterGnd.png" : this._img.src = "images/Helicopter.png";
        } else {
            this._img.src = (this.isGrounded()) ? "images/AircraftJetGnd.png" : this._img.src = "images/AircraftJet.png";
        }
        this._img.width = globals.flightImageWidth;
        this._img.height = globals.flightImageHeight;
        this._img.style.visibility = true;
        this._img.onmouseover = function () { me._imageMouseover(); };
        this._img.onmouseout = function () { me._imgMouseout(); }; // creates flickering in some browser, disable in such a case
        this.setHeading(this.heading, true);
    };

    /**
    * Mouse over image.
    * @private
    */
    exports.Flight.prototype._imageMouseover = function () {
        if (this.disposed) return; // no longer valid
        if (!Object.isNullOrUndefined(this._flightSettings)) return; // already in this mode
        this._flightSettings = this.flightSettings;
        this.flightSettings = this.flightSettings.clone().displayAll();
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
        if (Object.isNullOrUndefined(this._flightSettings)) return; // nothing to reset
        this.flightSettings = this._flightSettings;
        this._flightSettings = null;
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
            display = display && this.flightSettings.displayFlight; // hide anyway
            display = display && this.displayedAtZoomLevel(); // too small to be displayed?
            display = display && (this.isMyFsxAircraft() || this.flightSettings.displayOnGround || !this.isGrounded()); // grounded?
            display = display && (this.isFsxBased() || !this.flightSettings.displayRequireFlightplan || this.hasFlightplan());
            display = display && this.compliesWithFilter();
        }
        // display
        if (display) this._draw(forceRedraw);
        this.overlays.display(display);
        this._img.style.visibility = display; // force image to disappear
        if (center && display) globals.map.setCenter(this.latLng());
        vd.entity.helper.Waypoints.displayWaypoints(this.waypoints, display, false, forceRedraw, true);
        this.displayed = display && this._drawn;
    };

    /**
    * Display this entity at the current map zoom level.
    * @return {Boolean}
    */
    exports.Flight.prototype.displayedAtZoomLevel = function () {
        return globals.map.getZoom() > globals.flightHideZoomLevel;
    };

    /**
    * Set a new heading.
    * @param {Number} heading 0-359
    * @param {Boolean} [force]
    */
    exports.Flight.prototype.setHeading = function (heading, force) {
        if (Object.isNullOrUndefined(force)) force = false;
        if (this.heading == heading && !force) return;
        this.heading = heading;
        if (Object.isNumber(this.heading)) $(this._img).rotate(this.heading);
    };

    /**
    * Helicopter?
    * @return {Boolean}
    */
    exports.Flight.prototype.isHelicopter = function () {

        // FSX sets the value
        if (this.isFsxBased()) return this._isHelicopter;
        return false;
    };

    /**
    * Airborne or grounded?
    * @return {Boolean}
    */
    exports.Flight.prototype.isGrounded = function () {

        // FSX sets the value
        if (this.isFsxBased()) return this._isGrounded;

        // VATSIM does not pass this value and requires a good guess:
        // Due to data provisioning GS 0 is not a reliable value
        if (Object.isNumber(this.groundspeed)) {
            if (this.groundspeed >= 1 && this.groundspeed <= globals.groundedSpeedThreshold) return (this._isGrounded = true); // safe decision
            if (this.groundspeed > globals.groundedSpeedThreshold) return (this._isGrounded = false); // also safe
        }

        // we need height to decide because groundspeed is not reliable
        var h = this.height();
        if (Object.isNumber(h))
            return (this._isGrounded = (h <= globals.groundedHeightThreshold)); // based on height

        // we have an unreliable low speed here, so I check whether I am "close to an airport".
        // based on flight plan
        if (this.hasFlightplan()) this.isInAirportVicinity();

        // no better guess possible, this might be still wrong
        // since some flights speeds are set as wrongely 0
        return (this._isGrounded = (this.groundspeed <= globals.groundedSpeedThreshold));
    };

    /**
    * Flightplan available?
    * @return {Boolean}
    */
    exports.Flight.prototype.hasFlightplan = function () {
        return !Object.isNullOrUndefined(this.flightplan);
    };

    /**
    * In vicinity of the departing / or arrival airport.
    * @returns {Boolean} 
    */
    exports.Flight.prototype.isInAirportVicinity = function () {
        if (!this.hasFlightplan()) return false;
        if (!Object.isNullOrUndefined(this.flightplan.airportDeparting)) {
            if (this.flightplan.airportDeparting.isInVicinity(this))
                return true;
        }
        if (!Object.isNullOrUndefined(this.flightplan.airportArriving)) {
            if (this.flightplan.airportArriving.isInVicinity(this))
                return true;
        }
        return false;
    };

    /**
    * To an object containing the properties.
    * @return {Array} with property / value pairs
    */
    exports.Flight.prototype.toPropertyValue = function () {
        var pv = this.toPropertyValue$BaseEntityModelOnMap();
        if (this.isFsxBased()) {
            pv["aoa"] = this.angleOfAttackAndUnit();
            pv["bank angle"] = this.bankAngleAndUnit();
            pv["pitch angle"] = this.pitchAngleAndUnit();
            pv["vertical speed"] = this.verticalSpeedAndUnit();
        }
        if (!String.isNullOrEmpty(this.pilot)) pv["pilot"] = this.pilot;
        if (!String.isNullOrEmpty(this.aircraft)) pv["aircraft"] = this.aircraft;
        if (!String.isNullOrEmpty(this.transponder)) pv["squawk"] = this.transponder;
        if (!Object.isNullOrUndefined(this.flightplan)) pv["flightplan"] = "<u>Goto flightplan</u>";
        if (!String.isNullOrEmpty(this.vatsimId)) pv["vataware"] = "<u>Show @ Vataware</u>";
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

        // assertion check
        if (this.entity != "Flight") {
            globals.log.error("Flight draw called on none flight object");
            return;
        }

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
        var imgOffsetW = this._img.width == 0 ? globals.flightImageWidth : this._img.width;
        var imgOffsetH = this._img.height == 0 ? globals.flightImageHeight : this._img.height;

        var planeImageLabelOptions = {
            content: this._img,
            disableAutoPan: true,
            boxStyle: planeImageLabelBoxStyle,
            pixelOffset: new google.maps.Size(-imgOffsetW / 2, -imgOffsetH / 2),
            closeBoxURL: "",
            position: latlng,
            zIndex: this.altitude < 0 ? 100 : this.altitude
        };
        var planeImageLabel = new InfoBox(planeImageLabelOptions);
        this.overlays.add(planeImageLabel);

        // text label
        if (this.flightSettings.displayedElements() > 0) {
            var content = this._getContent();
            var textLabelOptions = {
                content: content,
                // style goes to a div element -> see there for documentation
                boxStyle: {
                    border: globals.styles.flightLabelBorder,
                    padding: globals.styles.flightLabelPadding,
                    background: globals.styles.flightLabelBackground,
                    opacity: globals.styles.flightLabelOpacity,
                    textAlign: globals.styles.flightLabelTextAlign,
                    fontSize: globals.styles.flightLabelFontSize,
                    color: globals.styles.flightLabelFontColor,
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

        // draw lines between waypoints
        if (this.flightSettings.displayWaypointLines && this.waypoints.length > 1) {
            var color = vd.util.Utils.valueToGradient(globals.styles.wpFlightWaypointBaseColorHsv[0], globals.styles.wpFlightWaypointBaseColorHsv[1], this.waypoints[0].altitude, 30000);
            var path = vd.entity.helper.Waypoints.waypointsToLatLngPath(this.waypoints);
            var pw = this.waypoints[0].speedToWidth();
            var line = new google.maps.Polyline({
                clickable: false,
                geodesic: true,
                path: path,
                strokeColor: color,
                strokeOpacity: globals.styles.wpFlightLineOpacity,
                strokeWeight: pw,
                zIndex: 0
            });
            this.overlays.add(line);
        }

        // draw everything before rotating the image
        this.overlays.display(true); // assign map
        if (!this._drawn) planeImageLabel.draw(); // 1st time force a draw, otherwise rotating the image will fail because an asyncronously drawn object has not all tags in place

        // set the heading if required
        if (this.heading != 0) this.setHeading(this.heading, true);

        // mark as drawn    
        this._drawn = true;
    };

    /**
    * Build the content string.
    * @private
    * @return {String}
    */
    exports.Flight.prototype._getContent = function () {
        var origin = "(" + (this.isVatsimBased() ? "V" : "") + (this.isFsxBased() ? "F" : "") + ")";
        var c = (this.flightSettings.displayCallsign) ? (this.callsign + " " + origin) : "";
        if (this.flightSettings.displayAircraft && !String.isNullOrEmpty(this.aircraft)) c = c.appendIfThisIsNotEmpty(" ") + this.aircraft;
        if (this.flightSettings.displayFrequency && this.frequency > 100) c += " " + this.frequency + "MHz";
        if (this.flightSettings.displayPilot && !String.isNullOrEmpty(this.pilot)) c = c.appendIfThisIsNotEmpty("<br>") + this.pilot;
        if (this.flightSettings.displaySpeedAltitudeHeading) c = c.appendIfThisIsNotEmpty("<br>") + this.groundspeedAndUnit() + " " + this.altitudeAndUnit() + " MSL " + this.headingAndUnit();
        if (this.flightSettings.displayId && !String.isNullOrEmpty(this.id)) c = c.appendIfThisIsNotEmpty("<br>") + this.id;
        if (this.flightSettings.displayTransponder && !String.isNullOrEmpty(this.transponder)) c = c.appendIfThisIsNotEmpty("<br>") + "Squawk " + this.transponder;
        if (this.flightSettings.displayHeightAndDeclination) c = c.appendIfThisIsNotEmpty("<br>") + this.heightAndUnit() + " AGL Dec: " + this.variationAndUnit();
        return vd.util.UtilsWeb.spaceToNbsp(c);
    };

    /**
    * Update position, speed, altitude ...
    * @param {Flight|Object} newFlightInformation with the appropriate data
    * @return {Boolean} updated?
    */
    exports.Flight.prototype.update = function (newFlightInformation) {
        this._isGrounded = newFlightInformation._isGrounded;
        this.groundspeed = newFlightInformation.groundspeed;
        this.altitude = newFlightInformation.altitude;
        this.flightplan = newFlightInformation.flightplan;
        this.qnh = newFlightInformation.qnh;
        this.setHeading(newFlightInformation.heading);
        this.setLatitudeLongitude(newFlightInformation.latitude, newFlightInformation.longitude);

        if (this.isMyFsxAircraft()) {
            // actually this should never changed, but when user switches aircraft ...
            this._isHelicopter = newFlightInformation._isHelicopter;
            this.aircraft = newFlightInformation.aircraft;
            this.callsign = newFlightInformation.callsign;
        }
        return this._insertNewWaypoint();
    };

    /**
    * String representation.
    * @return {String}
    */
    exports.Flight.prototype.toString = function () {
        var s = this.toString$BaseEntityModelOnMap();
        return s;
    };

    /**
    * Angle of attack with unit.
    * @return {String}
    */
    exports.Flight.prototype.angleOfAttackAndUnit = function () {
        return this.angleOfAttack.toFixed(1) + "&deg;";
    };

    /**
    * Bank angle of aircraft.
    * @return {String}
    */
    exports.Flight.prototype.bankAngleAndUnit = function () {
        return this.bankAngle.toFixed(1) + "&deg;";
    };

    /**
    * Pitch angle of aircraft.
    * @return {String}
    */
    exports.Flight.prototype.pitchAngleAndUnit = function () {
        return this.pitchAngle.toFixed(1) + "&deg;";
    };

    /**
    * Vertical speed [ft/s].
    * @return {String}
    */
    exports.Flight.prototype.verticalSpeedAndUnit = function () {
        var ftMin = this.verticalSpeed * 60;
        return ftMin.toFixed(1) + "ft/min";
    };

    /**
    * Update the existing flights.
    * @param {Array} existingFlights
    * @param {Array} newFlights
    * @return {Array} updated flights including new excluding gone flights
    */
    exports.Flight.updateFlights = function (existingFlights, newFlights) {
        if (Array.isNullOrEmpty(newFlights)) return existingFlights;
        if (Array.isNullOrEmpty(existingFlights)) return newFlights;

        var flights = new Array();
        var existingFlightsCopy = existingFlights.slice(0); // make a copy of the array
        for (var f = 0, len = newFlights.length; f < len; f++) {
            var newFlight = newFlights[f];
            var foundInExistingFlights = newFlight.isFsxBased() ?
                vd.entity.base.BaseEntityModel.findByFsxIdFirst(existingFlightsCopy, newFlight.fsxId) :
                vd.entity.base.BaseEntityModel.findByVatsimIdFirst(existingFlightsCopy, newFlight.vatsimId);
            if (Object.isNullOrUndefined(foundInExistingFlights)) {
                flights.push(newFlight);
            } else {
                foundInExistingFlights.update(newFlight); // latest data
                existingFlightsCopy.removeByValue(foundInExistingFlights);
                flights.push(foundInExistingFlights);
            }
        }

        // remove from filter
        globals.filter.removeEntites(existingFlightsCopy); // remove no longer existing flights 

        // flights no longer available and will be hidden
        for (f = 0, len = existingFlightsCopy.length; f < len; f++) {
            var disappearedFlight = existingFlightsCopy[f];
            disappearedFlight.dispose();
        }
        return flights;
    };

    /**
    * Insert a new waypoint.
    * @param  {Boolean} [ignoreSameWaypoint]
    * @private
    * @return {Boolean} inserted?
    */
    exports.Flight.prototype._insertNewWaypoint = function (ignoreSameWaypoint) {
        if (this.isGrounded() && !globals.waypointSettings.displayFlightWaypointsWhenGrounded) return false;
        ignoreSameWaypoint = Object.ifNotNullOrUndefined(ignoreSameWaypoint, true);

        var wp = new vd.entity.helper.Waypoint({
            parentObject: this,
            type: vd.entity.helper.WaypointSettings.TypeFlight,
            name: this.callsign,
            callsign: this.callsign,
            latitude: this.latitude,
            longitude: this.longitude,
            groundspeed: this.groundspeed,
            altitude: this.altitude
        });

        if (ignoreSameWaypoint && this.waypoints.length > 0) {
            var lastWp = this.waypoints[0];
            if (this.hasSameLocation(lastWp)) return false;
        }
        this.waypoints.unshift(wp);
        if (Object.isNumber(globals.waypointSettings.flightWaypointsNumberMaximum) && this.waypoints.length > globals.waypointSettings.flightWaypointsNumberMaximum) {
            var firstWp = this.waypoints.last(); // first waypoint is last in array
            firstWp.dispose();
            this.waypoints.pop();
            // globals.log.trace("Removing waypoint for flight" + this.callsign + " , waypoints " + this.waypoints.length);
        }
        return true;
    };

    // Inheritance must be last!
    util.inheritPrototypes(exports.Flight, entityBase.BaseEntityModelOnMap, "BaseEntityModelOnMap");
});