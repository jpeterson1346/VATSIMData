/**
* @module vd.util
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.util', function(exports) {

    /**
    * @classdesc
    * Semaphore, locking a particular situation.
    * @constructor
    * @param {String} msg
    * @since 0.8.9
    */
    exports.Semaphore = function(context) {
        /**
        * Time difference
        * @type {vd.util.TimeDiff}
        * @private
        */
        this._timeDiff = new vd.util.TimeDiff();
        /**
        * Context.
        * @type {String}
        */
        this.context = Object.ifNotNullOrUndefined(context, null);
        /**
        * Lock reason.
        * @type {String}
        */
        this.lockReason = null;
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
        /**
        * Is locked?
        * @type {Boolean}
        */
        this.isLocked = false;
    };

    /**
    * Lock.
    * @param {String} [lockReason]
    * @param {Boolean} [asAlert] do not just log, but also create an alert
    * @return {Boolean} success
    */
    exports.Semaphore.prototype.lock = function(lockReason, asAlert, trace) {
        this.lockReason = Object.ifNotNullOrUndefined(lockReason, null);
        asAlert = Object.ifNotNullOrUndefined(asAlert, false);
        trace = Object.ifNotNullOrUndefined(trace, globals.traceSemaphores);

        if (this.isLocked) {
            var r = "Double lock, lock created ";
            r += this.lockTimeFormatted();
            r = r.appendIfNotEmpty(this.context, " ctx: ", "\"");
            r = r.appendIfNotEmpty(lockReason, " try reason: ", "\"");
            r = r.appendIfNotEmpty(this.lockReason, " is reason: ", "\"");
            globals.log.error(r);
            if (asAlert) alert(r);
            return false;
        }
        this.isLocked = true;
        this.timeDifference = 0;
        this.timeDifferenceAndUnit = "";
        this._timeDiff.setStartTime();
        if (trace) globals.log.trace(this.toString());
        return true;
    };

    /**
    * Unlock.
    * @param {String} msg
    * @param {Boolean} [asAlert] do not just log, but also create an alert
    * @param {Boolean} [trace] trace the locking
    * @return {Boolean} successfully
    */
    exports.Semaphore.prototype.unlock = function(unlockReason, asAlert, trace) {
        this.lockReason = Object.ifNotNullOrUndefined(unlockReason, null);
        asAlert = Object.ifNotNullOrUndefined(asAlert, false);
        trace = Object.ifNotNullOrUndefined(trace, globals.traceSemaphores);

        if (!this.isLocked) return false; // nothing to do
        var success = true;
        this.timeDifference = this._timeDiff.getDiff();
        this.timeDifferenceAndUnit = this._timeDiff.getDiffFormatted();
        if (!Object.isNullOrUndefined(this.lockReason) && !Object.isNullOrUndefined(unlockReason)) {
            // check matching reason if any given
            if (unlockReason !== this.lockReason) {
                success = false;
                var report = this.toString();
                report.appendIfNotEmpty(unlockReason, " unlock failed:", '"');
                report += " / ";
                report += this.lockReason.wrap('"');
                globals.log.error(report);
                if (asAlert) alert(report);
            }
        }
        this.isLocked = false;
        if (trace) {
            var t = this.toString();
            globals.log.trace(t);
        }
        return success;
    };

    /**
    * Lock start time formatted
    * @return {String}
    */
    exports.Semaphore.prototype.lockTimeFormatted = function() {
        return this._timeDiff.startTimeFormatted;
    };

    /**
    * String representation.
    * @return {String}
    */
    exports.Semaphore.prototype.toString = function() {
        var s = this.isLocked ? "Locked" : "Unlocked";
        s = s.appendIfNotEmpty(this.context, " ctx: ");
        s = s.appendIfNotEmpty(this.lockReason, " reason: ");
        s += " ";
        if (this.isLocked) {
            s += "started ";
            s += this.lockTimeFormatted();
        } else {
            s += "diff ";
            s += this.timeDifferenceAndUnit;
        }
        return s;
    };
});