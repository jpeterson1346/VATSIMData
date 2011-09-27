﻿/**
* @module vd.gm
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.gm', function (exports) {

    /**
    * @classdesc Elevation methods.
    * @constructor
    * @author KWB
    */
    exports.Elevation = function () {
        //
        // code
        //
    };

    /**
    * Update (asynchronously) the elevations of the given entities.
    * @param  {Array} entities
    * @return {Boolean} true, if the event is completely fired (does not mean it is successful)
    */
    exports.Elevation.getElevationsForEntities = function (entities) {
        if (Array.isNullOrEmpty(entities)) return false;
        if (!globals.elevationServiceEnabled) {
            globals.log.info("Elevation service is disabled");
            return false;
        }

        var runTime = new vd.util.TimeDiff();
        var latLngValues = vd.entity.base.BaseEntityMap.getLatLngValues(entities, globals.elevationSingleSamplesMax);

        // Create a LocationElevationRequest 
        // see http://code.google.com/apis/maps/documentation/javascript/services.html#Elevation
        var positionalRequest = { 'locations': latLngValues };

        // Initiate the location request
        globals.elevationService.getElevationForLocations(positionalRequest, function (results, status) {
            if (status == google.maps.ElevationStatus.OK) {
                if (!Array.isNullOrEmpty(results)) {
                    for (var r = 0, len = results.length; r < len; r++) {
                        var result = results[r];
                        var elevation = vd.util.UtilsCalc.mToFt(result.elevation, 0); // AGL in ft
                        var entitiesToBeUpdated = vd.entity.base.BaseEntityMap.findByLatLng(entities, result.location);
                        for (var e = 0, lenE = entitiesToBeUpdated.length; e < lenE; e++) {
                            var entityToBeUpdated = entitiesToBeUpdated[e];
                            entityToBeUpdated.setElevation(elevation);
                        }
                    }
                    globals.log.trace("Retrieved " + results.length + " elevations for " + entities.length + " entites from Google elevation service, " + runTime.getDiffFormatted());
                }
            } else {
                globals.log.warn("Elevation request for " + entities.length + " entities failed, status: " + status);
            }
        });

        var completely = latLngValues.length == entities.length;
        if (!completely) globals.log.warn("Too many entities " + entities.length + ", considered " + globals.elevationSingleSamplesMax);
        return completely;
    };

    /**
    * Get elevations for a given number of horizontal / vertical pathes.
    * @param {google.maps.LatLngBounds} bounds
    * @param {String} mode h=horizontal, v=vertical, d=diagonal
    * @param {Number} verticalLines
    * @param {function} callback (result, status)
    */
    exports.Elevation.getElevationsForBounds = function (bounds, mode, callback) {
        if (Object.isNullOrUndefined(callback)) return;
        if (!globals.elevationServiceEnabled) {
            globals.log.info("Elevation service is disabled");
            return;
        }
        bounds = Object.ifNotNullOrUndefined(bounds, globals.map.getBounds());
        mode = String.isNullOrEmpty(mode) ? "d" : mode.toLowerCase().substr(0, 1);
        var sw = bounds.getSouthWest();
        var ne = bounds.getNorthEast();
        var c = bounds.getCenter();
        var path;
        switch (mode) {
            case "d":
                path = [sw, ne];
                break;
            case "h":
                path = [new google.maps.LatLng(c.lat(), sw.lng()), new google.maps.LatLng(c.lat(), ne.lng())];
                break;
            case "v":
                path = [new google.maps.LatLng(ne.lat(), c.lng()), new google.maps.LatLng(sw.lat(), c.lng())];
                break;
            default:
                path = [sw, ne];
                break;
        }

        // Initiate the path request.
        globals.elevationService.getElevationAlongPath({
            path: path,
            samples: globals.elevationServicePathRequestSamples
        }, callback);
    };
});