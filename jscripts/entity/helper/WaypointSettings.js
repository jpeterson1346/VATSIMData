/**
* @module vd.entity.helper
*/
namespace.module('vd.entity.helper', function(exports, require) {

    /**
    * @constructor
    * @classdesc The settings for a Waypoint.
    * @property {Boolean} displayFlightWaypoints
    * @property {Boolean} displayFlightAltitudeSpeed
    * @property {Boolean} displayFlightCallsign
    * @param {Array} [properties]
    */
    exports.WaypointSettings = function(properties) {
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
    exports.WaypointSettings.prototype.set = function(properties) {

        this.displayFlightWaypoints = false; // display at all
        this.displayFlightAltitudeSpeed = true;
        this.displayFlightCallsign = true;

        // override with arguments
        if (!Object.isNullOrUndefined(properties)) {
            for (var argName in properties) {
                this[argName] = properties[argName];
            }
        }
    };

    /**
    * Number of elements displayed.
    * @param {String} [type]
    * @return {Number}
    */
    exports.WaypointSettings.prototype.displayedElements = function(type) {
        var c = 0;
        type = Object.isNullOrUndefined(type) ? null : type;
        if ((type == null || type == exports.WaypointSettings.TypeFlight) && this.displayFlightWaypoints) {
            if ((type == null || type == exports.WaypointSettings.TypeFlight) && this.displayFlightAltitudeSpeed) c++;
            if ((type == null || type == exports.WaypointSettings.TypeFlight) && this.displayFlightCallsign) c++;
        }
        return c;
    };
});