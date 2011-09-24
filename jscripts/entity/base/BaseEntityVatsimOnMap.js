/**
* @module vd.entity.base
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity.base', function(exports, require) {

    var entityBase = require("vd.entity.base");
    var util = require("vd.util.Utils");

    /**
    * @classdesc Combines the base entities for Vatsim and Google Map objects.
    * @constructor
    * @param {Object} argOpts
    * @extends vd.entity.module:base.BaseEntityMap
    * @extends vd.entity.module:base.BaseEntityVatsim
    * @author KWB
    */
    exports.BaseEntityVatsimOnMap = function(argOpts) {
        // see http://stackoverflow.com/questions/2107556/how-to-inherit-from-a-class-in-javascript/2107586#2107586
        // after this, the subclasses are merged into flight
        vd.entity.base.BaseEntityMap.call(this, argOpts);
        vd.entity.base.BaseEntityVatsim.call(this, argOpts);
    };

    /**
    * Destructor, removing memory leak sensitive parts will go here
    * or method will be overridden by subclass.
    */
    exports.BaseEntityVatsimOnMap.prototype.dispose = function() {
        this.dispose$BaseEntityVatsim();
        this.dispose$BaseEntityMap();
    };

    /**
    * Property / value pairs for properties.
    * @return {Object} with property / value pairs
    */
    exports.BaseEntityVatsimOnMap.prototype.toPropertyValue = function() {
        var pv = this.toPropertyValue$BaseEntityVatsim();
        var pvm = this.toPropertyValue$BaseEntityMap();
        Object.appendProperties(pv, pvm);
        var h = this.height();
        if (Object.isNumber(h)) pv["height"] = h.toFixed(0) + "ft / " + vd.util.UtilsCalc.ftToM(h).toFixed(globals.altitudesDigitsDisplayed) + "m";
        return pv;
    };

    /**
    * Calculate -if possible - height.
    * @return {Number}
    */
    exports.BaseEntityVatsimOnMap.prototype.height = function() {
        if (!Object.isNumber(this.elevation) || !Object.isNumber(this.altitude)) return null;
        var h = this.altitude - this.elevation; // in ft!
        return h < 0 ? 0 : h;
    };

    /**
    * Height with unit.
    * @return {String}
    */
    exports.BaseEntityVatsimOnMap.prototype.heightAndUnit = function() {
        var h = this.height();
        if (!Object.isNumber(h)) return "?";
        return ("m" == globals.unitAltitude) ? vd.util.UtilsCalc.ftToM(h).toFixed(0) + "m" : h.toFixed(0) + "ft";
    };

    /**
    * String representation.
    * @return {String}
    */
    exports.BaseEntityVatsimOnMap.prototype.toString = function() {
        var s = this.toString$BaseEntityVatsim();
        s = s.appendIfNotEmpty(this.toString$BaseEntityMap(), " - ");
        s = s.appendIfNotEmpty(this.height(), " - ");
        return s;
    };

    // Inheritance must be last!
    util.inheritPrototypes(exports.BaseEntityVatsimOnMap, entityBase.BaseEntityMap, "BaseEntityMap");
    util.inheritPrototypes(exports.BaseEntityVatsimOnMap, entityBase.BaseEntityVatsim, "BaseEntityVatsim");
});