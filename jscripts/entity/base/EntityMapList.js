/**
* @module vd.entity.base
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity.base', function (exports, require) {

    var listBase = require("vd.entity.base");
    var util = require("vd.util.Utils");

    /**
    * @classdesc List of entities.
    * @param {Array|vd.entity.base.EntityList} other entities
    * @extends vd.entity.module:base.EntityList
    * @constructor
    */
    exports.EntityMapList = function (otherEntities) {
        // see http://stackoverflow.com/questions/2107556/how-to-inherit-from-a-class-in-javascript/2107586#2107586
        // after this, the subclass extends EntityList
        vd.entity.base.EntityList.call(this, otherEntities);

        /**
        * Log parse statistics.
        * @type {vd.util.RuntimeStatistics}
        */
        this._statisticsDisplay = new vd.util.RuntimeStatistics("EntityMap display");
    };

    /**
    * Display the clients (invoke display on all entities).
    * This will display the entities if they are in bounds of the map.
    * @param {Boolean} display
    * @param {Boolean} [forceRedraw] redraw, e.g. because settings changed
    */
    exports.EntityMapList.prototype.display = function (display, forceRedraw) {
        var c = this.count();
        if (c < 1) return;
        forceRedraw = Object.ifNotNullOrUndefined(forceRedraw, false);
        var statsEntry = new vd.util.RuntimeEntry("Display on " + c + " entities (e.g. FSX, VATSIM)");
        var entities = this.entities;
        vd.entity.base.BaseEntityMap.display(entities, display, forceRedraw);
        this._statisticsDisplay.add(statsEntry, true);
        globals.log.trace(statsEntry.toString());
    };

    /**
    * Clear all overlays of all clients.
    */
    exports.EntityMapList.prototype.clearOverlays = function () {
        if (this.count() < 1) return;
        this.display(false, false);
        var clients = this.allClients();
        for (var c = 0, len = clients.length; c < len; c++) {
            var client = clients[c];
            if (!Object.isNullOrUndefined(client.overlays)) client.overlays.clear();
        }
    };


    // Inheritance must be last!
    util.inheritPrototypes(exports.EntityMapList, listBase.EntityList, "EntityList");

});