/**
* @module vd.entity.base
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity.base', function(exports) {

    /**
    * @classdesc List of entities.
    * @constructor
    */
    exports.EntityList = function() {
        /**
        * Entites.
        * @type {Array}
        */
        this.entities = new Array();
    };

    /**
    * Add a new entity.
    * @param {BaseEntity} entity
    */
    exports.EntityList.prototype.add = function(entity) {
        if (this.entities.contains(entity)) return;
        this.entities.push(entity);
    };

    /**
    * Add a new entity.
    * @param {String} domainId
    */
    exports.EntityList.prototype.addById = function(vatsimId) {
        if (String.isNullOrEmpty(vatsimId)) return;
        var entity = vd.entity.base.BaseEntityModel.findById(globals.clients.clients(), vatsimId);
        if (!Object.isNullOrUndefined(entity)) this.add(entity);
    };

    /**
    * Add a new entity.
    * @param {Number} objectId
    */
    exports.EntityList.prototype.addByObjectId = function(objectId) {
        if (!Object.isNumber(objectId)) return;
        var entity = vd.entity.base.BaseEntityModel.findByObjectId(globals.clients.clients(), objectId);
        if (!Object.isNullOrUndefined(entity)) this.add(entity);
    };

    /**
    * Remove an entity.
    * @param {BaseEntity} entity
    */
    exports.EntityList.prototype.remove = function(entity) {
        this.entities.removeByValue(entity);
    };

    /**
    * Remove multiple entities.
    * @param {Array} entities
    */
    exports.EntityList.prototype.removeEntites = function(entities) {
        if (Array.isNullOrEmpty(entities)) return;
        for (var e = 0, len = entities.length; e < len; e++) {
            var entity = entities[e];
            this.remove(entity);
        }
    };

    /**
    * Remove an entity.
    * @param {String} domainId
    */
    exports.EntityList.prototype.removeById = function(vatsimId) {
        if (String.isNullOrEmpty(vatsimId)) return;
        var entity = vd.entity.base.BaseEntityModel.findById(globals.clients.clients(), vatsimId);
        if (!Object.isNullOrUndefined(entity)) this.remove(entity);
    };

    /**
    * Remove an entity.
    * @param {String} objectId
    */
    exports.EntityList.prototype.removeByObjectId = function(objectId) {
        if (!Object.isNumber(objectId)) return;
        var entity = vd.entity.base.BaseEntityModel.findByObjectId(globals.clients.clients(), objectId);
        if (!Object.isNullOrUndefined(entity)) this.remove(entity);
    };

    /**
    * Clear all.
    */
    exports.EntityList.prototype.clear = function() {
        this.entities = new Array();
    };

    /**
    * Any elements?
    * @return {Boolean}
    */
    exports.EntityList.prototype.isEmpty = function() {
        return this.entities.length < 1;
    };

    /**
    * Contains entity?
    * @param  {BaseEntityModel} entity
    * @return {Boolean}
    */
    exports.EntityList.prototype.contains = function(entity) {
        if (this.isEmpty()) return false;
        return this.entities.contains(entity);
    };
});