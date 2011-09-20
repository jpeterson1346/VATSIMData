/**
* @module vd.entity
*/
namespace.module('vd.entity', function (exports, require) {

    /**
    * @constructor
    * @classdesc Settings for Flights
    * @param {Object} [properties]
    */
    exports.FlightSettings = function (properties) {
        this.set(properties);
    };

    /**
    * Reset values on the same object.
    * @param {Object} [properties]
    */
    exports.FlightSettings.prototype.set = function (properties) {
        this.displayFlight = true; // display at all
        this.displayCallsign = true;
        this.displayPilot = true;
        this.displayId = true;
        this.displaySpeedAltitudeHeading = true;
        this.displayFrequency = false;
        this.displayTransponder = false;
        this.displayOnGround = false;
        this.displayWaypointLines = true;
        this.displayAircraft = false;
        this.displayRequireFlightplan = true;
        this.displayHeightAndDeclination = false;

        // override with arguments
        if (!Object.isNullOrUndefined(properties)) {
            for (var property in properties) {
                if (this.hasOwnProperty(property))
                    this[property] = properties[property];
            }
        }
    };

    /**
    * Display all properties.
    * @return {FlightSettings}
    */
    exports.FlightSettings.prototype.displayAll = function () {
        this.displayFlight = true; // display at all
        this.displayCallsign = true;
        this.displaySpeedAltitudeHeading = true;
        this.displayPilot = true;
        this.displayId = true;
        this.displayFrequency = true;
        this.displayTransponder = true;
        this.displayOnGround = true;
        this.displayWaypointLines = true;
        this.displayAircraft = true;
        this.displayRequireFlightplan = true;
        this.displayHeightAndDeclination = true;
        return this;
    };

    /**
    * Display minimal set of properties.
    * @return {FlightSettings}
    */
    exports.FlightSettings.prototype.displayMinimal = function () {
        this.displayFlight = true; // display at all
        this.displayCallsign = true;
        this.displaySpeedAltitudeHeading = false;
        this.displayPilot = false;
        this.displayId = false;
        this.displayFrequency = false;
        this.displayTransponder = false;
        this.displayOnGround = false;
        this.displayWaypointLines = false;
        this.displayAircraft = false;
        this.displayRequireFlightplan = false;
        this.displayHeightAndDeclination = false;
        return this;
    };

    /**
    * Number of elements displayed.
    * @return {Number}
    */
    exports.FlightSettings.prototype.displayedElements = function () {
        var c = 0;
        if (this.displayCallsign) c++;
        if (this.displayAircraft) c++;
        if (this.displayFrequency) c++;
        if (this.displayPilot) c++;
        if (this.displayId) c++;
        if (this.displayTransponder) c++;
        if (this.displaySpeedAltitudeHeading) c++;
        if (this.displayHeightAndDeclination) c++;
        // do not add this.displayOnGround here!
        // do not add this.displayWaypointLines here!
        return c;
    };

    /**
    * Clone this object.
    */
    exports.FlightSettings.prototype.clone = function () {
        var clone = new exports.FlightSettings(this);
        return clone;
    };
});