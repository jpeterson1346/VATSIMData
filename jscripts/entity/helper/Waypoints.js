/**
* @module vd.entity.helper
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity.helper', function (exports) {

    /**
    * @constructor
    * @classdesc Describes waypoints of a flight, SID, STAR.
    * @see vd.entity.module:helper.Waypoint
    */
    exports.Waypoints = function () {
        // code goes here
    };

    /**
    * Display the given waypoints.
    * @param {Array} waypoints
    * @param {Boolean} display
    * @param {Boolean} center
    * @param {Boolean} forceRedraw
    * @param {Boolean} [ignoreFirst] ignore 1st waypoint 
    */
    exports.Waypoints.displayWaypoints = function (waypoints, display, center, forceRedraw, ignoreFirst) {

        // check display conditions
        if (Array.isNullOrEmpty(waypoints)) return;
        ignoreFirst = Object.ifNotNullOrUndefined(ignoreFirst, false);
        display = display && (globals.map.getZoom() > globals.waypointLinesHideZoomLevel); // too small to be displayed

        // display each waypoint
        var midPoint = center ? Math.round(waypoints.length / 2) : 0; // if centered, use mid waypoint as center point
        for (var w = 0, len = waypoints.length; w < len; w++) {
            if (display && ignoreFirst && w == 0) continue;
            var wp = waypoints[w];
            var d = display && (center || wp.isInBounds());
            wp.display(d, center && w == midPoint, forceRedraw);
        }
    };

    /**
    * Convert Array of Waypoints to Array of Google google.maps.LatLng points, aka path.
    * @param  {Array} waypoints Waypoints
    * @return {Array} path of google.maps.LatLng 
    */
    exports.Waypoints.waypointsToLatLngPath = function (waypoints) {
        var path = new Array();
        for (var i = 0, len = waypoints.length; i < len; i++) {
            var wp = waypoints[i];
            var latLng = new google.maps.LatLng(wp.latitude, wp.longitude);
            path[i] = latLng;
        }
        return path;
    };

    /**
    * Dispose the given points.
    * @param  {Array} waypoints Waypoints
    */
    exports.Waypoints.dispose = function (waypoints) {
        for (var i = 0, len = waypoints.length; i < len; i++) {
            var wp = waypoints[i];
            wp.dispose();
        }
    };

    /**
    * Get bounds.
    * @param  {Array} waypoints Waypoints
    * @return {google.maps.LatLngBounds}
    */
    exports.Waypoints.getBounds = function (waypoints) {
        if (Array.isNullOrEmpty(waypoints) || waypoints.length < 2) return null;
        var latMax = waypoints[0].latitude;
        var latMin = latMax;
        var lonMax = waypoints[0].longitude;
        var lonMin = lonMax;

        for (var i = 1, len = waypoints.length; i < len; i++) {
            var wp = waypoints[i];
            if (latMax < wp.latitude) latMax = wp.latitude;
            if (latMin > wp.latitude) latMin = wp.latitude;
            if (lonMax < wp.longitude) lonMax = wp.longitude;
            if (lonMin > wp.longitude) lonMin = wp.longitude;
        }
        var sw = new google.maps.LatLng(latMin, lonMin);
        var ne = new google.maps.LatLng(latMax, lonMax);
        return new google.maps.LatLngBounds(sw, ne);
    };
});