/**
* @module vd.entity.helper
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity.helper', function (exports) {

    /**
    * @constructor
    * @classdesc The settings for a Waypoint.
    * @param {Array} [options]
    * @author KWB
    */
    exports.WaypointSettings = function (options) {
        // set the values
        this.set(options);
    };

    /** 
    * Flight type constant.
    * @const
    */
    exports.WaypointSettings.TypeFlight = "flight";
    /** 
    * Flight type constant.
    * @const
    */
    exports.WaypointSettings.TypeRoute = "route";
    /** 
    * Marker type constant.
    * @const
    */
    exports.WaypointSettings.MarkerNdb = "ndb";
    /** 
    * Marker type constant.
    * @const
    */
    exports.WaypointSettings.MarkerVor = "vor";

    /**
    * Set values on the same object.
    * @param {Object} [args]
    */
    exports.WaypointSettings.prototype.set = function (options) {

        // make sure we have an options object
        options = Object.ifNotNullOrUndefined(options, {});

        /**
        * Display flight waypoints?
        * @type {Boolean}
        */
        this.displayFlightWaypoints = Object.ifNotNullOrUndefined(options["displayFlightWaypoints"], true); // display at all
        /**
        * Display flight altitude and speed?
        * @type {Boolean}
        */
        this.displayFlightAltitudeSpeed = Object.ifNotNullOrUndefined(options["displayFlightAltitudeSpeed"], true); ;
        /**
        * Display flight callsign?
        * @type {Boolean}
        */
        this.displayFlightCallsign = Object.ifNotNullOrUndefined(options["displayFlightCallsign"], true);
        /**
        * Show waypoints when flight is grounded?
        * @type {Boolean}
        */
        this.displayFlightWaypointsWhenGrounded = Object.ifNotNullOrUndefined(options["displayFlightWaypointsWhenGrounded"], false);
        /**
        * Number of waypoints displayed (maximum). Null means all values.
        * @type {Number}
        */
        var no = options["flightWaypointsNumberMaximum"];
        /**
        * Number of maximum waypoints for a flight.
        * @type {Number}
        */
        this.flightWaypointsNumberMaximum = Object.isNumber(no) ? no * 1 : null;
        /**
        * Display airway?
        * @type {Boolean}
        */
        this.displayAirway = Object.ifNotNullOrUndefined(options["displayAirway"], true);
    };

    /**
    * Number of elements displayed.
    * @param {String} [type]
    * @return {Number}
    */
    exports.WaypointSettings.prototype.displayedElements = function (type) {
        if (Object.isNullOrUndefined(type)) return 0;

        var c = 0;
        type = Object.isNullOrUndefined(type) ? null : type;
        if (type == exports.WaypointSettings.TypeFlight && this.displayFlightWaypoints) {
            if (this.displayFlightAltitudeSpeed) c++;
            if (this.displayFlightCallsign) c++;
        } else if (type == exports.WaypointSettings.TypeRoute) {
            c = 1;
            if (this.displayAirway) c++;
        }
        return c;
    };
});