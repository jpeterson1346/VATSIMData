/**
* @module vd.entity.helper
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity.helper', function (exports) {

    /**
    * @constructor
    * @classdesc The settings for a Waypoint.
    * @param {Array} [properties]
    * @author KWB
    */
    exports.WaypointSettings = function (properties) {
        this.set(properties);
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
    exports.WaypointSettings.TypeFlightplan = "flightPlan";

    /**
    * Set values on the same object.
    * @param {Object} [args]
    */
    exports.WaypointSettings.prototype.set = function (properties) {

        /**
        * Display flight waypoints?
        * @type {Boolean}
        */
        this.displayFlightWaypoints = Object.ifNotNullOrUndefined(properties["displayFlightWaypoints"], true); // display at all
        /**
        * Display flight altitude and speed?
        * @type {Boolean}
        */
        this.displayFlightAltitudeSpeed = Object.ifNotNullOrUndefined(properties["displayFlightAltitudeSpeed"], true); ;
        /**
        * Display flight callsign?
        * @type {Boolean}
        */
        this.displayFlightCallsign = Object.ifNotNullOrUndefined(properties["displayFlightCallsign"], true);
        /**
        * Show waypoints when flight is grounded?
        * @type {Boolean}
        */
        this.displayFlightWaypointsWhenGrounded = Object.ifNotNullOrUndefined(properties["displayFlightWaypointsWhenGrounded"], false);
        /**
        * Number of waypoints displayed (maximum). Null means all values.
        * @type {Number}
        */
        var no = properties["flightWaypointsNumberMaximum"];
        this.flightWaypointsNumberMaximum = Object.isNumber(no) ? no * 1 : null;
    };

    /**
    * Number of elements displayed.
    * @param {String} [type]
    * @return {Number}
    */
    exports.WaypointSettings.prototype.displayedElements = function (type) {
        var c = 0;
        type = Object.isNullOrUndefined(type) ? null : type;
        if ((type == null || type == exports.WaypointSettings.TypeFlight) && this.displayFlightWaypoints) {
            if ((type == null || type == exports.WaypointSettings.TypeFlight) && this.displayFlightAltitudeSpeed) c++;
            if ((type == null || type == exports.WaypointSettings.TypeFlight) && this.displayFlightCallsign) c++;
        }
        return c;
    };
});