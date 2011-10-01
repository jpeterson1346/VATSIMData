/**
* @module vd.gc
*/
namespace.module('vd.gc', function(exports, require) {

    /**
    * The settings for an altitude profile.
    * @param {Object} [properties]
    */
    exports.AltitudeProfileSettings = function(properties) {
        this.set(properties);
    };

    /**
    * Reset values on this object.
    * @param {Array} [properties]
    */
    exports.AltitudeProfileSettings.prototype.set = function(properties) {
        /**
        * Font size for axis.
        * @type{Number}
        */
        this.axisFontSize = 10;
        /**
        * Background Color for the chart.
        * @type{Number}
        */
        this.backgroundColor = "transparent";
        /**
        * Color for for altitude profile dots.
        * @type{Number}
        */
        this.altitudeColor = "blue";
        /**
        * Point size (pt) for altitude profile dots.
        * @type{Number}
        */
        this.altitudePointSize = 4;
        /**
        * Color for elevation profile dots.
        * @type{Number}
        */
        this.elevationColor = "black";
        /**
        * Point size (pt) for elevation dots.
        * @type{Number}
        */
        this.elevationPointSize = 4;
        /**
        * Display elevation profile?
        * @type{Boolean}
        */
        this.elevationProfile = true;
        /**
        * Color for for elevation profile dots.
        * @type{Number}
        */
        this.elevationProfileColor = "gray";
        /**
        * Point size (pt) for elevation profile dots.
        * @type{Number}
        */
        this.elevationProfilePointSize = 1;

        // override with arguments
        if (!Object.isNullOrUndefined(properties)) {
            for (var argName in properties) {
                this[argName] = properties[argName];
            }
        }
    };
});