/**
* @module vd.entity
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity', function (exports) {

    /**
    * @classdesc The settings for Navaids (VOR, NDB).
    * @constructor
    * @param {Object} [options]
    * @author KWB
    */
    exports.NavaidSettings = function (options) {
        // set the options
        this.set(options);
    };

    /**
    * Reset values on the same object.
    * @param {Array} [options]
    */
    exports.NavaidSettings.prototype.set = function (options) {

        // make sure we have an options object
        options = Object.ifNotNullOrUndefined(options, {});
        /**
        * Display VORs?
        * @type {Boolean}
        */
        this.displayVOR = Object.ifNotNullOrUndefined(options["displayVOR"], true);
        /**
        * Display NDBs?
        * @type {Boolean}
        */
        this.displayNDB = Object.ifNotNullOrUndefined(options["displayNDB"], true);
        /**
        * Display DMEs?
        * @type {Boolean}
        */
        this.displayNDB = Object.ifNotNullOrUndefined(options["displayDME"], true);
        /**
        * Display ILSs?
        * @type {Boolean}
        */
        this.displayILS = Object.ifNotNullOrUndefined(options["displayILS"], true);
        /**
        * Display TACANs?
        * @type {Boolean}
        */
        this.displayTACAN = Object.ifNotNullOrUndefined(options["displayTACAN"], true);
        /**
        * Display VORTACs?
        * @type {Boolean}
        */
        this.displayVORTAC = Object.ifNotNullOrUndefined(options["displayVORTAC"], true);
        /**
        * Display navaid at all?
        * @type {Boolean}
        */
        this.displayNavaid = Object.ifNotNullOrUndefined(options["displayNavaids"],
            this.displayVOR || this.displayTACAN || this.displayNDB || this.displayILS || this.displayVORTAC || this.displayTACAN);
        /**
        * Display name?
        * @type {Boolean}
        */
        this.displayName = Object.ifNotNullOrUndefined(options["displayName"], false);
        /**
        * Display type?
        * @type {Boolean}
        */
        this.displayType = Object.ifNotNullOrUndefined(options["displayType"], true);
        /**
        * Display frequency?
        * @type {Boolean}
        */
        this.displayFrequency = Object.ifNotNullOrUndefined(options["displayFrequency"], true);
        /**
        * Display callsign?
        * @type {Boolean}
        */
        this.displayCallsign = Object.ifNotNullOrUndefined(options["displayCallsign"], true);
    };

    /**
    * Number of elements displayed.
    * @return {Number}
    */
    exports.NavaidSettings.prototype.displayedElements = function () {
        if (!this.displayNavaid) return 0;
        var c = this.displayFrequency ? 1 : 0;
        if (this.displayName) c++;
        if (this.displayFrequency) c++;
        if (this.displayType) c++;
        if (this.displayCallsign) c++;
        return c;
    };

    /**
    * Clone.
    * @return {vd.entity.NavaidSettings}
    */
    exports.NavaidSettings.prototype.clone = function () {
        return new exports.NavaidSettings(this);
    };

    /**
    * All values to true.
    * @return {NavaidSettings}
    */
    exports.NavaidSettings.prototype.displayAll = function () {
        this.displayVOR = true;
        this.displayNDB = true;
        this.displayTACAN = true;
        this.displayVORTAC = true;
        this.displayILS = true;
        this.displayDME = true;
        this.displayNavaid = true;
        this.displayName = true;
        this.displayFrequency = true;
        this.displayType = true;
        this.displayCallsign = true;
        return this;
    };
});