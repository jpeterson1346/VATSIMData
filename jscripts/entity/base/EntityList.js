﻿/**
* @module vd.entity.base
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity.base', function (exports) {

    /**
    * @classdesc List of entities.
    * @param {Array|vd.entity.base.EntityList} other entities
    * @constructor
    */
    exports.EntityList = function (otherEntities) {
        /**
        * Entites.
        * @type {Array}
        */
        this.entities = new Array();

        // init
        if (Object.isNullOrUndefined(otherEntities)) {
            // nothing to do, just empty array
        } else if (otherEntities instanceof Array) {
            this.entities = otherEntities; // by reference
        } else if (otherEntities instanceof EntityList) {
            this.entities = otherEntities.entities;
        } else {
            throw new Error("Entity list, init by unsupported entities");
        }
    };

    /**
    * Add a new entity.
    * @param {BaseEntity} entity
    */
    exports.EntityList.prototype.add = function (entity) {
        if (this.entities.contains(entity)) return;
        this.entities.push(entity);
    };

    /**
    * Add a new entity from the global lists.
    * @param {Number} objectId
    * @param {Boolean} added?
    */
    exports.EntityList.prototype.addByObjectId = function (objectId) {
        if (!Object.isNumber(objectId)) return false;
        var entity = vd.entity.base.BaseEntityModel.findByObjectId(globals.vatsimClients.vatsimClients(), objectId);
        if (!Object.isNullOrUndefined(entity)) {
            this.add(entity);
            return true;
        }
        entity = vd.entity.base.BaseEntityModel.findByObjectId(globals.fsxWs.aircrafts, objectId);
        if (!Object.isNullOrUndefined(entity)) {
            this.add(entity);
            return true;
        }
        return false;
    };

    /**
    * Remove an entity.
    * @param {BaseEntity} entity
    */
    exports.EntityList.prototype.remove = function (entity) {
        this.entities.removeByValue(entity);
    };

    /**
    * Remove multiple entities.
    * @param {Array} entities
    */
    exports.EntityList.prototype.removeEntites = function (entities) {
        if (Array.isNullOrEmpty(entities)) return;
        for (var e = 0, len = entities.length; e < len; e++) {
            var entity = entities[e];
            this.remove(entity);
        }
    };

    /**
    * Remove an entity.
    * @param {String} objectId
    * @param {Boolean} removed?
    */
    exports.EntityList.prototype.removeByObjectId = function (objectId) {
        if (!Object.isNumber(objectId)) return false;
        var entity = vd.entity.base.BaseEntityModel.findByObjectId(globals.vatsimClients.vatsimClients(), objectId);
        if (!Object.isNullOrUndefined(entity)) {
            this.remove(entity);
            return true;
        }
        entity = vd.entity.base.BaseEntityModel.findByObjectId(globals.fsxWs.aircrafts, objectId);
        if (!Object.isNullOrUndefined(entity)) {
            this.add(entity);
            return true;
        }
        return false;
    };

    /**
    * Clear all.
    */
    exports.EntityList.prototype.clear = function () {
        this.entities = new Array();
    };

    /**
    * Any elements?
    * @return {Boolean}
    */
    exports.EntityList.prototype.isEmpty = function () {
        return this.count() < 1;
    };

    /**
    * Number of elements?
    * @return {Number}
    */
    exports.EntityList.prototype.count = function () {
        if (Array.isNullOrEmpty(this.entities)) return 0;
        return this.entities.length;
    };

    /**
    * Contains entity?
    * @param  {BaseEntityModel} entity
    * @return {Boolean}
    */
    exports.EntityList.prototype.contains = function (entity) {
        if (this.isEmpty()) return false;
        return this.entities.contains(entity);
    };

    /**
    * All flights.
    * @param  {BaseEntityModel} entity
    * @return {Array}
    * @see vd.entity.Flight
    */
    exports.EntityList.prototype.flights = function () {
        if (this.isEmpty()) return new Array();
        return vd.entity.base.BaseEntityModel.findByType(this.entities, "Flight", null);
    };

    /**
    * All flights.
    * @param  {BaseEntityModel} entity
    * @return {Array}
    * @see vd.entity.Atc
    */
    exports.EntityList.prototype.airports = function () {
        if (this.isEmpty()) return new Array();
        return vd.entity.base.BaseEntityModel.findByType(this.entities, "Airport");
    };
});