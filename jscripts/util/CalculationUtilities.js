//
// Misc. calculations
//
namespace.module('vd.util', function(exports, require) {

    /**
    * Utilities for calculations.
    * @constructor
    */
    exports.UtilsCalc = function() {
        // code goes here
    };

    /**
    * Meter to feet.
    * @param  {Number} meter
    * @param  {Number} digits
    * @return {Number} feet
    */
    exports.UtilsCalc.mToFt = function(meter, digits) {
        var v = meter * 3.2808;
        return (Object.isNullOrUndefined(digits)) ? v : v.toFixed(digits) * 1;
    };

    /**
    * Feet to meter.
    * @param  {Number} feet
    * @param  {Number} digits
    * @return {Number} meter
    */
    exports.UtilsCalc.ftToM = function(feet, digits) {
        var v = feet * 0.3048;
        return (Object.isNullOrUndefined(digits)) ? v : v.toFixed(digits) * 1;
    };

    /**
    * Feet to kilometer.
    * @param  {Number} feet
    * @param  {Number} digits
    * @return {Number} kilometer
    */
    exports.UtilsCalc.ftToKm = function(feet, digits) {
        var v = exports.UtilsCalc.ftToM(feet) / 1000;
        return (Object.isNullOrUndefined(digits)) ? v : v.toFixed(digits) * 1;
    };

    /**
    * Kilometer to nautical miles.
    * @param  {Number} km
    * @param  {Number} digits
    * @return {Number} nm
    */
    exports.UtilsCalc.kmToNm = function(km, digits) {
        var v = km / 1.852;
        return (Object.isNullOrUndefined(digits)) ? v : v.toFixed(digits) * 1;
    };

    /**
    * Knots to km/h,
    * @param  {Number} kts
    * @param  {Number} digits
    * @return {Number} km/h
    */
    exports.UtilsCalc.ktsToKmh = function(kts, digits) {
        var v = kts * 1.852;
        return (Object.isNullOrUndefined(digits)) ? v : v.toFixed(digits) * 1;
    };

    /**
    * LatLon to (Google) LatLng
    *  @param  s{LatLon}
    *  @return {google.maps.LatLng}
    */
    exports.UtilsCalc.latLonToLatLng = function(latlon) {
        return new google.maps.LatLng(latlon._lat, latlon._lon);
    };

    /**
    * Google LatLng to LatLon.
    * @param   {LatLon}
    * @return {google.maps.LatLng}
    */
    exports.UtilsCalc.latLngToLatLon = function(latLng) {
        return new LatLon(latLng.lat(), latLng.lng());
    };

    /**
    * Get the distances for the given map bounds.
    * Important: The earth is a globe. Be aware this calculates the SHORTEST path, in order to get the longest
    * path calculate via center * 2.
    * @param {google.maps.LatLngBounds} bounds
    * @param {String} unit km|nm
    * @return {Array} horizontal / vertical / shortest diagonal distance in km
    */
    exports.UtilsCalc.boundsDistances = function(bounds, unit) {
        bounds = (bounds == null) ? globals.map.getBounds() : bounds;
        unit = (String.isNullOrEmpty(unit)) ? "km" : unit.toLowerCase();
        var northEast = bounds.getNorthEast();
        var southWest = bounds.getSouthWest();
        var northEastC = vd.util.UtilsCalc.latLngToLatLon(northEast);
        var northWestC = new LatLon(northEast.lat(), southWest.lng());
        var southWestC = vd.util.UtilsCalc.latLngToLatLon(southWest);
        var southEastC = new LatLon(southWest.lat(), northEast.lng());
        var diagonalKm = northEastC.distanceTo(southWestC);
        var horizontalKm = (northEastC.distanceTo(northWestC) + southEastC.distanceTo(southWestC)) / 2;
        var verticalKm = (northEastC.distanceTo(southEastC) + northWestC.distanceTo(southWestC)) / 2;
        var d = diagonalKm;
        var h = horizontalKm;
        var v = verticalKm;

        // unit
        if ("nm" == unit) {
            d = exports.kmToNm(d) * 1;
            h = exports.kmToNm(h) * 1;
            v = exports.kmToNm(v) * 1;
        }

        // bye
        var r = new Array();
        r["h"] = h;
        r["v"] = v;
        r["d"] = d;
        return r;
    };

    /**
    * Valid latitude / longitude values?
    * @param {Number} lat 
    * @param {Number} lng
    * @return {Boolean}
    */
    exports.UtilsCalc.isValidlatLon = function(lat, lng) {
        if (Object.isNullOrUndefined(lat) || Object.isNullOrUndefined(lng)) return false;
        if (isNaN(lat) || isNaN(lng)) return false;
        return true;
    };

    /**
    * Calculate the distance between two points.
    * @param {google.maps.Point} p1
    * @param {google.maps.Point} p2
    * @return{Number}
    */
    exports.UtilsCalc.pointDistance = function(p1, p2) {
        var xDiff = p1.x - p2.x;
        var yDiff = p1.y - p2.y;
        var d = Math.pow(xDiff, 2) + Math.pow(yDiff, 2);
        d = Math.sqrt(d);
        return d;
    };

    /**
    * Calculate the distance between two points
    * @param {google.maps.LatLng} c1
    * @param {google.maps.LatLng} c2
    * @return{Number}
    */
    exports.UtilsCalc.kmDistance = function(c1, c2) {
        var co1 = new LatLon(c1.lat(), c1.lng());
        var co2 = new LatLon(c2.lat(), c2.lng());
        var d = co1.distanceTo(co2);
        return d;
    };

    /**
    * Bounds distance between old and currentCenter.
    * @param {google.maps.LatLng} oldCenter
    * @return {Array} latitude / longitude difference
    */
    exports.UtilsCalc.centerDifferences = function(oldCenter) {
        var currentCenter = globals.map.getCenter();
        var latD = currentCenter.lat() - oldCenter.lat();
        var lngD = currentCenter.lng() - oldCenter.lng();
        var r = new Array();
        r["lat"] = latD < 0 ? latD * -1 : latD;
        r["lng"] = lngD < 0 ? lngD * -1 : lngD;
        return r;
    };

    /**
    * Difference of the current bounds.
    * @return {Array} latitude / longitude difference
    */
    exports.UtilsCalc.boundsDifferences = function() {
        var b = globals.map.getBounds();
        var latD = b.getNorthEast().lat() - b.getSouthWest().lat();
        var lngD = b.getNorthEast().lng() - b.getSouthWest().lng();
        var r = new Array();
        r["lat"] = latD < 0 ? latD * -1 : latD;
        r["lng"] = lngD < 0 ? lngD * -1 : lngD;
        return r;
    };

    /**
    * Is the movement just tiny or relevant?
    * @param {google.maps.LatLng} oldCenter
    * @param {Number} zoomFactor
    * @return {Boolean} relevant
    */
    exports.UtilsCalc.isRelevantMapChange = function(oldCenter, oldZoom) {
        if (oldZoom != globals.map.getZoom()) return true;
        var cDiff = exports.UtilsCalc.centerDifferences(oldCenter);
        var bDiff = exports.UtilsCalc.boundsDifferences();
        var latDev = cDiff["lat"] / bDiff["lat"] * 100;
        var lngDev = cDiff["lng"] / bDiff["lng"] * 100;
        return latDev >= globals.mapRelevantMovement || lngDev >= globals.mapRelevantMovement;
    };
});