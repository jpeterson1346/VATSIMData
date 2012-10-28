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
        * Display VORs.
        * @type {Boolean}
        */
        this.displayVOR = Object.ifNotNullOrUndefined(options["displayVOR"], true);

        /**
        * Display NDBs.
        * @type {Boolean}
        */
        this.displayNDB = Object.ifNotNullOrUndefined(options["displayNDB"], true);
    };

    /**
    * Number of elements displayed.
    * @return {Number}
    */
    exports.NavaidSettings.prototype.displayedElements = function () {
        var c = this.displayNDB ? 1 : 0;
        if (this.displayVOR) c++;
        return c;
    };
});