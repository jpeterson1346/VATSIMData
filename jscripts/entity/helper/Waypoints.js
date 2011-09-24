/**
* @module vd.entity.helper
*/
namespace.module('vd.entity.helper', function(exports, require) {

    /**
    * @constructor
    * @classdesc Describes waypoints of a flight, SID, STAR.
    * @see vd.entity.module:helper.Waypoint
    */
    exports.Waypoints = function() {
        // code goes here
    };

    /**
    * Display the given waypoints
    * @param {Array} waypoints
    * @param {Boolean} ignoreFirst ignore 1st waypoint 
    * @param {Boolean} display
    * @param {Boolean} center
    * @param {Boolean} forceRedraw
    */
    exports.Waypoints.displayWaypoints = function(waypoints, ignoreFirst, display, center, forceRedraw) {

        // check display conditions
        if (Array.isNullOrEmpty(waypoints)) return;
        display = display && (globals.map.getZoom() > globals.waypointLinesHideZoomLevel); // too small to be displayed

        // display each waypoint
        for (var w = 0, len = waypoints.length; w < len; w++) {
            if (display && ignoreFirst && w == 0) continue;
            var wp = waypoints[w];
            wp.display(wp.isInBounds() && display, center, forceRedraw);
        }
    };

    /**
    * Convert Array of Waypoints to Array of Google google.maps.LatLng points, aka path.
    * @param  {Array} waypoints Waypoints
    * @return {Array} path of google.maps.LatLng 
    */
    exports.Waypoints.waypointsToLatLngPath = function(waypoints) {
        var path = new Array();
        for (var i = 0, len = waypoints.length; i<len; i++) {
            var wp = waypoints[i];
            var latLng = new google.maps.LatLng(wp.latitude, wp.longitude);
            path[i] = latLng;
        }
        return path;
    };
});