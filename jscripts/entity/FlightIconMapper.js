﻿/**
* @module vd.entity
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity', function(exports) {

    /**
    * Get icon.
    * @return {Objec} path, sizeH, sizeW
    * @private
    */
    exports.Flight.prototype._mapIcon = function() {
        var t = Object.ifNotNullOrUndefined(this.aircraft.toUpperCase(), null);
        var icon = { "path": null, "sizeW": globals.flightImageWidth, "sizeH": globals.flightImageHeight };
        if (!this._aircraftDataMapped) this.resolveAircraftData();

        // mapping
        if (String.isNullOrEmpty(this._imageBaseName)) {
            // determine image
            if (this.isHelicopter()) {
                this._imageBaseName = "Helicopter";
            } else {
                this._imageBaseName = "AircraftJet"; // default
                if (!String.isNullOrEmpty(t)) {
                    if (t.startsWith("VRS_WEAP")) {
                        this._imageBaseName = "AircraftRocket";
                        this.engines = 1;
                        this.wakeTurbulenceCategory = "M";
                        this.enginesType = "R";
                    } else if (this.engines > 0) {
                        // we do have mapped data and they are valid
                        if (this.enginesType === "P") {
                            if (this.engines < 3) {
                                this._imageBaseName = "AircraftGA1P";
                                icon.sizeH = globals.flightImageHeightSmall;
                                icon.sizeW = globals.flightImageWidthSmall;
                            }
                        } else if (this.enginesType === "J") {
                            if (this.engines < 3) {
                                this._imageBaseName = "AircraftJet2E";
                            } else {
                                this._imageBaseName = "AircraftJet4E";
                                if (this.wakeTurbulenceCategory === "H" || this.wakeTurbulenceCategory === "S") {
                                    icon.sizeH = globals.flightImageHeightLarge;
                                    icon.sizeW = globals.flightImageWidthLarge;
                                }
                            }
                        } // "J"
                    } // engines > 0
                }
            } // plane / heli

            // specific icons
            if (this.aircraftDesignator === "F18" || this.aircraftDesignator === "F16") {
                this._imageBaseName = "AircraftFighterJet";
            }
        } // image base name

        // build icon
        icon.path = "images/" + this._imageBaseName + (this.isGrounded() ? "Gnd.png" : ".png");

        // trace
        if (globals.traceAircraftIconMapping) {
            var hasData = Array.isNullOrEmpty(vd.entity.Flight.aircraftData);
            var trace = hasData ? "Aircraft data OK. " : "Aircraft data missing. ";
            trace += "Mapped \"" + t + "\" to \"" + this.aircraftName + "\", icon \"" + icon.path + "\", size " + icon.sizeW + "/" + icon.sizeH;
            globals.log.trace(trace);
        }

        // bye
        return icon;
    };

    /**
    * Resolve the aircraft data
    */
    exports.Flight.prototype.resolveAircraftData = function() {
        if (Array.isNullOrEmpty(vd.entity.Flight.aircraftData)) return;
        if (this._aircraftDataMapped) return;
        var t = Object.ifNotNullOrUndefined(this.aircraft.toUpperCase(), null);
        var an;
        if (!String.isNullOrEmpty(t)) {
            var aircraftData = exports.Flight.FindBestMatchInAircraftData(t);
            if (!Object.isNullOrUndefined(aircraftData)) {
                this.engines = aircraftData.Enginecount * 1;
                this.enginesType = aircraftData.Enginetype;
                this.wakeTurbulenceCategory = aircraftData.WTC;
                an = Object.ifNotNullOrUndefined(aircraftData.Manufacturer, "");
                an = an.appendIfNotEmpty(aircraftData.Model, " ");
                this.aircraftName = an;
                this.aircraftDesignator = aircraftData.Designator;
            }
        } else {
            this.aircraftName = "";
            this.engines = -1;
            this.enginesType = "";
            this.wakeTurbulenceCategory = "";
            this.aircraftDesignator = "";
        }
        this._aircraftDataMapped = true;
    };

    /**
    * Aircraft data.
    * @static
    * @type {Array}
    */
    exports.Flight.aircraftData = [];

    /**
    * Trigger read data from the WebService (JSON). 
    * @see vd.entity.VatsimClients.readFromVatsim
    * @see vd.entity.FsxWs.readNavigraphNavaids
    */
    exports.Flight.readAircraftData = function() {
        if (!Array.isNullOrEmpty(exports.Flight.aircraftData)) return;
        if (Object.isNullOrUndefined(globals.aircraftDataUrl)) return;
        if (!jQuery.support.cors) alert("jQuery CORS not enabled");

        // init
        var datatype = "json";
        var url = globals.aircraftDataUrl;

        // AJAX call
        $.ajax({
            type: 'GET',
            url: url,
            cache: false,
            async: true,
            crossDomain: false,
            dataType: datatype,
            success: function(data, status) {
                if (status == "success" && !Object.isNullOrUndefined(data)) {
                    // testing?
                    if (data.constructor !== Array) {
                        // detect JSON problems / crossdomain problems
                        alert("Json call working properly? Returned not an array.");
                        globals.log.error("Aircraft data loaded, no array type, type: " + datatype);
                    } else if (data.length > 0) {
                        // normal mode
                        vd.entity.Flight.aircraftData = data;
                        globals.log.trace("Aircraft data loaded, sets: " + data.length);
                    } else {
                        alert("Json call working properly? Returned empty aircraft data.");
                        globals.log.error("Aircraft data loaded, but empty");
                    }
                } else {
                    alert("Json call working properly? Returned empty aircraft data.");
                    globals.log.error("Aircraft data loaded, but empty");
                }
            },
            error: function(xhr, textStatus, errorThrown) {
                var errorMsg = "Error: " + textStatus + " " + errorThrown;
                alert("Json call working properly? " + errorMsg);
                globals.log.error(errorMsg);
            }
        });
        ;
    };

    /**
    * Find by name, best match
    * @static
    * @return {Object} aircraft data tupel
    */
    exports.Flight.FindBestMatchInAircraftData = function(designator) {
        if (String.isNullOrEmpty(designator)) return null;
        if (designator.length < 4) return null;
        var d = designator.toUpperCase();
        for (var a = 0, len = exports.Flight.aircraftData.length; a < len; a++) {
            var tupel = exports.Flight.aircraftData[a];
            // such as /T/E190/F C173 B737/T
            if (d.indexOf(tupel.Designator) >= 0) return tupel;
        }
        return null;
    };
});