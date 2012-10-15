/**
* @module vd.entity.base
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity.base', function(exports) {

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
    exports.BaseEntityModel = function(properties) {
        /**
        * Unique object id (key). This is unique amog all objects 
        * @type {Number}
        */
        this.objectId = globals.register(this);
        /**
        * FSX id.
        * @type {String}
        */
        this.fsxId = Object.ifNotNullOrUndefined(properties["idfsx"], null);
        /**
        * VATSIM id.
        * @type {String}
        */
        this.vatsimId = Object.ifNotNullOrUndefined(properties["idvatsim"], null);
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
        this.callsign = String.isNullOrEmpty(properties["callsign"]) ? null : exports.BaseEntityModel.formatCallsign(properties["callsign"]);
        /**
        * Entity, will be set by subclass.
        * @type {String}
        * @protected
        */
        this.entity = "?";

        // post fixes
        if (this.isFsxBased()) {
            if (String.isNullOrEmpty(this.name)) this.name = this.vatsimId == 1 ? "Me" : "FSX";
            if (String.isNullOrEmpty(this.pilot)) this.pilot = this.vatsimId == 1 ? "Me" : "FSX";
        }
    };

    /**
    * Destructor, removing memory leak sensitive parts will go here
    * or method will be overridden by subclass.
    */
    exports.BaseEntityModel.prototype.dispose = function() {
        // code goes here
    };

    /**
    * Based on FSX data?
    * @return {Boolean} origin is FSX
    */
    exports.BaseEntityModel.prototype.isFsxBased = function() {
        return !String.isNullOrEmpty(this.fsxId);
    };

    /**
    * Is my FSX aircraft?
    * @return {Boolean} origin is FSX
    */
    exports.BaseEntityModel.prototype.isMyFsxAircraft = function() {
        var id = this.fsxId; // leave this line in, its easier to debug
        return  id == 1;
    };

    /**
    * Based on VATSIM data?
    * @return {Boolean} origin is FSX
    */
    exports.BaseEntityModel.prototype.isVatsimBased = function() {
        return !String.isNullOrEmpty(this.vatsimId);
    };

    /**
    * Is object representing this id, allows to search on child objects as well (deep search).
    * @param {String|Number} id 
    * @param {Boolean} deepSearch
    * @return {vd.entity.base.BaseEnityModel}
    */
    exports.BaseEntityModel.prototype.matchingObject = function(id, deepSearch) {
        if (this.objectId == id) return this;
        // ReSharper disable AssignedValueIsNeverUsed
        deepSearch = Object.ifNotNullOrUndefined(deepSearch, false);
        // ReSharper restore AssignedValueIsNeverUsed

        // derived classes would search children now, base class just returns false
        return null;
    };

    /**
    * Based on both data (FSX and VATSIM)?
    * @return {Boolean} origin is FSX
    */
    exports.BaseEntityModel.prototype.isCombinedDataBased = function() {
        return this.isVatsimBased() && this.isFsxBased();
    };

    /**
    * Property / value.
    * @return {Object} property / value pairs
    */
    exports.BaseEntityModel.prototype.toPropertyValue = function() {
        var pv = new Array();
        if (!String.isNullOrEmpty(this.vatsimId)) pv["id vatsim"] = this.vatsimId;
        if (!String.isNullOrEmpty(this.fsxId)) pv["id fsx"] = this.fsxId;
        pv["callsign"] = this.callsign;

        // properties not making sense for all entities
        if (Object.isNumber(this.frequency)) pv["frequency"] = this.frequencyAndUnit();
        if (Object.isNumber(this.qnh)) pv["qnh"] = this.qnhAndUnit();
        if (Object.isNumber(this.heading)) pv["heading (true)"] = this.headingAndUnit();
        if (Object.isNumber(this.groundspeed)) pv["groundspeed"] = this.groundspeed + "kts / " + vd.util.UtilsCalc.ktsToKmh(this.groundspeed).toFixed(2) + "km/h";
        if (Object.isNumber(this.visibility)) pv["visibility"] = this.visibilityAndUnit();
        return pv;
    };

    /**
    * QNH with unit.
    * @return {String}
    */
    exports.BaseEntityModel.prototype.qnhAndUnit = function() {
        if (!Object.isNumber(this.qnh)) return "?";
        return this.qnh + "hPa";
    };

    /**
    * Speed with unit.
    * @return {String}
    */
    exports.BaseEntityModel.prototype.groundspeedAndUnit = function() {
        if (this.groundspeed < 0) return "?";
        return ("km" == globals.unitDistance) ? "GS" + vd.util.UtilsCalc.ktsToKmh(this.groundspeed).toFixed(0) + "km/h" : "GS" + this.groundspeed + "kts";
    };

    /**
    * Frequency with unit.
    * @return {String}
    */
    exports.BaseEntityModel.prototype.frequencyAndUnit = function() {
        if (!Object.isNumber(this.frequency)) return "?";
        return this.frequency < 1 ? (this.frequency * 1000) + "kHz" : this.frequency + "MHz";
    };

    /**
    * Visibility with unit.
    * @return {String}
    */
    exports.BaseEntityModel.prototype.visibilityAndUnit = function() {
        if (!Object.isNumber(this.visibility)) return "?";
        return this.visibility + "XXX";
    };

    /**
    * Altitude with unit.
    * @return {String}
    */
    exports.BaseEntityModel.prototype.altitudeAndUnit = function() {
        if (!Object.isNumber(this.altitude)) return "?";
        return ("m" == globals.unitAltitude) ? vd.util.UtilsCalc.ftToM(this.altitude).toFixed(0) + "m" : this.altitude + "ft";
    };

    /**
    * Heading with unit.
    * @return {String}
    */
    exports.BaseEntityModel.prototype.headingAndUnit = function() {
        if (!Object.isNumber(this.heading)) return "?";
        return this.heading + "&deg;";
    };

    /**
    * Magnetic variation with unit.
    * @return {String}
    */
    exports.BaseEntityModel.prototype.variationAndUnit = function() {
        var d = this.variation();
        if (!Object.isNumber(d)) return "?";
        return d + "&deg;";
    };

    /**
    * Is this an entity being followed on the map?
    * @return {Boolean}
    */
    exports.BaseEntityModel.prototype.isFollowed = function() {
        return this.objectId == globals.mapFollowId;
    };

    /**
    * Is this an entity which fullfils the filter criteria?
    * @return {Boolean}
    */
    exports.BaseEntityModel.prototype.compliesWithFilter = function() {
        return (!globals.filtered || globals.filter.contains(this));
    };

    /**
    * Is in filter?
    * @return {Boolean}
    */
    exports.BaseEntityModel.prototype.isInFilter = function() {
        return (globals.filter.contains(this));
    };

    /**
    * String representation.
    * @return {String}
    */
    exports.BaseEntityModel.prototype.toString = function() {
        var s = "objId:" + this.objectId;
        s = s.appendIfNotEmpty([this.vatsimId, this.fsxId, this.callsign], " ");
        return s;
    };

    /**
    * Equals another object.
    * @return {Boolean}
    */
    exports.BaseEntityModel.prototype.equals = function(otherEntity) {
        if (otherEntity == this) return true;
        if (Object.isNullOrUndefined(otherEntity)) return false;
        if (this.objectId == otherEntity.objectId) return true;
        return (this.callsign == otherEntity.callsign);
    };

    /**
    * Remove invalid characters from a callsign make it all capital.
    * @param  {String} callsign
    * @return {String} formatted callsign
    **/
    exports.BaseEntityModel.formatCallsign = function(callsign) {
        if (String.isNullOrEmpty(callsign)) return null;
        var newcs = callsign.toUpperCase();
        newcs = newcs.replace(/\W/g, '');
        return newcs;
    };

    /**
    * Find the entity by object id.
    * @param {Array} entities Array of entities
    * @param {String} objectId
    * @param {Boolean} deepSearch
    * @return {BaseEntityModel}
    */
    exports.BaseEntityModel.findByObjectId = function(entities, objectId, deepSearch) {
        if (Array.isNullOrEmpty(entities) || String.isNullOrEmpty(objectId)) return null;
        deepSearch = Object.ifNotNullOrUndefined(deepSearch, false);
        for (var be = 0, len = entities.length; be < len; be++) {
            var baseEntity = entities[be];
            if (deepSearch) {
                var entity = baseEntity.matchingObject(objectId, true);
                if (!Object.isNullOrUndefined(entity)) return entity;
            } else {
                if (objectId == baseEntity.objectId) return baseEntity;
            }
        }
        return null;
    };

    /**
    * Find the entity by Vatsim id - Vatsim id is not necessarily unique!
    * @param  {Array}  entities Array of entities
    * @param  {String} vatsimId
    * @return {Array} BaseEntityModel objects
    */
    exports.BaseEntityModel.findByVatsimId = function(entites, vatsimId) {
        if (Array.isNullOrEmpty(entites) || String.isNullOrEmpty(vatsimId)) return null;
        var entities = new Array();
        for (var e = 0, len = entites.length; e < len; e++) {
            var baseEntity = entites[e];
            if (vatsimId == baseEntity.vatsimId) entities.push(baseEntity);
        }
        return entities;
    };

    /**
    * Find the entity by id (FSX id, VATSIM id, object id).
    * @param  {Array}  entities Array of entities
    * @param  {String} id
    * @param  {Boolean} [considerObjectId]
    * @return {Array} BaseEntityModel objects
    */
    exports.BaseEntityModel.findById = function(entites, id, considerObjectId) {
        if (Array.isNullOrEmpty(entites) || String.isNullOrEmpty(id)) return null;
        var withObjId = Object.isNullOrUndefined(considerObjectId) ? false : considerObjectId;
        var entities = new Array();
        for (var e = 0, len = entites.length; e < len; e++) {
            var baseEntity = entites[e];
            if (id == baseEntity.fsxId || id == baseEntity.vatsimId)
                entities.push(baseEntity);
            else if (withObjId && id == baseEntity.objectId)
                entities.push(baseEntity);
        }
        return entities;
    };

    /**
    * Find the first entity by Vatsim id.
    * @param {Array}  entities Array of entities
    * @param {String} id
    * @return {BaseEntityModel}
    */
    exports.BaseEntityModel.findByVatsimIdFirst = function(entities, id) {
        var baseEntities = exports.BaseEntityModel.findByVatsimId(entities, id);
        return (Array.isNullOrEmpty(baseEntities)) ? null : baseEntities[0];
    };

    /**
    * Find the first entity by FSX id.
    * @param {Array}  entities Array of entities
    * @param {String} id
    * @return {BaseEntityModel}
    */
    exports.BaseEntityModel.findByFsxIdFirst = function(entities, id) {
        for (var e = 0, len = entities.length; e < len; e++) {
            var baseEntity = entities[e];
            if (id == baseEntity.fsxId) return entities[e];
        }
        return null;
    };

    /**
    * Find the first entity by any id.
    * @param {Array}  entities Array of entities
    * @param {String} id
    * @param  {Boolean} [considerObjectId]
    * @return {BaseEntityModel}
    */
    exports.BaseEntityModel.findByIdFirst = function(entities, id, considerObjectId) {
        var baseEntities = exports.BaseEntityModel.findById(entities, id, considerObjectId);
        return (Array.isNullOrEmpty(baseEntities)) ? null : baseEntities[0];
    };

    /**
    * Find the entity by the callsign
    * @param  {Array}  entities Array of entities
    * @param  {String} callsign
    * @return {Array} BaseEntityModel objects
    */
    exports.BaseEntityModel.findByCallsign = function(entities, callsign) {
        var baseEntities = new Array();
        if (Array.isNullOrEmpty(entities) || String.isNullOrEmpty(callsign)) return baseEntities;
        callsign = exports.BaseEntityModel.formatCallsign(callsign);
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
    exports.BaseEntityModel.findByCallsignFirst = function(entities, callsign) {
        if (Array.isNullOrEmpty(entities) || String.isNullOrEmpty(callsign)) return null;
        var baseEntities = vd.entity.base.BaseEntityModel.findByCallsign(entities, callsign);
        return Array.isNullOrEmpty(baseEntities) ? null : baseEntities[0];
    };

    /**
    * Find the entity by name.
    * @param  {Array}  entities Array of entities
    * @param  {String} name
    * @return {Array} BaseEntityModel objects
    */
    exports.BaseEntityModel.findByName = function(entities, name) {
        var baseEntities = new Array();
        if (Array.isNullOrEmpty(entities) || String.isNullOrEmpty(name)) return baseEntities;
        for (var e = 0, len = entities.length; e < len; e++) {
            var baseEntity = entities[e];
            if (name == baseEntity.name) baseEntities.push(baseEntity);
        }
        return baseEntities;
    };

    /**
    * Find the entity by type.
    * @param  {Array}  entities Array of entities
    * @param  {String} type
    * @param  {String} [alternativeType]
    * @return {Array} BaseEntityModel objects
    */
    exports.BaseEntityModel.findByType = function(entities, type, alternativeType) {
        var baseEntities = new Array();
        if (Array.isNullOrEmpty(entities) || String.isNullOrEmpty(type)) return baseEntities;
        var at = !Object.isNullOrUndefined();
        for (var e = 0, len = entities.length; e < len; e++) {
            var baseEntity = entities[e];
            var ct = baseEntity.entity;
            if (ct == type)
                baseEntities.push(baseEntity);
            else if (at && ct == alternativeType)
                baseEntities.push(baseEntity);
        }
        return baseEntities;
    };

    /**
    * Find the entity by its origin.
    * @param  {Array}  entities Array of entities
    * @param  {Boolean} [vatsimOnly] only purely VATSIM based entities
    * @return {Array} BaseEntityModel objects
    */
    exports.BaseEntityModel.findVatsimBased = function(entities, vatsimOnly) {
        vatsimOnly = Object.ifNotNullOrUndefined(vatsimOnly, false);
        var baseEntities = new Array();
        if (Array.isNullOrEmpty(entities)) return baseEntities;
        for (var e = 0, len = entities.length; e < len; e++) {
            var baseEntity = entities[e];
            if (!baseEntity.isVatsimBased()) continue;
            if (!vatsimOnly || !baseEntity.isFsxBased()) baseEntities.push(baseEntity);
        }
        return baseEntities;
    };

    /**
    * Find the entity by its origin.
    * @param  {Array}  entities Array of entities
    * @param  {Boolean} [fsxWsOnly] only purely FsxWs based entities
    * @return {Array} BaseEntityModel objects
    */
    exports.BaseEntityModel.findFsxBased = function(entities, fsxWsOnly) {
        fsxWsOnly = Object.ifNotNullOrUndefined(fsxWsOnly, false);
        var baseEntities = new Array();
        if (Array.isNullOrEmpty(entities)) return baseEntities;
        for (var e = 0, len = entities.length; e < len; e++) {
            var baseEntity = entities[e];
            if (!baseEntity.isFsxBased()) continue;
            if (!fsxWsOnly || !baseEntity.isVatsimBased()) baseEntities.push(baseEntity);
        }
        return baseEntities;
    };

    /**
    * Dispose entities.
    * @param  {Array}  entities Array of entities
    */
    exports.BaseEntityModel.dispose = function(entities) {
        if (Array.isNullOrEmpty(entities)) return;
        for (var e = 0, len = entities.length; e < len; e++) {
            var baseEntity = entities[e];
            baseEntity.dispose();
        }
    };

    /**
    * Find already disposed entities.
    * @param  {Array}  entities Array of entities
    * @return {Array} BaseEntityModel objects
    */
    exports.BaseEntityModel.findDisposed = function(entities) {
        var baseEntities = new Array();
        if (Array.isNullOrEmpty(entities)) return baseEntities;
        for (var e = 0, len = entities.length; e < len; e++) {
            var baseEntity = entities[e];
            if (baseEntity.disposed) baseEntities.push(baseEntity);
        }
        return baseEntities;
    };
});