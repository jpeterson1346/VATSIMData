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
});