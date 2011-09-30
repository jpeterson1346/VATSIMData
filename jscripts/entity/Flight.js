/**
* @module vd.entity
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity', function(exports, require) {

    var entityBase = require("vd.entity.base");
    var util = require("vd.util.Utils");

    /**
    * @constructor
    * @classdesc A flight on VATSIM. 
    * @param {Object} flightProperties
    * @param {vd.entity.FlightSettings} [flightSettings]
    * @extends vd.entity.module:base.BaseEntityVatsimOnMap
    * @author KWB
    */
    exports.Flight = function(flightProperties, flightSettings) {

        // see http://stackoverflow.com/questions/2107556/how-to-inherit-from-a-class-in-javascript/2107586#2107586
        // after this, the subclasses are "merged" into flight
        vd.entity.base.BaseEntityVatsimOnMap.call(this, flightProperties);

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
        * Is grounded, caching the value of isGrounded (for grids).
        * Requires a call of isGrounded to get a valid value.
        * @type {Boolean}
        */
        this._isGrounded = false;

        // image
        this._setImage();

        // cast string values, correct other values
        if (String.isNullOrEmpty(this.name) && !String.isNullOrEmpty(this.pilot)) this.name = this.pilot;

        // init the 1st waypoint if we have valid values
        return this._insertNewWaypoint();
    };

    /**
    * Destructor, removing memory leak sensitive parts will go here
    * or method will be overridden by subclass.
    */
    exports.Flight.prototype.dispose = function() {
        this.display(false, false, false);
        if (!Object.isNullOrUndefined(this._img)) {
            this._img.onmouseover = null;
            this._img.onmouseout = null;
        }
        this.dispose$BaseEntityVatsimOnMap();
    };

    /**
    * Adjust the image.
    * @private
    */
    exports.Flight.prototype._setImage = function() {
        var me = this;
        // try to avoid memory leaks
        if (!Object.isNullOrUndefined(this._img)) {
            this._img.onmouseover = null;
            this._img.onmouseout = null;
        }
        this._img = document.createElement('img');
        this._img.alt = this.toString();
        this._img.id = "Flight_" + this.objectId;
        this._img.src = (this.isGrounded()) ? "images/AircraftJetGnd.png" : this._img.src = "images/AircraftJet.png";
        this._img.width = 16;
        this._img.height = 16;
        this._img.onmouseover = function() { me._imageMouseover(); };
        // creates flickering in some browser, currently disabled
        // this._img.onmouseout = function() { me._imgMouseout(); };
        this.setHeading(this.heading, true);
    };

    /**
    * Mouse over image.
    * @private
    */
    exports.Flight.prototype._imageMouseover = function() {
        if (!Object.isNullOrUndefined(this._flightSettings)) return; // already in this mode
        this._flightSettings = this.flightSettings;
        this.flightSettings = this.flightSettings.clone().displayAll();
        this._draw(true);

        // if the mouse out event fails, make sure the details disappear some time later
        var me = this;
        setTimeout(function() { me._imgMouseout(); }, globals.flightMouseoverTimeout);
    };

    /**
    * Reset the mouse over effect, timeout based since onmouseout did not work reliable.
    * @private
    */
    exports.Flight.prototype._imgMouseout = function() {
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
    */
    exports.Flight.prototype.display = function(display, center, forceRedraw) {
        // display checks
        if (this.isFollowed()) {
            display = true;
        } else {
            display = display && this.flightSettings.displayFlight; // hide anyway
            display = display && (globals.map.getZoom() > globals.flightHideZoomLevel); // too small to be displayed
            display = display && (this.flightSettings.displayOnGround || !this.isGrounded()); // grounded?
            display = display && (!this.flightSettings.displayRequireFlightplan || this.hasFlightplan());
            display = display && this.compliesWithFilter();
        }
        // display
        if (display) this._draw(forceRedraw);
        this.overlays.display(display);
        if (center && display) globals.map.setCenter(sp);
        vd.entity.helper.Waypoints.displayWaypoints(this.waypoints, true, display, false, forceRedraw);
        this.displayed = display && this._drawn;
    };

    /**
    * Set a new heading.
    * @param {Number} heading 0-359
    * @param {Boolean} [force]
    */
    exports.Flight.prototype.setHeading = function(heading, force) {
        if (Object.isNullOrUndefined(force)) force = false;
        if (this.heading == heading && !force) return;
        this.heading = heading;
        if (Object.isNumber(this.heading)) $(this._img).rotate(this.heading);
    };

    /**
    * Airborne or grounded?
    * @return {Boolean}
    */
    exports.Flight.prototype.isGrounded = function() {
        // due to data provisioning 0 is not a reliable value
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
    exports.Flight.prototype.hasFlightplan = function() {
        return !Object.isNullOrUndefined(this.flightplan);
    };

    /**
    * In vicinity of the departing / or arrival airport.
    * @returns {Boolean} 
    */
    exports.Flight.prototype.isInAirportVicinity = function() {
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
    exports.Flight.prototype.toPropertyValue = function() {
        var pv = this.toPropertyValue$BaseEntityVatsimOnMap();
        if (!String.isNullOrEmpty(this.pilot)) pv["pilot"] = this.pilot;
        if (!String.isNullOrEmpty(this.aircraft)) pv["aircraft"] = this.aircraft;
        if (!String.isNullOrEmpty(this.transponder)) pv["squawk"] = this.transponder;
        if (!Object.isNullOrUndefined(this.flightplan)) pv["flightplan"] = "<u>Goto flightplan</u>";
        if (!String.isNullOrEmpty(this.id)) pv["vataware"] = "<u>Show @ Vataware</u>";
        pv["grounded"] = this.isGrounded();
        return pv;
    };

    /**
    * Draw the entity.
    * @private
    * @param {Boolean} [forceRedraw]
    */
    exports.Flight.prototype._draw = function(forceRedraw) {
        if (!forceRedraw && this._drawn) return;
        var latlng = this.latLng();

        // assertion check
        if (this.entity != "Flight") {
            globals.log.error("Flight draw called as none flight object");
            return;
        }

        // clean up
        if (!Object.isNullOrUndefined(this.overlays) && !this.overlays.isEmpty()) {
            this.overlays.clear();
        }

        // build the plane icon
        // view-source:http://google-maps-utility-library-v3.googlecode.com/svn/tags/infobox/1.1.7/examples/infobox-basic.html
        this._setImage();
        var planeLabelBoxStyle = (this.isFollowed()) ? {
            background: globals.styles.flightLabelBackgroundIfFollowed,
            opacity: globals.styles.flightLabelOpacity
        } :
        // show if in filter, but filter is not active
        // if filtered, only the selected flights are visible, so no need to highlight them
            (!globals.filtered && this.isInFilter()) ? {
                background: globals.styles.flightLabelBackgroundIfFiltered,
                opacity: globals.styles.flightLabelOpacity
            } : null;

        var planeLabelOptions = {
            content: this._img,
            disableAutoPan: true,
            boxStyle: planeLabelBoxStyle,
            pixelOffset: new google.maps.Size(-this._img.width / 2, -this._img.height / 2),
            closeBoxURL: "",
            position: latlng,
            zIndex: this.altitude < 0 ? 100 : this.altitude
        };
        var planeLabel = new InfoBox(planeLabelOptions);
        this.overlays.add(planeLabel);

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
                pixelOffset: new google.maps.Size(0, this._img.height),
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
            var colour = vd.util.Utils.valueToGradient(globals.styles.wpFlightWaypointBaseColourHsv[0], globals.styles.wpFlightWaypointBaseColourHsv[1], this.waypoints[0].altitude, 30000);
            var path = vd.entity.helper.Waypoints.waypointsToLatLngPath(this.waypoints);
            var pw = this.waypoints[0].speedToWidth();
            var line = new google.maps.Polyline({
                    clickable: false,
                    geodesic: true,
                    path: path,
                    strokeColor: colour,
                    strokeOpacity: globals.styles.wpFlightLineOpacity,
                    strokeWeight: pw,
                    zIndex: 0
                });
            this.overlays.add(line);
        }

        // draw everything before rotaing the image
        this.overlays.display(true); // assign map
        if (!this._drawn) planeLabel.draw(); // 1st time force a draw, otherwise rotating the image will fail because an asyncronously drawn object has not all tags in place

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
    exports.Flight.prototype._getContent = function() {
        var c = (this.flightSettings.displayCallsign) ? this.callsign : "";
        if (this.flightSettings.displayAircraft && !String.isNullOrEmpty(this.aircraft)) c = c.appendIfThisIsNotEmpty(" ") + this.aircraft;
        if (this.flightSettings.displayFrequency && this.frequency > 100) c += " " + this.frequency + "MHz";
        if (this.flightSettings.displayPilot && !String.isNullOrEmpty(this.pilot)) c = c.appendIfThisIsNotEmpty("<br>") + this.pilot;
        if (this.flightSettings.displaySpeedAltitudeHeading) c = c.appendIfThisIsNotEmpty("<br>") + this.groundspeedAndUnit() + " " + this.altitudeAndUnit() + " MSL " + this.headingAndUnit();
        if (this.flightSettings.displayId && !String.isNullOrEmpty(this.id)) c = c.appendIfThisIsNotEmpty("<br>") + this.id;
        if (this.flightSettings.displayTransponder && !String.isNullOrEmpty(this.transponder)) c = c.appendIfThisIsNotEmpty("<br>") + "Squawk " + this.transponder;
        if (this.flightSettings.displayHeightAndDeclination) c = c.appendIfThisIsNotEmpty("<br>") + this.heightAndUnit() + " AGL Dec: " + this.declinationAndUnit();
        return vd.util.UtilsWeb.spaceToNbsp(c);
    };

    /**
    * Update position, speed, altitude ...
    * @param {Flight|Object} newFlightInformation with the appropriate data
    * @return {Boolean} updated?
    */
    exports.Flight.prototype.update = function(newFlightInformation) {
        this.groundspeed = newFlightInformation.groundspeed;
        this.altitude = newFlightInformation.altitude;
        this.flightplan = newFlightInformation.flightplan;
        this.setHeading(newFlightInformation.heading);
        this.setLatitudeLongitude(newFlightInformation.latitude, newFlightInformation.longitude);
        return this._insertNewWaypoint();
    };

    /**
    * String representation.
    * @return {String}
    */
    exports.Flight.prototype.toString = function() {
        var s = this.toString$BaseEntityVatsimOnMap();
        return s;
    };

    /**
    * Update the existing flights.
    * @param {Array} existingFlights
    * @param {Array} newFlights
    * @return {Array} updated flights including new excluding gone flights
    */
    exports.Flight.updateFlights = function(existingFlights, newFlights) {
        if (Array.isNullOrEmpty(newFlights)) return existingFlights;
        if (Array.isNullOrEmpty(existingFlights)) return newFlights;

        var flights = new Array();
        var existingFlightsCopy = existingFlights.slice();
        for (var f = 0, len = newFlights.length; f < len; f++) {
            var newFlight = newFlights[f];
            var foundInExistingFlights = vd.entity.base.BaseEntityVatsim.findByIdFirst(existingFlightsCopy, newFlight.id);
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
    exports.Flight.prototype._insertNewWaypoint = function(ignoreSameWaypoint) {
        if (this.isGrounded() && !globals.waypointSettings.displayFlightWaypointsWhenGrounded) return false;
        ignoreSameWaypoint = Object.ifNotNullOrUndefined(ignoreSameWaypoint, true);

        var wp = new vd.entity.helper.Waypoint({
                parentObject: this,
                type: vd.entity.helper.WaypointSettings.TypeFlight,
                name: this.callsign,
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
    util.inheritPrototypes(exports.Flight, entityBase.BaseEntityVatsimOnMap, "BaseEntityVatsimOnMap");
});