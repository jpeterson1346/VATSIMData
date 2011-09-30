/**
* @module vd.util
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.util', function(exports) {

    /**
    * Runtime entry.
    * @constructor
    * @param {String} msg
    */
    exports.RuntimeEntry = function(msg) {
        /**
        * @type {vd.util.TimeDiff}
        * @private
        */
        this._timeDiff = new vd.util.TimeDiff();
        /**
        * Further explanation.
        * @type {String}
        */
        this.message = Object.ifNotNullOrUndefined(msg, null);
        /**
        * Time differenze in ms.
        * @type {Number}
        */
        this.timeDifference = 0;
        /**
        * Time differenze in ms.
        * @type {String}
        */
        this.timeDifferenceAndUnit = "N/A";
    };

    /**
    * End this entry.
    * @param {String} msg
    */
    exports.RuntimeEntry.prototype.end = function(msg) {
        this.message = Object.ifNotNullOrUndefined(msg, this.message);
        this.timeDifference = this._timeDiff.getDiff();
        this.timeDifferenceAndUnit = this._timeDiff.getDiffFormatted();
        this._timeDiff = null;
    };

    /**
    * String representation.
    * @return {String}
    */
    exports.RuntimeEntry.prototype.toString = function() {
        var s = this.timeDifferenceAndUnit.appendIfNotEmpty(this.message, " - ");
        return s;
    };

    /**
    * Runtime statistics.
    * @constructor
    * @param {String} msg
    */
    exports.RuntimeStatistics = function(msg) {
        /**
        * Further explanation.
        * @type {String}
        */
        this.message = Object.ifNotNullOrUndefined(msg, null);
        /**
        * All entries.
        * @type {Array} 
        */
        this.entries = new Array();
        /**
        * Current entry
        * @type {vd.util.RuntimeEntry} 
        */
        this._current = null;

        // add me to all statistics
        exports.RuntimeStatistics.allStatistics.push(this);
    };

    /**
    * Add new entry.
    * @param {vd.util.RuntimeEntry} entry
    * @param {Boolean} end
    */
    exports.RuntimeStatistics.prototype.add = function(entry, end) {
        if (Object.isNullOrUndefined(entry)) return;
        end = Object.ifNotNullOrUndefined(end, true);
        this.entries.unshift(entry);
        if (end) entry.end();
    };

    /**
    * Start a new entry.
    */
    exports.RuntimeStatistics.prototype.start = function() {
        this._current = new vd.util.RuntimeEntry();
    };

    /**
    * End entry and add it.
    * @return {vd.util.RuntimeEntry} just ended entry
    */
    exports.RuntimeStatistics.prototype.end = function() {
        if (Object.isNullOrUndefined(this._current)) return null;
        this.add(this._current, true);
        var c = this._current;
        this._current = null;
        return c;
    };

    /**
    * Get the average / min / max runtime [ms].
    * @return {Array} average / min / max / total
    */
    exports.RuntimeStatistics.prototype.calculateValues = function() {
        if (this.entries.length < 1) return 0;

        var total = 0;
        var digits = 0;
        var min = Number.MAX_VALUE;
        var max = 0;
        var entry;
        for (var i = 0, len = this.entries.length; i < len; i++) {
            entry = this.entries[i];
            total += entry.timeDifference;
            if (entry.timeDifference > max) max = entry.timeDifference;
            if (entry.timeDifference < min) min = entry.timeDifference;
        }
        return [
            ((total / this.entries.length).toFixed(digits)) * 1,
            min.toFixed(digits) * 1,
            max.toFixed(digits) * 1,
            total.toFixed(digits) * 1
        ];
    };

    /**
    * Get the average / min / max runtime [ms].
    * @return {Array} average / min / max / total
    */
    exports.RuntimeStatistics.prototype.valuesFormatted = function() {
        if (this.entries.length < 1) return ["N/A", "N/A", "N/A"];
        var v = this.calculateValues();
        return [v[0] + "ms", v[1] + "ms", v[2] + "ms", v[3] + "ms"];
    };

    /**
    * Get the average / min / max runtime [ms].
    * @return {String}
    */
    exports.RuntimeStatistics.prototype.valuesFormattedString = function() {
        if (this.entries.length < 1) return "N/A";
        var v = this.valuesFormatted();
        return "a:" + v[0] + "/min:" + v[1] + "/max:" + v[2] + "/t:" + v[3];
    };

    /**
    * Get a string representation.
    * @return {String}
    */
    exports.RuntimeStatistics.prototype.toString = function() {
        var s = this.valuesFormattedString() + " probes: " + this.entries.length;
        return s.appendIfNotEmpty(this.message, " - ");
    };

    /**
    * Log the statistics.
    */
    exports.RuntimeStatistics.prototype.log = function(forceLevel) {
        if (this.entries.length < 1) return; // nothing to do
        forceLevel = Object.ifNotNullOrUndefined(forceLevel, false);
        if (forceLevel) {
            var l = globals.log.getLevel();
            globals.log.setLevel(log4javascript.Level.INFO);
            globals.log.info(this.toString());
            globals.log.setLevel(l);
        } else {
            globals.log.info(this.toString());
        }
    };

    /**
    * All RuntimeStatistics objects.
    * @type {Array}
    */
    exports.RuntimeStatistics.allStatistics = new Array();

    /**
    * Log all RuntimeStatistics objects.
    */
    exports.RuntimeStatistics.logAll = function() {
        for (var a = 0, len = exports.RuntimeStatistics.allStatistics.length; a < len; a++) {
            var s = exports.RuntimeStatistics.allStatistics[a];
            s.log(true);
        }
    };
});