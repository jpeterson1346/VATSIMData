/**
* @module vd.entity.base
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity.base', function (exports) {

    /**
    * @constructor
    * @classdesc
    * <p>
    * Base entity, VATSIM plane, FSX plane / ATC. Not all properties make sense for every 
    * specialized subclass, but this is the common denonminator for all models.</p>
    * <p>
    * It is quite obvious an ATC Station will not have a GS for example. The character of this
    * base entity has changed after the integration of FSX objects. In the past it used
    * to be just for VATSIM objects (BaseEntityVatsim), now it is the base for FSX models as well.</p>
    * @param {Object} properties (JSON format)
    * @author KWB
    * @since 0.8
    */
    exports.BaseEntityModel = function (properties) {
        /**
        * Unique object id (key). This is unique amog all objects 
        * @type {Number}
        */
        this.objectId = globals.register(this);
        /**
        * Id, in this case VATSIM or FSX id.
        * @type {String}
        */
        this.id = Object.ifNotNullOrUndefined(properties["id"], null);
        /**
        * VATSIM / FSX id, same as id. This is a workaround, since some libraries as jqGrid
        * have problems with the property name id.
        * @type {String}
        */
        this.domainId = this.id;
        /**
        * Origin (FSX/VATSIM)
        * @const
        * @type {String}
        */
        this.origin = Object.ifNotNullOrUndefined(properties["origin"], "vatsim");
        /**
        * User name.
        * @type {String}
        */
        this.name = Object.ifNotNullOrUndefined(properties["name"], null);
        /**
        * COM frequency MHz.
        * @type {Number}
        * @example 123.5 means 123.5 MHz / 0.1 means 100kHz        
        */
        this.frequency = String.toNumber(properties["frequency"], null);
        /**
        * QNH [hPa].
        * @type {Number}
        * @example 1013
        */
        this.qnh = String.toNumber(properties["qnh"], null);
        /**
        * Groundspeed [kts].
        * @type {Number}
        * @example 410
        */
        this.groundspeed = String.toNumber(properties["groundspeed"], null);
        /**
        * Altitude ASL [ft].
        * @type {Number}
        * @example 10000
        */
        this.altitude = String.toNumber(properties["altitude"], null);
        /**
        * Visibility.
        * @type {Number}
        */
        this.visibility = String.toNumber(properties["visibility"], null);
        /**
        * Heading (true) 0-359
        * @type {Number}
        */
        this.heading = String.toNumber(properties["heading"], null);
        /**
        * Callsign.
        * @type {String} 
        * @example DCMBZ, EDDF_TWR, EDDS_GND
        */
        this.callsign = String.isNullOrEmpty(properties["callsign"]) ? null : properties["callsign"].toUpperCase();
        /**
        * Entity, will be set by subclass.
        * @type {String}
        * @protected
        */
        this.entity = "?";


        // post fixes
        if (this.isFsxBased()) {
            if (String.isNullOrEmpty(this.name)) this.name = "FSX Webservice";
        }
    };

    /**
    * Destructor, removing memory leak sensitive parts will go here
    * or method will be overridden by subclass.
    */
    exports.BaseEntityModel.prototype.dispose = function () {
        // code goes here
    };

    /**
    * Based on FSX data?
    * @return {Boolean} origin is FSX
    */
    exports.BaseEntityModel.prototype.isFsxBased = function () {
        if (String.isNullOrEmpty(this.origin)) return false;
        return (this.origin.toLowerCase().startsWith("fsx"));
    };

    /**
    * Based on VATSIM data?
    * @return {Boolean} origin is FSX
    */
    exports.BaseEntityModel.prototype.isVatsimBased = function () {
        if (String.isNullOrEmpty(this.origin)) return true; // default as of historical reasons
        return (this.origin.toLowerCase().startsWith("vatsim"));
    };

    /**
    * Property / value.
    * @return {Object} property / value pairs
    */
    exports.BaseEntityModel.prototype.toPropertyValue = function () {
        var pv = new Array();
        pv["id"] = this.id;
        pv["callsign"] = this.callsign;

        // properties not making sense for all entities
        if (Object.isNumber(this.frequency)) pv["frequency"] = this.frequencyAndUnit();
        if (Object.isNumber(this.qnh)) pv["qnh"] = this.qnhAndUnit();
        if (Object.isNumber(this.heading)) pv["heading"] = this.headingAndUnit();
        if (Object.isNumber(this.groundspeed)) pv["groundspeed"] = this.groundspeed + "kts / " + vd.util.UtilsCalc.ktsToKmh(this.groundspeed).toFixed(2) + "km/h";
        if (Object.isNumber(this.visibility)) pv["visibility"] = this.visibilityAndUnit();
        return pv;
    };

    /**
    * QNH with unit.
    * @return {String}
    */
    exports.BaseEntityModel.prototype.qnhAndUnit = function () {
        if (!Object.isNumber(this.qnh)) return "?";
        return this.qnh + "hPa";
    };

    /**
    * Speed with unit.
    * @return {String}
    */
    exports.BaseEntityModel.prototype.groundspeedAndUnit = function () {
        if (this.groundspeed < 0) return "?";
        return ("km" == globals.unitDistance) ? "GS" + vd.util.UtilsCalc.ktsToKmh(this.groundspeed).toFixed(0) + "km/h" : "GS" + this.groundspeed + "kts";
    };

    /**
    * Frequency with unit.
    * @return {String}
    */
    exports.BaseEntityModel.prototype.frequencyAndUnit = function () {
        if (!Object.isNumber(this.frequency)) return "?";
        return this.frequency < 1 ? (this.frequency * 1000) + "kHz" : this.frequency + "MHz";
    };

    /**
    * Visibility with unit.
    * @return {String}
    */
    exports.BaseEntityModel.prototype.visibilityAndUnit = function () {
        if (!Object.isNumber(this.visibility)) return "?";
        return this.visibility + "XXX";
    };

    /**
    * Altitude with unit.
    * @return {String}
    */
    exports.BaseEntityModel.prototype.altitudeAndUnit = function () {
        if (!Object.isNumber(this.altitude)) return "?";
        return ("m" == globals.unitAltitude) ? vd.util.UtilsCalc.ftToM(this.altitude).toFixed(0) + "m" : this.altitude + "ft";
    };

    /**
    * Heading with unit.
    * @return {String}
    */
    exports.BaseEntityModel.prototype.headingAndUnit = function () {
        if (!Object.isNumber(this.heading)) return "?";
        return this.heading + "&deg;";
    };

    /**
    * Magnetic declination with unit.
    * @return {String}
    */
    exports.BaseEntityModel.prototype.declinationAndUnit = function () {
        var d = this.declination();
        if (!Object.isNumber(d)) return "?";
        return d + "&deg;";
    };

    /**
    * Is this an entity being followed on the map?
    * @return {Boolean}
    */
    exports.BaseEntityModel.prototype.isFollowed = function () {
        return this.id == globals.mapFollowVatsimId;
    };

    /**
    * Is this an entity which fullfils the filter criteria?
    * @return {Boolean}
    */
    exports.BaseEntityModel.prototype.compliesWithFilter = function () {
        return (!globals.filtered || globals.filter.contains(this));
    };

    /**
    * Is in filter?
    * @return {Boolean}
    */
    exports.BaseEntityModel.prototype.isInFilter = function () {
        return (globals.filter.contains(this));
    };

    /**
    * String representation.
    * @return {String}
    */
    exports.BaseEntityModel.prototype.toString = function () {
        var s = "objId:" + this.objectId;
        s = s.appendIfNotEmpty([this.id, this.name], " ");
        return s;
    };

    /**
    * Equals another object.
    * @return {Boolean}
    */
    exports.BaseEntityModel.prototype.equals = function (otherEntity) {
        if (otherEntity == this) return true;
        if (Object.isNullOrUndefined(otherEntity)) return false;
        if (this.objectId == otherEntity.objectId) return true;
        return (this.callsign == otherEntity.callsign);
    };

    /**
    * Find the entity by object id.
    * @param {Array} entities Array of entities
    * @param {String} objectId
    * @return {BaseEntityModel}
    */
    exports.BaseEntityModel.findByObjectId = function (entities, objectId) {
        if (Array.isNullOrEmpty(entities) || String.isNullOrEmpty(objectId)) return null;
        for (var be = 0, len = entities.length; be < len; be++) {
            var baseEntity = entities[be];
            if (objectId == baseEntity.objectId) return baseEntity;
        }
        return null;
    };

    /**
    * Find the entity by Vatsim id - Vatsim id is not necessarily unique!
    * @param  {Array}  entities Array of entities
    * @param  {String} id
    * @return {Array} BaseEntityModel objects
    */
    exports.BaseEntityModel.findById = function (entites, id) {
        if (Array.isNullOrEmpty(entites) || String.isNullOrEmpty(id)) return null;
        var entities = new Array();
        for (var e = 0, len = entites.length; e < len; e++) {
            var baseEntity = entites[e];
            if (id == baseEntity.id) entities.push(baseEntity);
        }
        return entities;
    };

    /**
    * Find the first entity by Vatsim id
    * @param {Array}  entities Array of entities
    * @param {String} id
    * @return {BaseEntityModel}
    */
    exports.BaseEntityModel.findByIdFirst = function (entities, id) {
        var baseEntities = exports.BaseEntityModel.findById(entities, id);
        return (Array.isNullOrEmpty(baseEntities)) ? null : baseEntities[0];
    };

    /**
    * Find the entity by the callsign
    * @param  {Array}  entities Array of entities
    * @param  {String} callsign
    * @return {Array} BaseEntityModel objects
    */
    exports.BaseEntityModel.findByCallsign = function (entities, callsign) {
        var baseEntities = new Array();
        if (Array.isNullOrEmpty(entities) || String.isNullOrEmpty(callsign)) return baseEntities;
        callsign = callsign.toUpperCase();
        for (var e = 0, len = entities.length; e < len; e++) {
            var baseEntity = entities[e];
            if (callsign == baseEntity.callsign) baseEntities.push(baseEntity);
        }
        return baseEntities;
    };

    /**
    * Find the first entity by callsign.
    * @param {Array} entities Array of entities
    * @param {String} callsign
    * @return {BaseEntityModel}
    */
    exports.BaseEntityModel.findByCallsignFirst = function (entities, callsign) {
        if (Array.isNullOrEmpty(entities) || String.isNullOrEmpty(callsign)) return null;
        var baseEntities = vd.entity.base.BaseEntityModel.findByCallsign(entities, callsign);
        return Array.isNullOrEmpty(baseEntities) ? null : baseEntities[0];
    };

    /**
    * Find the entity by name
    * @param  {Array}  entities Array of entities
    * @param  {String} name
    * @return {Array} BaseEntityModel objects
    */
    exports.BaseEntityModel.findByName = function (entities, name) {
        var baseEntities = new Array();
        if (Array.isNullOrEmpty(entities) || String.isNullOrEmpty(name)) return baseEntities;
        for (var e = 0, len = entities.length; e < len; e++) {
            var baseEntity = entities[e];
            if (name == baseEntity.name) baseEntities.push(baseEntity);
        }
        return baseEntities;
    };
});