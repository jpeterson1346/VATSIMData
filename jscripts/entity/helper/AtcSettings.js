/**
* @module vd.entity.helper
*/
namespace.module('vd.entity.helper', function (exports, require) {

    /**
    * @constructor
    * @classdesc The settings for ATCs
    * @param {Array} [properties]
    */
    exports.AtcSettings = function (properties) {
        this.set(properties);
    };

    /**
    * Reset values on the same object.
    * @param {Array} [properties]
    */
    exports.AtcSettings.prototype.set = function (properties) {

        /**
        * Display ATC enties at all.
        * @type {Boolean}
        */
        this.displayAtc = true; // display at all
        /**
        * Display callsign.
        * @type {Boolean}
        */
        this.displayCallsign = true;
        /**
        * Display controller.
        * @type {Boolean}
        */
        this.displayController = true;
        /**
        * Display id.
        * @type {Boolean}
        */
        this.displayId = true;
        /**
        * Display type ATIS ATC entities.
        * @type {Boolean}
        */
        this.displayAtis = true;
        /**
        * Display type ATIS ATC entities.
        * @type {Boolean}
        */
        this.displayAtisAtc = true;
        /**
        * Display type Airport ATC entities.
        * @type {Boolean}
        */
        this.displayAirportAtc = true;
        /**
        * Display type Area ATC entities.
        * @type {Boolean}
        */
        this.displayAreaAtc = true;
        /**
        * Display type Observer ATC entities.
        * @type {Boolean}
        */
        this.displayObservers = true;
        
        // override with arguments
        if (!Object.isNullOrUndefined(properties)) {
            for (var argName in properties) {
                this[argName] = properties[argName];
            }
        }
    };

    /**
    * Number of elements displayed.
    * @return {Number}
    */
    exports.AtcSettings.prototype.displayedElements = function () {
        var c = 0;
        if (this.displayCallsign) c++;
        if (this.displayController) c++;
        if (this.displayId) c++;
        return c;
    };
});