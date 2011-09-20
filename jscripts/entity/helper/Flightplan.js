/**
* @module vd.entity.helper
*/
namespace.module('vd.entity.helper', function (exports, require) {

    var entityBase = require("vd.entity.base");
    var util = require("vd.util.Utils");

    /** 
    * @constructor
    * @classdesc Flightplan origin to destination.
    * @param {Object} flightplanProperties
    */
    exports.Flightplan = function (flightplanProperties) {

        // see http://stackoverflow.com/questions/2107556/how-to-inherit-from-a-class-in-javascript/2107586#2107586
        // after this, the subclasses are merged into flight
        vd.entity.base.BaseEntityVatsimOnMap.call(this, flightplanProperties);

        /*
        * Entity "Flightplan".
        * @type {String}
        * @const
        **/
        this.entity = "Flightplan"; // "class", simplifies debugging
        /*
        * ICAO code airport from.
        * @type {String}
        **/
        this.from = Object.ifNotNullOrUndefined(flightplanProperties["from"], null);
        /*
        * ICAO code airport to.
        * @type {String}
        **/
        this.to = Object.ifNotNullOrUndefined(flightplanProperties["to"], null);
        /*
        * ICAO code airport alternate.
        * @type {String}
        **/
        this.alternate = Object.ifNotNullOrUndefined(flightplanProperties["alternate"], null);
        /*
        * Remarks.
        * @type {String}
        * @example /V /Charts available
        **/
        this.remarks = Object.ifNotNullOrUndefined(flightplanProperties["remarks"], null);
        /*
        * Flight is IFR/VFR.
        * @type {String}
        **/
        this.type = Object.ifNotNullOrUndefined(flightplanProperties["type"], null);
        /*
        * Corresponding flight.
        * @type {String}
        **/
        this.flight = Object.ifNotNullOrUndefined(flightplanProperties["flight"], null);
        /**
        * Route.
        * @example IDEKO Y900 TIMEN UL126 OSBIT G5 TOSTU T726 LBU
        * @type String
        */
        this.route = Object.ifNotNullOrUndefined(flightplanProperties["route"], null);
        /**
        * Origin airport.
        * @type Airport
        */
        this.airportDeparting = null;
        /**
        * Destination airport.
        * @type Airport
        */
        this.airportArriving = null;
        /**
        * Alternate airport.
        * @type Airport
        */
        this.airportAlternate = null;
        /**
        * Waypoints of the route.
        * @type {Array}
        * @see Waypoint
        */
        this.waypoints = new Array();
    };
    
    /**
    * Get property value pairs.
    * @return {Array} with property / value pairs
    */
    exports.Flightplan.prototype.toPropertyValue = function () {
        var pv = new Array();
        if (!String.isNullOrEmpty(this.from)) pv["from"] = this.from;
        if (!String.isNullOrEmpty(this.to)) pv["to"] = this.to;
        if (!String.isNullOrEmpty(this.type)) pv["type"] = this.type;
        if (!String.isNullOrEmpty(this.remarks)) pv["remarks"] = this.remarks;
        if (!String.isNullOrEmpty(this.route)) pv["route"] = this.route;
        if (!Object.isNullOrUndefined(this.flight)) pv["flight"] = "<u>Goto flight</u>";
        return pv;
    };

    /**
    * Add a new waypoint of the route.
    * @param {Waypoint} waypoint
    * @see Waypoint
    */
    exports.Flightplan.addWaypoint = function (waypoint) {
        if (Object.isNullOrUndefined(waypoint)) return;
        waypoint.type = vd.entity.WaypointSettings.TypeFlightplan;
        this.waypoints.push(waypoint);
    };

    // Inheritance must be last!
    util.inheritPrototypes(exports.Flightplan, entityBase.BaseEntityVatsimOnMap, "BaseEntityVatsimOnMap");
});