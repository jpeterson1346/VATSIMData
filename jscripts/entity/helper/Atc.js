﻿namespace.module('vd.entity.helper', function (exports, require) {

    var entityBase = require("vd.entity.base");
    var util = require("vd.util.Utils");

    // @class An ATC unit
    // @constructor
    // @property {String}   controller
    // @property {AtcGroup} atcGroup
    // @param {Array} atcOpts
    // @param {AtcSettings} [atcSettings]
    exports.Atc = function (atcOpts, atcSettings) {

        // inherit attributes
        vd.entity.base.BaseEntityVatsimOnMap.call(this, atcOpts);

        // default values
        this.entity = "Atc"; // "class", simplifies debugging
        this.atcSettings = Object.ifNotNullOrUndefined(atcSettings, globals.atcSettings);
        this.atis = Object.ifNotNullOrUndefined(atcOpts["atis"], null);
        this.controller = Object.ifNotNullOrUndefined(atcOpts["controller"], null);
        if (String.isNullOrEmpty(this.controller)) this.controller = this.name;
    };

    // Static types
    exports.Atc.TypeGnd = "GND";
    exports.Atc.TypeApproach = "APP";
    exports.Atc.TypeTower = "TWR";
    exports.Atc.TypeAtis = "ATIS";
    exports.Atc.TypeDelivery = "DEL";
    exports.Atc.TypeAreaControl = "CTR";
    exports.Atc.TypeObserver = "OBS";

    // @method toPropertyValue
    // @return {Array} with proerty / value pairs
    exports.Atc.prototype.toPropertyValue = function () {
        var pv = this.toPropertyValue$BaseEntityVatsimOnMap();
        if (!String.isNullOrEmpty(this.controller)) pv["controller"] = this.controller;
        if (!String.isNullOrEmpty(this.atis)) pv["atis"] = this.atis;
        return pv;
    };

    // Build the content string.
    // @private
    // @param separator
    // @return {String}
    exports.Atc.prototype._getContent = function (separator) {
        separator = (String.isNullOrEmpty(separator)) ? ", " : separator;

        // pre-checks
        if (!this.atcSettings.displayAtc) return "";
        if (this.isAirportAtc() && !this.atcSettings.displayAirportAtc) return "";
        if (this.isAreaAtc() && !this.atcSettings.displayAreaAtc) return "";
        if (this.isObserver() && !this.atcSettings.displayObervers) return "";
        if (this.isAtis() && !this.atcSettings.displayAtis) return "";

        // build content
        var c = (this.atcSettings.displayCallsign) ? this.callsign : "";
        if (this.atcSettings.displayCallsign && !String.isNullOrEmpty(this.frequency) && this.frequency > 100) c += " " + this.frequency + "MHz";
        if (this.atcSettings.displayController && !String.isNullOrEmpty(this.controller)) c = c.appendIfThisIsNotEmpty(separator) + this.controller;
        if (this.atcSettings.displayId && !String.isNullOrEmpty(this.id)) c = c.appendIfThisIsNotEmpty(separator) + this.id;
        return c;
    };

    // Get the type of the ATC such as tower, ATIS, ground
    // @return {String} ATC type
    exports.Atc.prototype.getAtcType = function () {
        var p = this.getCallsignParts();
        // EDDF_ATIS EDDF_N_APP EDDF_TWR
        if (p == null || p.length < 2) return null;
        return (p.length > 2) ? p[2] : p[1];
    };

    // Get the main part (EDDF_TWR -> EDDF) of the call sign.
    // @return {String} ATC main part
    exports.Atc.prototype.getCallsignMainPart = function () {
        var p = this.getCallsignParts();
        return (p != null && p.length > 0) ? p[0] : null;
    };

    // Get the parts of a callsign (EDDF_TWR -> EDDF, TWR).
    // @return {Array} parts of callsign
    exports.Atc.prototype.getCallsignParts = function () {
        if (String.isNullOrEmpty(this.callsign)) return null;
        var parts = this.callsign.toUpperCase().split("_");
        if (!(parts instanceof Array) || parts.length < 2) return null;
        return parts;
    };

    // Is the ATC an airport ATC?
    // @return {Boolean} 
    exports.Atc.prototype.isAirportAtc = function () {
        var t = this.getAtcType();
        if (String.isNullOrEmpty(t)) return false;
        return (
            t.startsWith(exports.Atc.TypeGnd) || t.startsWith(exports.Atc.TypeApproach) ||
                t.startsWith(exports.Atc.TypeTower) || t.startsWith(exports.Atc.TypeAtis) || t.startsWith(exports.Atc.TypeDelivery));
    };

    // Is the ATC an area ATC?
    // @return {Boolean} 
    exports.Atc.prototype.isAreaAtc = function () {
        var t = this.getAtcType();
        if (String.isNullOrEmpty(t)) return false;
        return t.startsWith(exports.Atc.TypeAreaControl);
    };

    // Is the ATC an ATIS?
    // @return {Boolean} 
    exports.Atc.prototype.isAtis = function () {
        var t = this.getAtcType();
        if (String.isNullOrEmpty(t)) return false;
        return t.startsWith(exports.Atc.TypeAtis);
    };

    // Is the ATC an area ATC?
    // @return {Boolean} 
    exports.Atc.prototype.isObserver = function () {
        var t = this.getAtcType();
        if (String.isNullOrEmpty(t)) return false;
        return t.startsWith(exports.Atc.TypeObserver);
    };

    // String representation.
    // @method toString
    // @return {String}
    exports.Atc.prototype.toString = function () {
        var s = this.getAtcType();
        s = s.appendIfNotEmpty(this.toString$BaseEntityVatsimOnMap(), " - ");
        return s;
    };

    // Find by (ATC) type.
    // @method findByType
    // @param  {String} type
    // @return {Array} atcs with corresponding types
    exports.Atc.findByType = function (atcs, type) {
        var foundAtcs = new Array();
        if (Array.isNullOrEmpty(atcs) || String.isNullOrEmpty(type)) return foundAtcs;
        for (var a = 0, len = atcs.length; a < len; a++) {
            var atc = atcs[a];
            if (type == atc.getAtcType()) foundAtcs.push(atc);
        }
        return foundAtcs;
    };

    // Format the ATIS text.
    // @param  {String} atisRaw
    // @return {String} formatted text
    exports.Atc.formatAtis = function (atisRaw) {
        if (String.isNullOrEmpty(atisRaw)) return null;
        var atis = atisRaw.cleanUp();
        atis = atis.replace(/\^/g, " ");
        atis = atis.ascii();
        var a = atis.toLowerCase();
        if (!a.startsWith("information")) {
            if (a.indexOf("information") < 0) {
                atis = null;
            } else {
                var i = a.regexIndexOf(/[\d\w]+ information/, 0);
                if (i >= 0) atis = atis.substr(i);
            }
        }
        return atis;
    };

    // Inheritance must be last!
    util.inheritPrototypes(exports.Atc, entityBase.BaseEntityVatsimOnMap, "BaseEntityVatsimOnMap");
});