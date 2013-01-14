/**
* @module vd.entity.base
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity.base', function (exports, require) {

    var listBase = require("vd.entity.base");
    var util = require("vd.util");

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
    };

    /**
    * Log parse statistics. I only want one stats entry for all maps,
    * so I declare it static. An object instance would create entries for all new instances.
    * @type {vd.util.RuntimeStatistics}
    * @static
    * @private
    */
    exports.EntityMapList._statisticsDisplay = new util.RuntimeStatistics("EntityMap display");

    /**
    * Display the clients (invoke display on all entities).
    * This will display the entities if they are in bounds of the map.
    * @param {Boolean} display
    * @param {Boolean} [forceRedrawFsx] redraw
    * @param {Boolean} [forceRedrawVatsim] redraw
    * @param {Boolean} [forceLoadedEntities] redraw such as Navaids, ..
    */
    exports.EntityMapList.prototype.display = function (display, forceRedrawFsx, forceRedrawVatsim, forceLoadedEntities) {
        var c = this.count();
        if (c < 1) return;
        forceRedrawFsx = Object.ifNotNullOrUndefined(forceRedrawFsx, true);
        forceRedrawVatsim = Object.ifNotNullOrUndefined(forceRedrawVatsim, true);
        forceLoadedEntities = Object.ifNotNullOrUndefined(forceLoadedEntities, true);
        var statsEntry = new vd.util.RuntimeEntry("Display on " + c + " entities (e.g. FSX, VATSIM)");
        var entities = this.entities;
        for (var e = 0, len = entities.length; e < len; e++) {
            var entity = entities[e];
            if (display) {
                if (!entity.isInBounds()) continue;
                if (entity.isFsxBased())
                    entity.display(display, false, forceRedrawFsx);
                else if (entity.isVatsimBased())
                    entity.display(display, false, forceRedrawVatsim);
                else if (entity.entity === "Navaid")
                    entity.display(display, false, forceLoadedEntities);
                else
                    alert("Unknown entity origin in list");
            } else {
                entity.display(false);
            }
        }
        exports.EntityMapList._statisticsDisplay.add(statsEntry, true);
        globals.log.trace(statsEntry.toString());
    };

    /**
    * Clear all overlays of all clients.
    * @param {Boolean} clear VATSIM entities
    * @param {Boolean} clear FsxWs entities 
    */
    exports.EntityMapList.prototype.clearOverlays = function (vatsim, fsxWs) {
        if (this.count() < 1) return;
        vatsim = Object.ifNotNullOrUndefined(vatsim, true);
        fsxWs = Object.ifNotNullOrUndefined(fsxWs, true);

        var entities;
        if (vatsim && fsxWs)
            entities = this.entities;
        else if (vatsim)
            entities = this.vatsimEntities(true);
        else if (fsxWs)
            entities = this.fsxWsEntities(true);
        else
            return;

        vd.entity.base.BaseEntityMap.display(entities, false);
    };

    // Inheritance must be last!
    util.Utils.inheritPrototypes(exports.EntityMapList, listBase.EntityList, "EntityList");
});