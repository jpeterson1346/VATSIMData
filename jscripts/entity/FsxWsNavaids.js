
/**
* @module vd.entity
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity', function (exports) {

    /**
    * Trigger read data from the WebService (JSON) for Navigraph data. 
    * @param {Boolean} [availability] check
    * @see vd.entity.VatsimClients.readFromVatsim 
    */
    exports.FsxWs.prototype.readNavigraphNavaids = function (availability) {
        availability = Object.ifNotNullOrUndefined(availability, false);
        if (!availability && !this.enabled) return;
        if (Object.isNullOrUndefined(this.serverUrl)) return;
        if (!jQuery.support.cors) alert("jQuery CORS not enabled");
        if (this.loading && !availability) {
            alert("Concurrent loading from FsxWs");
            return;
        }
    };

    /**
    * Are Navaids available?
    * @return {Boolean} navaids
    */
    exports.FsxWs.prototype.hasNavaids = function () {
        return !Array.isNullOrEmpty(this.navaids);
    };
});