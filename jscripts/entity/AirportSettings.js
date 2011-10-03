/**
* @module vd.entity
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity', function (exports) {

    /**
    * @classdesc The settings for an Airport.
    * @constructor
    * @param {Object} [options]
    * @author KWB
    */
    exports.AirportSettings = function (options) {
        // set the values        
        this.set(options);
    };

    /**
    * Reset values on the same object.
    * @param {Array} [options]
    */
    exports.AirportSettings.prototype.set = function (options) {
        
        // make sure we have an options object
        options = Object.ifNotNullOrUndefined(options, { });

        /**
        * Display airports.
        * @type {Boolean}
        */
        this.displayAirport = Object.ifNotNullOrUndefined(options["displayAirport"], true);
        /**
        * Display airport vicinity.
        * @type {Boolean}
        */
        this.displayAirportVicinity = Object.ifNotNullOrUndefined(options["displayAirportVicinity"], true);
        /**
        * Display ATIS.
        * @type {Boolean}
        */
        this.displayAtis = Object.ifNotNullOrUndefined(options["displayAtis"], true);
        /**
        * Display Metar.
        * @type {Boolean}
        */
        this.displayMetar = Object.ifNotNullOrUndefined(options["displayMetar"], true);
    };

    /**
    * Number of elements displayed.
    * @return {Number}
    */
    exports.AirportSettings.prototype.displayedElements = function () {
        return this.displayAirport ? 1 : 0;
    };
});