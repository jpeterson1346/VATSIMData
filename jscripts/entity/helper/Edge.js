/**
* @module vd.entity.helper
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity.helper', function(exports) {

    /**
    * @classdesc Edge containing distance between two given points.
    * @constructor
    * @param {Array} edgeProperties
    */
    exports.Edge = function(edgeProperties) {
        /**
        * Point distance.
        * @type {Number}
        */
        this.pointDistance = null;
        /**
        * Pixel distance.
        * @type {Number}
        */
        this.pixelDistance = -1;
        /**
        * Distance in km.
        * @type {Number}
        */
        this.kmDistance = null;
        /**
        * Node from.
        * @type {BaseEntityMap}
        */
        this.from = null;
        /**
        * Node to.
        * @type {BaseEntityMap}
        */
        this.to = null;

        // override with arguments
        for (var argName in edgeProperties) {
            this[argName] = edgeProperties[argName];
        }
    };

    /**
    * Calculate pixel distance.
    */
    exports.Edge.prototype.calculatePixelDistance = function() {
        if (!this.hasFromTo()) return;
        this.pixelDistance = vd.util.UtilsCalc.pointDistance(this.from.pixelPoint(), this.to.pixelPoint());
    };

    /**
    * Calculate the km distance.
    */
    exports.Edge.prototype.calculateKmDistance = function() {
        if (!this.hasFromTo()) return;
        this.kmDistance = vd.util.UtilsCalc.kmDistance(this.from.point(), this.to.point());
    };

    /**
    * Calculate the point distance.
    */
    exports.Edge.prototype.calculatePointDistance = function() {
        if (!this.hasFromTo()) return;
        this.pixelDistance = vd.util.UtilsCalc.pointDistance(this.from.point(), this.to.point());
    };

    /**
    * Is from/to initialized?
    * @return {Boolean}
    */
    exports.Edge.prototype.hasFromTo = function() {
        return (!(Object.isNullOrUndefined(this.from) || Object.isNullOrUndefined(this.to)));
    };

    /**
    * Is the edge within the given point distance?
    * @param {Number} threshold
    * @return {Boolean}
    */
    exports.Edge.prototype.isWithinPointDistance = function(threshold) {
        if (this.pointDistance < 0) return false; // not calculated
        return threshold >= this.pointDistance;
    };

    /**
    * Is the edge within the given pixel distance?
    * @param {Number} threshold
    * @return {Boolean}
    */
    exports.Edge.prototype.isWithinPixelDistance = function(threshold) {
        if (this.pixelDistance < 0) return false; // not calculated
        return threshold >= this.pixelDistance;
    };
});