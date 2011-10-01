/**
* @module vd.entity
*/
namespace.module('vd.entity', function (exports, require) {

    /**
    * @classdesc The settings for an Airport.
    * @constructor
    * @param {Array} [options]
    */
    exports.AirportSettings = function (options) {
        this.set(options);
    };

    /**
    * Reset values on the same object.
    * @param {Array} [options]
    */
    exports.AirportSettings.prototype.set = function (options) {
        /**
        * Display airports.
        * @type {Boolean}
        */
        this.displayAirport = true;
        /**
        * Display airport vicinity.
        * @type {Boolean}
        */
        this.displayAirportVicinity = true;
        /**
        * Display ATIS.
        * @type {Boolean}
        */
        this.displayAtis = true;
        /**
        * Display Metar.
        * @type {Boolean}
        */
        this.displayMetar = true;

        // override with arguments
        if (!Object.isNullOrUndefined(options)) {
            for (var argName in options) {
                this[argName] = options[argName];
            }
        }
    };

    /**
    * Number of elements displayed.
    * @return {Number}
    */
    exports.AirportSettings.prototype.displayedElements = function () {
        return this.displayAirport ? 1 : 0;
    };
});