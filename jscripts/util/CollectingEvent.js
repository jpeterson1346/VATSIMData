﻿/**
* @module vd.util
*/
namespace.module('vd.util', function (exports, require) {

    /**
    * @constructor
    * @classdesc Collect events over a certain timeframe.
    * @param {function} func event function to be called
    * @param {Number}   collectMs time in milliseconds over which the event is being collected
    * @param {Boolean}  restart a new event restarts the timer
    * @param {function} [methodCalledCallback] callback when method is really being called
    */
    exports.CollectingEvent = function(func, collectMs, restart, methodCalledCallback) {

        /**
        * Restart time whenever called. 
        * @type {Boolean}
        */
        this.restart = (Object.isNullOrUndefined(restart)) ? true : restart;
        /**
        * Collect events of this time [ms]. 
        * @type {Number}
        */
        this.collectTime = collectMs;
        /**
        * Event to be called. 
        * @private
        * @type {function}
        */
        this._function = func;
        /**
        * Token for restarting timer.
        * @private
        * @type {Number}
        */
        this._token = -1;
        /**
        * Callback before event is eventually called.
        * @private
        * @type {function}
        */
        this._methodCalledCallback = methodCalledCallback;

        setTimeout(this.fire, this.collectTime);
        this.fire();
    };

    /**
    * Fire event when collecting time is reached.
    */
    exports.CollectingEvent.prototype.fire = function() {
        if (this.restart || this._token === -1) {
            this._token++;
            var me = this;
            setTimeout(
                function() {
                    me._fire();
                }, this.collectTime); // this "looses" the object
        } else
            return; // not yet fire, just ignore
    };

    /**
    * Eventually fire call to given function.
    * @private
    */
    exports.CollectingEvent.prototype._fire = function() {
        if (this._token === 0) {
            this._token = -1;
            if (!Object.isNullOrUndefined(this._methodCalledCallback)) this._methodCalledCallback();
            this._function();
        } else if (this._token > 0) {
            this._token--;
        }
    };
});