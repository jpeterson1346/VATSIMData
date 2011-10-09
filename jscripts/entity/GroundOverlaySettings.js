/**
* @module vd.entity
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity', function(exports) {

    /**
    * @classdesc The settings for a ground overlays.
    * @constructor
    * @param {Object} [options]
    * @author KWB
    */
    exports.GroundOverlaySettings = function(options) {
        // set the values        
        this.set(options);
    };

    /**
    * Reset values on the same object.
    * @param {Array} [options]
    */
    exports.GroundOverlaySettings.prototype.set = function(options) {

        // make sure we have an options object
        options = Object.ifNotNullOrUndefined(options, { });

        /**
        * Display overlays at all.
        * @type {Boolean}
        */
        this.displayOverlays = Object.ifNotNullOrUndefined(options["displayOverlays"], true);
    };

    /**
    * Number of elements displayed.
    * @return {Number}
    */
    exports.GroundOverlaySettings.prototype.displayedElements = function() {
        return this.displayOverlays ? 1 : 0;
    };
});