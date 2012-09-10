/**
* @module vd.entity.helper
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity.helper', function (exports) {

    /**
    * @classdesc 
    * Edge containing distance between two given points.
    * Every distance needs to be calculated before it can be used, because it depends on the 
    * Zoom level / position.
    * @constructor
    * @param {Array} edgeProperties
    */
    exports.Edge = function (edgeProperties) {
        /**
        * Point distance.
        * @type {Number}
        */
        this.pointDistance = null;
        /**
        * Pixel distance.
        * @type {Number}
        */
        this.pixelDistance = null;
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
            if (this.hasOwnProperty(argName)) this[argName] = edgeProperties[argName];
        }
        
        if (!Object.isNullOrUndefined(edgeProperties["calculatePixelDistance"]) && edgeProperties["calculatePixelDistance"]) this.calculatePixelDistance();
        if (!Object.isNullOrUndefined(edgeProperties["calculatePointDistance"]) && edgeProperties["calculatePointDistance"]) this.calculatePointDistance();
        if (!Object.isNullOrUndefined(edgeProperties["calculateKmDistance"]) && edgeProperties["calculateKmDistance"]) this.calculateKmDistance();
    };

    /**
    * Calculate pixel distance.
    * @return {Number}
    */
    exports.Edge.prototype.calculatePixelDistance = function () {
        if (!this.hasFromTo()) return null;
        this.pixelDistance = vd.util.UtilsCalc.pointDistance(this.from.pixelPoint(), this.to.pixelPoint());
        return this.pixelDistance;
    };

    /**
    * Calculate the km distance.
    * @return {Number}
    */
    exports.Edge.prototype.calculateKmDistance = function () {
        if (!this.hasFromTo()) return null;
        this.kmDistance = vd.util.UtilsCalc.kmDistance(this.from.point(), this.to.point());
        return this.kmDistance;
    };

    /**
    * Calculate the point distance.
    * @return {Number}
    */
    exports.Edge.prototype.calculatePointDistance = function () {
        if (!this.hasFromTo()) return null;
        this.pointDistance = vd.util.UtilsCalc.pointDistance(this.from.point(), this.to.point());
        return this.pointDistance;
    };

    /**
    * Is from/to initialized?
    * @return {Boolean}
    */
    exports.Edge.prototype.hasFromTo = function () {
        return (!(Object.isNullOrUndefined(this.from) || Object.isNullOrUndefined(this.to)));
    };

    /**
    * Is the edge within the given point distance?
    * @param {Number} threshold
    * @return {Boolean}
    */
    exports.Edge.prototype.isWithinPointDistance = function (threshold) {
        if (this.pointDistance < 0) return false; // not calculated
        return threshold >= this.pointDistance;
    };

    /**
    * Is the edge within the given pixel distance?
    * @param {Number} threshold
    * @return {Boolean}
    */
    exports.Edge.prototype.isWithinPixelDistance = function (threshold) {
        if (this.pixelDistance < 0) return false; // not calculated
        return threshold >= this.pixelDistance;
    };
});