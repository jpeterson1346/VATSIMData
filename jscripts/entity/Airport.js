/**
* @module vd.entity
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity', function(exports, require) {

    var entityBase = require("vd.entity.base");
    var util = require("vd.util.Utils");

    /**
    * @classdesc Airport (aka terminal).
    * @constructor
    * @param {Object} airportProperties
    * @param {AirportSettings} [airportSettings]
    * @extends vd.entity.module:base.BaseEntityModelOnMap
    */
    exports.Airport = function(airportProperties, airportSettings) {

        // inherit attributes
        vd.entity.base.BaseEntityModelOnMap.call(this, airportProperties);

        /**
        * Entity "Airport".
        * @type {String}
        * @const
        */
        this.entity = "Airport"; // "class", simplifies debugging
        /**
        * Airport settings.
        * @type {vd.entity.AirportSettings}
        */
        this.airportSettings = (Object.isNullOrUndefined(airportSettings)) ? globals.airportSettings : airportSettings;
        /**
        * ATCs belonging to the airport.
        * @type {Array}
        * @see Atc
        */
        this.atcs = new Array();
        /**
        * Departing flights.
        * @type {Array}
        * @see Flight
        */
        this.flightsDeparting = new Array();
        /**
        * Arriving flights.
        * @type {Array}
        * @see Flight
        */
        this.flightsArriving = new Array();
        /**
        * Label displayed when clicked.
        * @type {InfoBox}
        * @private
        */
        this._popUpLabel = null;
        /**
        * Airport label.
        * @type {InfoBox}
        * @private
        */
        this._airportLabel = null;
        /**
        * Controller.
        * @type {String}
        */
        this.controller = Object.ifNotNullOrUndefined(airportProperties["controller"], null);
        if (String.isNullOrEmpty(this.controller)) this.controller = this.name;

    };

    /**
    * Destructor, removing memory leak sensitive parts will go here
    * or method will be overridden by subclass.
    */
    exports.Airport.prototype.dispose = function() {
        this.display(false, false, false);
        if (!Object.isNullOrUndefined(this._popUpLabel)) {
            this._popUpLabel.eventCloseHookIn = null;
            this._popUpLabel.eventMouseDownHookIn = null;
            this._popUpLabel = null;
        }
        if (!Object.isNullOrUndefined(this._popUpLabel)) {
            this._airportLabel.eventCloseHookIn = null;
            this._airportLabel.eventMouseDownHookIn = null;
            this._airportLabel = null;
        }
        this.dispose$BaseEntityModelOnMap();
    };

    /**
    * Add a new group member
    * @param {vd.entity.helper.Atc} atc
    */
    exports.Airport.prototype.addAtc = function(atc) {
        this.atcs.push(atc);
        this._calculateLatLonElvAverage();
        atc.Airport = this;
        if (String.isNullOrEmpty(this.name)) this.name = atc.getCallsignMainPart();
    };

    /**
    * Retrieve the metar information.
    * @return {String} metar
    */
    exports.Airport.prototype.metar = function() {
        return globals.metar.readFromVatsim(this.callsign);
    };

    /**
    * Update position, speed, altitude ...
    * @param  {vd.entity.Airport|Object} newFlightInformation with the appropriate data
    * @return {Boolean} updated?
    */
    exports.Airport.prototype.update = function(newAirportInformation) {
        this.altitude = newAirportInformation.altitude;
        this.atcs = newAirportInformation.atcs;
        this.setLatitudeLongitude(newAirportInformation.latitude, newAirportInformation.longitude);
        this._calculateLatLonElvAverage();
        return true;
    };

    /**
    * Re-calculate average of latitude / longitude / altitude
    * based on the given ATC.
    * @private
    */
    exports.Airport.prototype._calculateLatLonElvAverage = function() {

        if (this.atcs.length < 1) return;
        var lat = 0;
        var lon = 0;
        var elv = 0;
        for (var a = 0, len = this.atcs.length; a < len; a++) {
            var atc = this.atcs[a];
            lat += atc.latitude;
            lon += atc.longitude;
            elv += atc.elevation;
        }
        lat = lat / this.atcs.length;
        lon = lon / this.atcs.length;
        elv = elv / this.atcs.length;
        this.latitude = lat;
        this.longitude = lon;
        this.elevation = elv;
        this.vicinity = this.getVicinity(5, 5);
    };

    /**
    * Display on map.
    * @param {Boolean} display
    * @param {Boolean} center Center on the map
    * @param {Boolean} [forceRedraw] redraw, e.g. because settings changed
    */
    exports.Airport.prototype.display = function(display, center, forceRedraw) {

        // display checks
        display = display && this.airportSettings.displayAirport;
        display = display && this.displayedAtZoomLevel(); // too small to be displayed?
        var isInBounds = this.isInBounds();

        // display    
        if (display) this._draw(forceRedraw);
        this.overlays.display(display);
        if (center && display) globals.map.setCenter(this.latLng());
        this.displayed = display && this._drawn;
        for (var a = 0, len = this.atcs.length; a < len; a++) {
            var atc = this.atcs[a];
            atc.displayed = this.displayed;
            atc._isInBounds = isInBounds;
        }
    };

    /**
    * Display this entity at the current map zoom level.
    * @return {Boolean}
    */
    exports.Airport.prototype.displayedAtZoomLevel = function() {
        return globals.map.getZoom() > globals.airportHideZoomLevel;
    };

    /**
    * Draw the entity.
    * @private
    * @param {Boolean} [forceRedraw]
    */
    exports.Airport.prototype._draw = function(forceRedraw) {
        if (!forceRedraw && this._drawn) return;
        var latlng = this.latLng();

        // clean up
        if (!Object.isNullOrUndefined(this.overlays) && !this.overlays.isEmpty()) {
            this.overlays.clear();
        }

        // view-source:http://google-maps-utility-library-v3.googlecode.com/svn/tags/infobox/1.1.7/examples/infobox-basic.html
        if (!String.isNullOrEmpty(this.name)) {
            var symbolLabelOptions = {
                content: this.name,
                disableAutoPan: true,
                pixelOffset: new google.maps.Size(0, 0),
                boxStyle: this._boxStyle(),
                closeBoxURL: "",
                position: latlng,
                enableEventPropagation: false
            };
            this._airportLabel = new InfoBox(symbolLabelOptions);
            this.overlays.add(this._airportLabel);
            if (this.airportSettings.displayAirportVicinity)
                this.displayVicinity(
                    {
                        strokeColor: globals.styles.airportVicinityLineStrokeColor,
                        strokeOpacity: globals.styles.airportVicinityLineStrokeOpacity,
                        strokeWeight: globals.styles.airportVicinityLineStrokeWeight,
                        fillColor: globals.styles.airportVicinityFillColor,
                        fillOpacity: globals.styles.airportVicinityFillOpacity
                    }
                );
            this.overlays.display(true);
            if (!this._drawn) this._airportLabel.draw(); // 1st time force a draw

            // Register event for the popup. I had to extend the Infobox.js for this, but this way is the
            // only one I got reliable working.
            var me = this;
            if (Object.isNullOrUndefined(this._airportLabel.eventMouseDownHookIn)) {
                this._airportLabel.eventMouseDownHookIn = function() {
                    me._displayPopUp();
                };
                this._airportLabel.eventCloseHookIn = function() {
                    me._displayPopUp();
                };
            }
        }

        // re-init the pop up if required
        if (forceRedraw && !Object.isNullOrUndefined(this._popUpLabel)) {
            this._popUpLabel = null;
            this._displayPopUp();
        }

        // mark as drawn    
        this._drawn = true;
    };

    //
    // Pop up further information about ATC.
    //
    exports.Airport.prototype._displayPopUp = function() {
        if (Array.isNullOrEmpty(this.atcs)) return;
        if (Object.isNullOrUndefined(this._popUpLabel)) {
            var me = this;
            var content = this._popUpContent();
            if (String.isNullOrEmpty(content)) return;
            if (this.airportSettings.displayedElements() < 1) return;
            var closeImage = vd.util.UtilsWeb.replaceCurrentPage("/images/FancyClose.png");
            var popUpLabelOptions = {
                content: content,
                disableAutoPan: true,
                pixelOffset: new google.maps.Size(12, 12),
                closeBoxURL: closeImage,
                position: this.latLng(),
                enableEventPropagation: true,
                boxStyle: this._boxStyle()
            };
            var popUpLabel = new InfoBox(popUpLabelOptions);
            popUpLabel.open(globals.map);
            this.overlays.add(popUpLabel);
            this._popUpLabel = popUpLabel;
            this._popUpLabel.eventCloseHookIn = function() {
                me._displayPopUp();
            };
        } else {
            this._popUpLabel.close();
            this._popUpLabel.eventCloseHookIn = null;
            this.overlays.remove(this._popUpLabel);
            this._popUpLabel = null;
        }
    };

    // Build the content for the pop up.
    // @return {String}
    exports.Airport.prototype._popUpContent = function() {
        if (Array.isNullOrEmpty(this.atcs)) return null;
        if (this.airportSettings.displayedElements() < 1) return null;
        var content = "";
        var separator = ", ";
        var lb;
        var textWidth = globals.airportAtisTextWidth;
        for (var a = 0, len = this.atcs.length; a < len; a++) {
            var atc = this.atcs[a];
            var atcContent = atc._getContent(separator);
            if (!String.isNullOrEmpty(atcContent) && atcContent.length > textWidth) textWidth = atcContent.length;
            content = content.appendIfThisIsNotEmpty("<br/>") + atcContent;
        }
        if (this.airportSettings.displayAtis) {
            var atis = this.atis();
            if (!String.isNullOrEmpty(atis)) {
                lb = String.isNullOrEmpty(content) ? "" : "<br/><br/>";
                atis = vd.util.Utils.formatToMaxWidth(atis, textWidth);
                atis = vd.util.UtilsWeb.crToBr(atis);
                content = content.appendIfNotEmpty(atis, lb);
            }
        }
        if (this.airportSettings.displayMetar) {
            var metar = this.metar();
            if (!String.isNullOrEmpty(metar)) {
                lb = String.isNullOrEmpty(content) ? "" : "<br/><br/>";
                metar = vd.util.Utils.formatToMaxWidth(metar, textWidth);
                metar = vd.util.UtilsWeb.crToBr(metar);
                content = content.appendIfNotEmpty(metar, lb);
            }
        }
        return (String.isNullOrEmpty(content)) ? content : "<br/>" + vd.util.UtilsWeb.spaceToNbsp(content);
    };

    /**
    * Get the box style.
    * @return {google.maps.BoxStyle} 
    */
    exports.Airport.prototype._boxStyle = function() {
        return {
            border: globals.styles.airportLabelBorder,
            padding: globals.styles.airportLabelPadding,
            background: globals.styles.airportLabelBackground,
            opacity: globals.styles.airportLabelOpacity,
            textAlign: globals.styles.airportLabelTextAlign,
            fontSize: globals.styles.airportLabelFontSize,
            color: globals.styles.airportLabelFontColor,
            width: "auto",
            // "max-width": "200px",
            "white-space": "nowrap",
            zIndex: this.altitude < 0 ? 100 : this.altitude
        };
    };

    /**
    * Get the ATIS.
    * @return {String} 
    */
    exports.Airport.prototype.atis = function() {
        if (Array.isNullOrEmpty(this.atcs)) return null;
        var atisAtcs = vd.entity.helper.Atc.findByType(this.atcs, vd.entity.helper.Atc.TypeAtis);
        if (Array.isNullOrEmpty(atisAtcs)) return null;
        var atc = atisAtcs[0];
        if (String.isNullOrEmpty(atc.atis)) return null;
        return atc.atis;
    };

    /**
    * Contains the flight as departing flight?
    * @return {Boolean}
    */
    exports.Airport.prototype.containsFlightDeparting = function(flight) {
        return this.flightsDeparting.contains(flight);
    };

    /**
    * Contains the flight as arriving flight?
    * @return {Boolean}
    */
    exports.Airport.prototype.containsFlightArriving = function(flight) {
        return this.flightsArriving.contains(flight);
    };

    /**
    * Add a flight.
    * @return {Boolean} added / not added (likely already existing)
    */
    exports.Airport.prototype.addFlightDeparting = function(flight) {
        if (this.flightsDeparting.contains(flight)) return false;
        this.flightsDeparting.push(flight);
        return true;
    };

    /**
    * Add a flight.
    * @return {Boolean} added / not added (likely already existing)
    */
    exports.Airport.prototype.addFlightArriving = function(flight) {
        if (this.flightsArriving.contains(flight)) return false;
        this.flightsArriving.push(flight);
        return true;
    };

    /**
    * String representation.
    * @return {String}
    */
    exports.Airport.prototype.toString = function() {
        var s = this.name;
        s = s.appendIfNotEmpty(this.toString$BaseEntityModelOnMap(), " - ");
        return s;
    };

    /**
    * Update the existing flights.
    * @param {Array} existingAirports
    * @param {Array} newAirports
    * @param {Array} [flights] link with flights if provided
    * @return {Array} updated current airports
    */
    exports.Airport.updateAirports = function(existingAirports, newAirports, flights) {
        var airports;
        if (Array.isNullOrEmpty(newAirports))
            airports = existingAirports;
        else if (Array.isNullOrEmpty(existingAirports))
            airports = newAirports;
        else {
            airports = new Array();
            var exisitingAirportsCopy = existingAirports.slice();
            for (var a = 0, len = newAirports.length; a < len; a++) {
                var newAirport = newAirports[a];
                var foundInExistingAirports = vd.entity.base.BaseEntityModel.findByCallsignFirst(exisitingAirportsCopy, newAirport.callsign);
                if (Object.isNullOrUndefined(foundInExistingAirports)) {
                    airports.push(newAirport);
                } else {
                    foundInExistingAirports.update(newAirport); // latest data
                    exisitingAirportsCopy.removeByValue(foundInExistingAirports);
                    airports.push(foundInExistingAirports);
                }
            }

            // airports no longer available and will be hidden
            for (a = 0, len = exisitingAirportsCopy.length; a < len; a++) {
                var disappearedAirport = exisitingAirportsCopy[a];
                disappearedAirport.dispose();
            }
        }
        if (!Array.isNullOrEmpty(flights)) exports.Airport.attachFlights(airports, flights);
        return airports;
    };

    /**
    * Attach departind / arriving flights.
    * @param {Array} airports
    * @param {Array} flights
    */
    exports.Airport.attachFlights = function(airports, flights) {
        if (Array.isNullOrEmpty(airports)) return;
        if (Array.isNullOrEmpty(flights)) return;
        for (var f = 0, len = flights.length; f < len; f++) {
            var flight = flights[f];
            if (!flight.hasFlightplan()) continue;
            var airportDep = vd.entity.base.BaseEntityModel.findByCallsignFirst(airports, flight.flightplan.from);
            if (!Object.isNullOrUndefined(airportDep)) airportDep.addFlightDeparting(flight);
            var airportArr = vd.entity.base.BaseEntityModel.findByCallsignFirst(airports, flight.flightplan.to);
            if (!Object.isNullOrUndefined(airportArr)) airportArr.addFlightArriving(flight);
            flight.flightplan.airportDeparting = airportDep;
            flight.flightplan.airportArriving = airportArr;
        }
    };

    // Inheritance must be last!
    util.inheritPrototypes(exports.Airport, entityBase.BaseEntityModelOnMap, "BaseEntityModelOnMap");
});