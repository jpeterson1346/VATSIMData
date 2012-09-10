/**
* @module vd.entity
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity', function(exports, require) {

    var entityBase = require("vd.entity.base");
    var util = require("vd.util.Utils");

    /**
    * @constructor
    * @classdesc Route, a route from startPoint to endPoint.
    * @param {Object} routeProperties
    * @param {RouteSettings} [routeSettings]
    * @extends vd.entity.module:base.BaseEntityVatsimOnMap
    * @see vd.entity.module:helper.RouteParser
    * @author KWB
    */
    exports.Route = function(routeProperties, routeSettings) {

        // inherit attributes
        vd.entity.base.BaseEntityVatsimOnMap.call(this, routeProperties);

        /**
        * Waypoints.
        * @type {vd.entity.helper.Waypoint}
        */
        this.waypoints = Object.ifNotNullOrUndefined(routeProperties["waypoints"], new Array());
        /**
        * Route settings.
        * @type {vd.entity.RouteSettings}
        */
        this.routeSettings = Object.ifNotNullOrUndefined(routeSettings, globals.routeSettings);
    };

    /**
    * Destructor.
    */
    exports.Route.prototype.dispose = function() {
        vd.entity.helper.Waypoints.dispose(this.waypoints);
        this.overlays.clear();
        this.dispose$BaseEntityVatsimOnMap();
    };

    /**
    * Display on map.
    * @param {Boolean} display
    * @param {Boolean} center Center on the map
    * @param {Boolean} [forceRedraw] redraw, e.g. because settings changed
    */
    exports.Route.prototype.display = function(display, center, forceRedraw) {

        // display checks
        display = display && this.routeSettings.displayRoute;

        // display    
        if (display) {
            vd.entity.helper.Waypoints.displayWaypoints(this.waypoints, display, center, forceRedraw);
            this._draw(forceRedraw);
        }
        this.overlays.display(true);
    };

    /**
    * Draw the entity.
    * @private
    * @param {Boolean} [forceRedraw]
    */
    exports.Route.prototype._draw = function(forceRedraw) {
        if (!forceRedraw && this._drawn) return;

        // clean up
        if (!Object.isNullOrUndefined(this.overlays) && !this.overlays.isEmpty()) {
            this.overlays.clear();
        }

        // draw lines between waypoints
        if (!Array.isNullOrEmpty(this.waypoints)) {
            var path = vd.entity.helper.Waypoints.waypointsToLatLngPath(this.waypoints);
            var line = new google.maps.Polyline({
                    clickable: false,
                    geodesic: true,
                    path: path,
                    strokeColor: globals.styles.wpRouteLineColor,
                    strokeOpacity: globals.styles.wpRouteLineOpacity,
                    strokeWeight: globals.styles.wpRouteLineStrokeWeight,
                    zIndex: 0
                });
            this.overlays.add(line);
        }

        // mark as drawn    
        this._drawn = true;
    };

    /**
    * Bounds of route.
    * @return {googge.maps.LatLngBounds}
    */
    exports.Route.prototype.getBounds = function() {
        return vd.entity.helper.Waypoints.getBounds(this.waypoints);
    };

    /**
    * String representation.
    * @return {String}
    */
    exports.Route.prototype.toString = function() {
        var s = "";
        s = s.appendIfNotEmpty(this.toString$BaseEntityVatsimOnMap(), " - ");
        return s;
    };

    // Inheritance must be last!
    util.inheritPrototypes(exports.Route, entityBase.BaseEntityVatsimOnMap, "BaseEntityVatsimOnMap");
});