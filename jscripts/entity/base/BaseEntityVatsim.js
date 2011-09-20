namespace.module('vd.entity.base', function(exports, require) {

    /**
    * @constructor
    * @classdesc Vatsim base entity
    * @param {Object} properties
    */
    exports.BaseEntityVatsim = function(properties) {
        /**
        * Unique object id (key)
        * @type {Number}
        */
        this.objectId = globals.register(this);
        /**
        * Id, in this case VATSIM id.
        * @type {String}
        */
        this.id = Object.ifNotNullOrUndefined(properties["id"], null);
        /**
        * User name.
        * @type {String}
        */
        this.name = Object.ifNotNullOrUndefined(properties["name"], null);
        /**
        * COM frequency MHz.
        * @type {Number}
        * @example 123.5
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
        * Heading 0-359
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
    };

    /**
    * Property / value.
    * @return {Object} property / value pairs
    */
    exports.BaseEntityVatsim.prototype.toPropertyValue = function() {
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
    exports.BaseEntityVatsim.prototype.qnhAndUnit = function() {
        if (!Object.isNumber(this.qnh)) return "?";
        return this.qnh + "hPa";
    };

    /**
    * Speed with unit.
    * @return {String}
    */
    exports.BaseEntityVatsim.prototype.groundspeedAndUnit = function() {
        if (this.groundspeed < 0) return "?";
        return ("km" == globals.unitDistance) ? "GS" + vd.util.UtilsCalc.ktsToKmh(this.groundspeed).toFixed(0) + "km/h" : "GS" + this.groundspeed + "kts";
    };

    /**
    * Frequency with unit.
    * @return {String}
    */
    exports.BaseEntityVatsim.prototype.frequencyAndUnit = function() {
        if (!Object.isNumber(this.frequency)) return "?";
        return this.frequency + "MHz";
    };

    /**
    * Visibility with unit.
    * @return {String}
    */
    exports.BaseEntityVatsim.prototype.visibilityAndUnit = function() {
        if (!Object.isNumber(this.visibility)) return "?";
        return this.visibility + "XXX";
    };

    /**
    * Altitude with unit.
    * @return {String}
    */
    exports.BaseEntityVatsim.prototype.altitudeAndUnit = function() {
        if (!Object.isNumber(this.altitude)) return "?";
        return ("m" == globals.unitAltitude) ? vd.util.UtilsCalc.ftToM(this.altitude).toFixed(0) + "m" : this.altitude + "ft";
    };

    /**
    * Heading with unit.
    * @return {String}
    */
    exports.BaseEntityVatsim.prototype.headingAndUnit = function() {
        if (!Object.isNumber(this.heading)) return "?";
        return this.heading + "&deg;";
    };

    /**
    * Magnetic declination with unit.
    * @return {String}
    */
    exports.BaseEntityVatsim.prototype.declinationAndUnit = function() {
        var d = this.declination();
        if (!Object.isNumber(d)) return "?";
        return d + "&deg;";
    };

    /**
    * Is this an entity being followed on the map?
    * @return {Boolean}
    */
    exports.BaseEntityVatsim.prototype.isFollowed = function() {
        return this.id == globals.mapFollowVatsimId;
    };

    /*
    * Is this an entity which fullfils the filter criteria?
    * @return {Boolean}
    */
    exports.BaseEntityVatsim.prototype.compliesWithFilter = function() {
        return (!globals.filtered || globals.filter.contains(this));
    };

    /**
    * String representation.
    * @return {String}
    */
    exports.BaseEntityVatsim.prototype.toString = function() {
        var s = "objId:" + this.objectId;
        s = s.appendIfNotEmpty([this.id, this.name], " ");
        return s;
    };

    /**
    * Equals another object.
    * @return {Boolean}
    */
    exports.BaseEntityVatsim.prototype.equals = function(otherEntity) {
        if (otherEntity == this) return true;
        if (Object.isNullOrUndefined(otherEntity)) return false;
        if (this.objectId == otherEntity.objectId) return true;
        return (this.callsign == otherEntity.callsign);
    };

    /**
    * Find the entity by object id.
    * @param {Array} entities Array of entities
    * @param {String} objectId
    * @return {BaseEntityVatsim}
    */
    exports.BaseEntityVatsim.findByObjectId = function(entites, objectId) {
        if (Array.isNullOrEmpty(entites) || String.isNullOrEmpty(objectId)) return null;
        for (var be = 0, len = entites.length; be < len; be++) {
            var baseEntity = entites[be];
            if (objectId == baseEntity.objectId) return baseEntity;
        }
        return null;
    };

    /**
    * Find the entity by Vatsim id - Vatsim id is not necessarily unique!
    * @param  {Array}  entities Array of entities
    * @param  {String} id
    * @return {Array} BaseEntityVatsim objects
    */
    exports.BaseEntityVatsim.findById = function(entites, id) {
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
    * @return {BaseEntityVatsim}
    */
    exports.BaseEntityVatsim.findByIdFirst = function(entites, id) {
        var entities = exports.BaseEntityVatsim.findById(entites, id);
        return (Array.isNullOrEmpty(entities)) ? null : entities[0];
    };

    /**
    * Find the entity by callsign.
    * @param {Array} entities Array of entities
    * @param {String} callsign
    * @return {BaseEntityVatsim}
    */
    exports.BaseEntityVatsim.findByCallsign = function(entites, callsign) {
        if (Array.isNullOrEmpty(entites) || String.isNullOrEmpty(callsign)) return null;
        var cs = callsign.toUpperCase();
        for (var e = 0, len = entites.length; e < len; e++) {
            var baseEntity = entites[e];
            if (cs == baseEntity.callsign.toUpperCase()) return baseEntity;
        }
        return null;
    };
});