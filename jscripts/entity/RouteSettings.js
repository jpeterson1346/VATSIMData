/**
* @module vd.entity
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity', function(exports) {

    /**
    * @classdesc The settings for a Route.
    * @constructor
    * @param {Object} [options]
    * @author KWB
    */
    exports.RouteSettings = function(options) {
        // set the options
        this.set(options);
    };

    /**
    * Reset values on the same object.
    * @param {Array} [options]
    */
    exports.RouteSettings.prototype.set = function (options) {

        // make sure we have an options object
        options = Object.ifNotNullOrUndefined(options, {});
        
        /**
        * Display Route.
        * @type {Boolean}
        */
        this.displayRoute = Object.ifNotNullOrUndefined(options["displayRoute"], true);
    };

    /**
    * Number of elements displayed.
    * @return {Number}
    */
    exports.RouteSettings.prototype.displayedElements = function() {
        return this.displayRoute ? 1 : 0;
    };
});