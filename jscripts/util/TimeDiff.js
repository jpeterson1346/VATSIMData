/**
* @module vd.util
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.util', function(exports) {

    /**
    * @classdesc
    * Time difference.
    * @constructor
    * @author KWB
    */
    exports.TimeDiff = function() {
        /**
        * Start time (ms since epoch)
        * @type {Number}
        */
        this.startTime = null;
        /**
        * Formatted start time (hhmmssMMM)
        * @type {String}
        */
        this.startTimeFormatted = "";

        // init
        this.setStartTime();
    };

    /**
    * Set the start time ("now"). Automatically set in constructor,
    * only required if required to reset later.
    */
    exports.TimeDiff.prototype.setStartTime = function() {
        var now = new Date();
        this.startTime = now.getTime();

        // formatted
        var fs = (now.getHours() < 10 ? '0' : '') + (now.getHours());
        fs += ":";
        fs += (now.getMinutes() < 10 ? '0' : '') + (now.getMinutes());
        fs += ":";
        fs += (now.getSeconds() < 10 ? '0' : '') + (now.getSeconds());
        fs += ".";
        fs += ("00" + now.getMilliseconds()).substr(-3);
        this.startTimeFormatted = fs;
    };

    /**
    * Get the time difference.
    * @return {Number} time difference in ms
    */
    exports.TimeDiff.prototype.getDiff = function() {
        var d = new Date();
        return (d.getTime() - this.startTime);
    };

    /**
    * Get the time difference as formatted string.
    * @return {String} time difference in ms
    */
    exports.TimeDiff.prototype.getDiffFormatted = function() {
        return (this.getDiff().toFixed(0) + "ms");
    };
});