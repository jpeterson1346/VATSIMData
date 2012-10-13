/**
* @module vd.entity.base
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity.base', function (exports) {

    /**
    * @constructor
    * @classdesc Base class for objects displayed on the Google Map.
    * @param {Object} [mapProperties]
    * @author KWB
    * @since 0.7
    */
    exports.BaseEntityMap = function (mapProperties) {

        /**
        * Underlying Google map.
        * @type {google.maps.Map}     
        */
        this.map = globals.map;
        /**
        * Latitude.
        * @type {Number}     
        */
        this.latitude = null;
        /**
        * Longitude.
        * @type {Number}     
        */
        this.longitude = null;
        /**
        * Elevation in ft.
        * @type {Number}     
        */
        this.elevation = null;
        /*
        * Vicinity needs to be set by sublcass if applicable.
        * @type {google.maps.LatLngBounds}
        */
        this.vicinity = null;

        // set values
        var latitude = String.toNumber(mapProperties["latitude"], null, globals.coordinatesDigitsCalculation);
        var longitude = String.toNumber(mapProperties["longitude"], null, globals.coordinatesDigitsCalculation);
        this.setLatitudeLongitude(latitude, longitude);
        this.setElevation(mapProperties["elevation"]);

        /**
        * Displayed on map?
        * @type {Boolean}     
        */
        this.displayed = false;
        /**
        * Disposed?
        * @type {Boolean}     
        */
        this.disposed = false;
        /*
        * All overlays belonging to this entity.
        * @type {vd.gm.OverlayGroup}
        */
        this.overlays = new vd.gm.OverlayGroup(this.objectId, globals.map);
        /**
        * Already drawn?
        * @protected
        * @type {Boolean}     
        */
        this._drawn = false;
        /**
        * Declination [deg], if provided. Magnetic variation is a synonym.
        * @protected
        * @type {Number}
        * @see BaseEntityMap#variation()     
        */
        this._variation = Object.ifNotNullOrUndefined(mapProperties["variation"], null);

        /**
        * "Cached" value for grids, only valid if the corresponding methods has been called before. 
        * @protected
        * @type {Boolean}
        * @see BaseEntityMap#isInBounds     
        */
        this._isInBounds = false;

        /**
        * "Cached" value for grids, only valid if the corresponding methods has been called before. 
        * @protected
        * @type {Boolean}
        * @see BaseEntityMap#isInVicinity     
        */
        this._isInVicinity = false;
    };

    /**
    * Destructor, removing memory leak sensitive parts will go here
    * or method will be overridden by subclass.
    */
    exports.BaseEntityMap.prototype.dispose = function () {
        this.overlays.clear();
        this.overlays = null;
        this.disposed = true;
    };

    /**
    * Current position for Google Map.
    * @return {google.maps.LatLng}
    */
    exports.BaseEntityMap.prototype.latLng = function () {
        return new google.maps.LatLng(this.latitude, this.longitude);
    };

    /**
    * Current position for calculations.
    * @return {LatLon}
    */
    exports.BaseEntityMap.prototype.latLon = function () {
        return new LatLon(this.latitude, this.longitude);
    };

    /**
    * Get a vicinity around "my" lat/lng within an area specified.
    * @param {Number} latDistanceKm
    * @param {Number} lngDistanceKm
    * @return {google.maps.LatLngBounds}
    */
    exports.BaseEntityMap.prototype.getVicinity = function (latDistanceKm, lngDistanceKm) {
        var latLon = this.latLon();
        var dp = latLon.rhumbDestinationPoint(270, lngDistanceKm / 2).rhumbDestinationPoint(180, latDistanceKm / 2);
        var sw = vd.util.UtilsMap.latLonToLatLng(dp);
        dp = latLon.rhumbDestinationPoint(90, lngDistanceKm / 2).rhumbDestinationPoint(0, latDistanceKm / 2);
        var ne = vd.util.UtilsMap.latLonToLatLng(dp);
        return new google.maps.LatLngBounds(sw, ne);
    };

    /**
    * Is the given entity (e.g. a flight) within the vicinity?
    * Vicinity defines the bounds on an entity.
    * @param {vd.entity.base.BaseEntityMap} baseEntity
    * @return {Boolean}
    */
    exports.BaseEntityMap.prototype.isInVicinity = function (baseEntity) {
        if (Object.isNullOrUndefined(this.vicinity)) return false;
        if (Object.isNullOrUndefined(baseEntity)) return false;
        this._isInVicinity = this.vicinity.contains(baseEntity.latLng());
        return this._isInVicinity;
    };

    /**
    * Display this entity at the current map zoom level.
    * Needs to be overrriden by subclasses.
    * @return {Boolean}
    */
    exports.BaseEntityMap.prototype.displayedAtZoomLevel = function () {
        return true;
    };

    /**
    * Is within map bounds?
    * @return {Boolean}
    **/
    exports.BaseEntityMap.prototype.isInBounds = function () {
        if (Object.isNullOrUndefined(this.vicinity))
            this._isInBounds = this.map.getBounds().contains(this.latLng());
        else
            this._isInBounds = this.map.getBounds().intersects(this.vicinity);

        return this._isInBounds;
    };

    /**
    * Zoom the map to the object's vicinity (if there is any).
    * @param {google.maps.Map} [map]
    * @return {Boolean} true if zoom worked
    */
    exports.BaseEntityMap.prototype.zoomMapToVicinity = function (map) {
        if (Object.isNullOrUndefined(this.vicinity)) return false;
        map = Object.ifNotNullOrUndefined(map, globals.map);
        map.fitBounds(this.vicinity);
        return true;
    };

    /*
    * Magnetic variation (degrees). Magnetic variation is a synonym.
    * @return {Number}
    */
    exports.BaseEntityMap.prototype.variation = function () {
        if (!Object.isNullOrUndefined(this._variation)) return this._variation; // provided
        return globals.worldMagneticModel.declination(vd.util.UtilsCalc.ftToKm(this.elevation), this.latitude, this.longitude, globals.worldMagneticModelDate).toFixed(globals.angelsDigitsDisplayed) * 1;
    };

    // Set new latitude / longitude values (rounding, casting).
    // @param {Number|String} latitude
    // @param {Number|String} longitude
    exports.BaseEntityMap.prototype.setLatitudeLongitude = function (latitude, longitude) {
        this.latitude = Object.isNumber(latitude) ? latitude.toFixed(globals.coordinatesDigitsCalculation) * 1 : null;
        this.longitude = Object.isNumber(longitude) ? longitude.toFixed(globals.coordinatesDigitsCalculation) * 1 : null;
    };

    // Set an elevation value.
    // @param {Number} elevation in ft
    // @param {Boolean} inMeters unit is in meters and will be converted in feet
    exports.BaseEntityMap.prototype.setElevation = function (elevation, inMeters) {
        this.elevation = String.toNumber(elevation, null, 0);
        if (!Object.isNumber(elevation)) return;
        if (globals.mapElevationZeroCutoff && this.elevation < 0) {
            this.elevation = 0;
        } else {
            inMeters = Object.ifNotNullOrUndefined(inMeters, false);
            if (inMeters) this.elevation = this.elevation.ftToM(this.elevation, 2);
        }
    };

    // @method toPropertyValue
    // @return {Object} with property / value pairs
    exports.BaseEntityMap.prototype.toPropertyValue = function () {
        var pv = new Array();
        pv["variation"] = this.variationAndUnit();
        pv["latitude"] = this.latitude.toFixed(globals.coordinatesDigitsDisplayed);
        pv["longitude"] = this.longitude.toFixed(globals.coordinatesDigitsDisplayed);

        // not always displayed
        if (Object.isNumber(this.altitude)) pv["altitude"] = this.altitude + "ft / " + vd.util.UtilsCalc.ftToM(this.altitude).toFixed(globals.altitudesDigitsDisplayed) + "m";
        if (Object.isNumber(this.elevation)) pv["elevation"] = this.elevation.toFixed(0) + "ft / " + vd.util.UtilsCalc.ftToM(this.elevation).toFixed(globals.altitudesDigitsDisplayed) + "m";
        return pv;
    };

    // Compare the locations of 2 entities.
    // @param {BaseEntityMap} otherEntity
    exports.BaseEntityMap.prototype.hasSameLocation = function (otherEntity) {
        if (Object.isNullOrUndefined(otherEntity)) return false;
        return vd.util.UtilsMap.hasSameLocation(this.latitude, this.longitude, otherEntity.latitude, otherEntity.longitude);
    };

    // Same location as the provided latLng.
    // @param {google.maps.LatLng}
    exports.BaseEntityMap.prototype.hasSameLatLng = function (latLng) {
        if (Object.isNullOrUndefined(latLng)) return false;
        return vd.util.UtilsMap.hasSameLocation(this.latitude, this.longitude, latLng.lat(), latLng.lat());
    };

    /**
    * Find entities within given distance.
    * @param {Array}   entities
    * @param {Number}  threshold
    * @param {Boolean} [onlyDisplayed] check only displayed entities, faster
    * @return {Array} array of {see vd.entity.helper.Edge}
    */
    exports.BaseEntityMap.prototype.entitiesWithinPointDistance = function (entities, threshold, onlyDisplayed) {
        return vd.util.UtilsMap.entitiesWithinPointDistance(this, entities, threshold, onlyDisplayed);
    };

    /**
    * Find entities within given distance.
    * @param {Array}   entities
    * @param {Number}  threshold
    * @param {Boolean} [onlyDisplayed] check only displayed entities, faster
    * @return {Array} array of edges vd.entity.helper.Edge
    * @see vd.util.UtilsMap.entitiesWithinPixelDistance
    * @see vd.entity.helper.Edge
    */
    exports.BaseEntityMap.prototype.entitiesWithinPixelDistance = function (entities, threshold, onlyDisplayed) {
        return vd.util.UtilsMap.entitiesWithinPixelDistance(this, entities, threshold, onlyDisplayed);
    };

    /**
    * Get the point coordinates or null if not displayed.
    * @return {google.maps.Point}
    * @see BaseEntityMap#displayed
    */
    exports.BaseEntityMap.prototype.point = function () {
        if (Object.isNullOrUndefined(this.map)) return null;
        var p = this.map.getProjection();
        return Object.isNullOrUndefined(p) ? null : p.fromLatLngToPoint(this.latLng());
    };

    /**
    * Display the vicinity if there are given values.
    * @param {Object} polygonParams
    */
    exports.BaseEntityMap.prototype.displayVicinity = function (polygonParams) {
        if (Object.isNullOrUndefined(this.vicinity)) return;
        if (Object.isNullOrUndefined(this.map)) return;
        if (Object.isNullOrUndefined(polygonParams)) return;
        var coords = vd.util.UtilsMap.boundsToPath(this.vicinity);
        var vicinityBounds = new google.maps.Polygon({
            paths: coords,
            strokeColor: polygonParams.strokeColor,
            strokeOpacity: polygonParams.strokeOpacity,
            strokeWeight: polygonParams.strokeWeight,
            fillColor: polygonParams.fillColor,
            fillOpacity: polygonParams.fillOpacity
        });
        vicinityBounds.setMap(this.map);
        this.overlays.add(vicinityBounds);
    };

    /**
    * Get the point coordinates or null if not displayed @see BaseEntityMap.displayed.
    * @return {google.maps.Point}
    */
    exports.BaseEntityMap.prototype.pixelPoint = function () {
        if (Object.isNullOrUndefined(globals.mapOverlayView)) return null;
        var p = globals.mapOverlayView.getProjection();
        if (Object.isNullOrUndefined(p)) return null;
        var pp = p.fromLatLngToDivPixel(this.latLng());
        return pp;
    };

    /**
    * Elevation with unit.
    * @return {String}
    */
    exports.BaseEntityMap.prototype.elevationAndUnit = function () {
        if (!Object.isNumber(this.elevation)) return "?";
        return ("m" == globals.unitAltitude) ? vd.util.UtilsCalc.ftToM(this.elevation).toFixed(0) + "m" : this.elevation + "ft";
    };

    /**
    * String representation.
    * @return {String}
    */
    exports.BaseEntityMap.prototype.toString = function () {
        var s = this.displayed ? "displayed" : "not displayed";
        s = s.appendIfNotEmpty([this.latitude, this.longitude, this.altitude], " ");
        return s;
    };

    /**
    * Display the given entities (if in bounds).
    * @param {Array} entities
    * @param {Boolean} display
    * @param {Boolean} [forceRedraw] redraw, e.g. because settings changed
    */
    exports.BaseEntityMap.display = function (entities, display, forceRedraw) {
        if (Array.isNullOrEmpty(entities)) return;
        forceRedraw = Object.ifNotNullOrUndefined(forceRedraw, false);
        for (var e = 0, len = entities.length; e < len; e++) {
            var entity = entities[e];
            entity.display(display && entity.isInBounds(), false, forceRedraw);
        }
    };

    /**
    * Get all overlays of the given entities.
    * @param  {Array} entities
    * @return {Array} overlays
    */
    exports.BaseEntityMap.overlays = function (entities) {
        var overlays = new Array();
        if (Array.isNullOrEmpty(entities)) return overlays;
        for (var e = 0, len = entities.length; e < len; e++) {
            var entity = entities[e];
            if (!Array.isNullOrEmpty(entity.overlays)) overlays.concat(entity.overlays);
        }
        return overlays;
    };

    /**
    * Get the google.maps.latLng values of the given entities.
    * @param {Array} entities
    * @param {Number} maxNumber maximum number of entities considered
    * @return {Array} google.map.latlng values
    */
    exports.BaseEntityMap.getLatLngValues = function (entities, maxNumber) {
        var latlngs = new Array();
        if (Array.isNullOrEmpty(entities)) return latlngs;
        maxNumber = Object.ifNotNullOrUndefined(maxNumber, entities.length);
        for (var f = 0, len = entities.length; f < len; f++) {
            if (f >= maxNumber) break;
            var flight = entities[f];
            latlngs.push(flight.latLng());
        }
        return latlngs;
    };

    /**
    * Finder for displayed / hidden.
    * @param  {Array}   entities
    * @param  {Boolean} [displayed]
    * @return {Array} entities found
    */
    exports.BaseEntityMap.findByDisplayed = function (entities, displayed) {
        var foundEntities = new Array();
        displayed = Object.ifNotNullOrUndefined(displayed, true);
        for (var e = 0, len = entities.length; e < len; e++) {
            var entity = entities[e];
            if (entity.displayed == displayed) foundEntities.push(entity);
        }
        return foundEntities;
    };

    /**
    * Find if in bounds / not in bounds.
    * @param  {Array}   entities
    * @param  {Boolean} inBounds
    * @return {Array} entities found
    **/
    exports.BaseEntityMap.findInBounds = function (entities, inBounds) {
        var foundEntities = new Array();
        inBounds = Object.ifNotNullOrUndefined(inBounds, true);
        for (var e = 0, len = entities.length; e < len; e++) {
            var entity = entities[e];
            if (entity.isInBounds() == inBounds) foundEntities.push(entity);
        }
        return foundEntities;
    };

    /**
    * Find by same location.
    * @param  {Array} entities
    * @param  {google.maps.LatLng} latLng
    * @return {Array} entities found
    **/
    exports.BaseEntityMap.findByLatLng = function (entities, latLng) {
        var foundEntities = new Array();
        for (var e = 0, len = entities.length; e < len; e++) {
            var entity = entities[e];
            if (entity.hasSameLatLng(latLng)) foundEntities.push(entity);
        }
        return foundEntities;
    };
});