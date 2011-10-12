/**
* @module vd.util
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.util', function (exports) {

    /**
    * Utilities for the maps.
    * @constructor
    */
    exports.UtilsMap = function () {
        // code goes here
    };

    /**
    * Get formatted latitude / longitude values.
    * @param {google.maps.LatLng} latLng
    * @param {Number} [precision]
    * @return {Array} array with formatted strings latitude/longitude
    */
    exports.UtilsMap.formatLatLngValues = function (latLng, precision) {
        precision = precision == null ? 6 : precision;
        var lat = latLng.lat().toFixed(precision);
        var lng = latLng.lng().toFixed(precision);
        var r = new Array();
        r["lat"] = lat;
        r["lng"] = lng;
        r["lon"] = lng;
        return r;
    };

    /**
    * Same location?
    * @param {Number} lat1
    * @param {Number} lng2
    * @param {Number} lat2
    * @param {Number} lng2
    **/
    exports.UtilsMap.hasSameLocation = function (lat1, lng1, lat2, lng2) {
        if (lat1 == lat2 && lng1 == lng2) return true;
        // try formatting
        if (lat1.toFixed(globals.coordinatesDigitsCalculation) != lat2.toFixed(globals.coordinatesDigitsCalculation)) return false;
        if (lng2.toFixed(globals.coordinatesDigitsCalculation) != lng2.toFixed(globals.coordinatesDigitsCalculation)) return false;
        return true;
    };

    /**
    * Convert the bounds to a path (corners).
    * @param  {google.maps.latLngBounds} bounds
    * @return {Array}
    */
    exports.UtilsMap.boundsToPath = function (bounds) {
        bounds = Object.ifNotNullOrUndefined(bounds, globals.map);
        var ne = bounds.getNorthEast();
        var sw = bounds.getSouthWest();
        var nw = new google.maps.LatLng(ne.lat(), sw.lng());
        var se = new google.maps.LatLng(sw.lat(), ne.lng());
        return [ne, nw, sw, se];
    };

    /**
    * Find entities within given distance.
    * @param {Atc|Flight|AtcGroup} entity
    * @param {Array} entities 
    * @param {Number} threshold
    * @param {Boolean} onlyDisplayed check only displayed entities, faster
    * @return {Array} array of {see vd.entity.helper.Edge}
    */
    exports.UtilsMap.entitiesWithinPointDistance = function (entity, checkEntities, threshold, onlyDisplayed) {
        onlyDisplayed = Object.isNullOrUndefined(onlyDisplayed) ? true : onlyDisplayed;
        var edges = new Array();
        for (var e in checkEntities) {
            var ce = checkEntities[e];
            if (ce == entity || (onlyDisplayed && !ce.displayed)) continue;
            var edge = new vd.entity.helper.Edge({ from: entity, to: ce });
            edge.calculatePointDistance();
            if (edge.isWithinPointDistance(threshold)) edges.push(edge);
        }
        return edges;
    };

    /**
    * Find entities within given distance.
    * @param {Atc|Flight|AtcGroup} entity
    * @param {Array}   entities 
    * @param {Number}  threshold
    * @param {Boolean} [onlyDisplayed] check only displayed entities, faster
    * @return {Array} array of {see vd.entity.helper.Edge}
    */
    exports.UtilsMap.entitiesWithinPixelDistance = function (entity, entities, threshold, onlyDisplayed) {
        onlyDisplayed = Object.ifNotNullOrUndefined(onlyDisplayed, true);
        var edges = new Array();
        for (var e in entities) {
            var ce = entities[e];
            if (ce == entity || (onlyDisplayed && !ce.displayed)) continue;
            var edge = new vd.entity.helper.Edge({ from: entity, to: ce, calculatePixelDistance: true });
            if (edge.isWithinPixelDistance(threshold)) edges.push(edge);
        }
        return edges;
    };

    /**
    * From LatLon to google.maps.LatLng.
    * @param {LatLon} latLon
    * @return google.maps.LatLng
    */
    exports.UtilsMap.latLonToLatLng = function (latLon) {
        return new google.maps.LatLng(latLon.lat(), latLon.lon());
    };
});