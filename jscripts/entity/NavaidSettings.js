/**
* @module vd.entity
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity', function (exports) {

    /**
    * @classdesc The settings for Navaids (VOR, NDB).
    * @constructor
    * @param {Object} [options]
    * @author KWB
    */
    exports.NavaidSettings = function (options) {
        // set the options
        this.set(options);
    };

    /**
    * Reset values on the same object.
    * @param {Array} [options]
    */
    exports.NavaidSettings.prototype.set = function (options) {

        // make sure we have an options object
        options = Object.ifNotNullOrUndefined(options, {});
        /**
        * Display VORs?
        * @type {Boolean}
        */
        this.displayVOR = Object.ifNotNullOrUndefined(options["displayVOR"], true);
        /**
        * Display NDBs?
        * @type {Boolean}
        */
        this.displayNDB = Object.ifNotNullOrUndefined(options["displayNDB"], true);
        /**
        * Display TACANs?
        * @type {Boolean}
        */
        this.displayTACAN = Object.ifNotNullOrUndefined(options["displayTACAN"], true);
        /**
        * Display navaid at all?
        * @type {Boolean}
        */
        this.displayNavaid = Object.ifNotNullOrUndefined(options["displayNavaids"],
            this.displayVOR || this.displayTACAN || this.displayNDB);

        /**
        * Display name?
        * @type {Boolean}
        */
        this.displayName = Object.ifNotNullOrUndefined(options["displayName"], false);
    };

    /**
    * Number of elements displayed.
    * @return {Number}
    */
    exports.NavaidSettings.prototype.displayedElements = function () {
        if (!this.displayNavaid) return 0;
        var c = this.displayFrequency ? 1 : 0;
        if (this.displayName) c++;
        return c;
    };
});