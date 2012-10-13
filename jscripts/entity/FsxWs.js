/**
* @module vd.entity
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity', function (exports) {
    /**
    * @constructor
    * @classdesc 
    * Connecting to FsxWs. Read data from FSX via a web service.
    * VatsimClients is the sibling class fetching data for VATSIM.
    * @see vd.module:page.PageController
    * @see vd.module:entity.VatsimClients
    * @param {String} fsxWsLocation like localhost, mycomputer.here.local 
    * @param {Number} fsxWsPort e.g. 8080 
    * @param {String} [fsxWsDefaultLocation], for a trial of a direct connect if location / port are not provided
    * @author KWB
    */
    exports.FsxWs = function (fsxWsLocation, fsxWsPort, fsxWsDefaultLocation) {
        /**
        * Enabled, disabled? Disables primarily read.
        * @type {Boolean}
        */
        this.enabled = true;
        /**
        * URL of FsxWs Web service
        * @type {String}
        */
        this.serverUrl = null;
        /**
        * Location of FsxWs Web service
        * @type {String}
        */
        this.serverLocation = null;
        /**
        * Port of FsxWs Web service
        * @type {Number}
        */
        this.serverPort = -1;
        /**
        * When this was last updated.
        * @type {Date} 
        */
        this.update = null;
        /**
        * Number of parsed aircrafts. Info string with update time.
        * @type {String}
        */
        this.info = "";
        /**
        * List of all updates.
        * @type {Array} 
        */
        this.readHistory = new Array();
        /**
        * Read JSON aircrafts
        * @type {Array}
        */
        this.aircrafts = null;
        /**
        * JSON aircrafts converted to flights
        * @type {Array}
        */
        this.flights = null;
        /**
        * Loading in progress
        * @type {Boolean}
        */
        this.loading = false;
        /**
        * Last status. see define status codes.
        * @type {Number}
        */
        this.lastStatus = exports.FsxWs.Init;

        // call init methods
        this.initServerValues(fsxWsLocation, fsxWsPort, fsxWsDefaultLocation);

        //
        // ---- statistics
        //

        /**
        * Log read statistics.
        * @type {vd.util.RuntimeStatistics}
        */
        this._statisticsRead = new vd.util.RuntimeStatistics("FsxWs read");
    };

    /**
    * Init the server values and build a valid URL.
    * @param {String} fsxWsLocation like localhost, mycomputer.here.local 
    * @param {Number} fsxWsPort e.g. 8080 
    * @param {String} [fsxWsDefaultLocation], for a trial of a direct connect if location / port are not provided
    * @return {Boolean} true values have been reset, false nothing changed (values remain)
    */
    exports.FsxWs.prototype.initServerValues = function (fsxWsLocation, fsxWsPort, fsxWsDefaultLocation) {
        this.serverUrl = null;
        this.serverPort = -1;
        this.serverLocation = null;

        // no values at all, try a default and return
        if (String.isNullOrEmpty(fsxWsLocation) && Object.isNullOrUndefined(fsxWsPort)) {
            // Auto hooking to FsxWs:
            // I check set server default values whether just by chance there is something
            // At least during development a very useful feature
            if (!String.isNullOrEmpty(fsxWsDefaultLocation)) {
                var uri = vd.util.UtilsWeb.parseUri(fsxWsDefaultLocation);
                fsxWsLocation = uri.host;
                fsxWsPort = String.toNumber(uri.port);
            } else
                return;
        }

        // set location or default
        if (String.isNullOrEmpty(fsxWsLocation) && Object.isNullOrUndefined(this.serverLocation))
            this.serverLocation = "localhost";
        else if (!String.isNullOrEmpty(fsxWsLocation))
            this.serverLocation = fsxWsLocation;

        // set port to default
        if (!Object.isNumber(fsxWsPort) && this.serverPort < 0)
            this.serverPort = 8080;
        else if (Object.isNumber(fsxWsPort))
            this.serverPort = fsxWsPort;

        // set URL
        var url = "http://" + this.serverLocation;
        if (this.serverPort != 80) url += ":" + this.serverPort;
        url += "/" + exports.FsxWs.PathJsonService;
        this.serverUrl = url;
    };

    /**
    * Trigger read data from the WebService (JSON). 
    * @param {Boolean}  [availability] check
    * @param {Boolean}  [autoEnableDisable] error / success leads to enabled / disabled service
    * @param {function} [successfulReadCallback] call if really read data
    * @see vd.entity.VatsimClients.readFromVatsim 
    */
    exports.FsxWs.prototype.readFromFsxWs = function (availability, autoEnableDisable, successfulReadCallback) {
        availability = Object.ifNotNullOrUndefined(availability, false);
        autoEnableDisable = Object.ifNotNullOrUndefined(autoEnableDisable, true);
        if (!availability && !this.enabled) return;
        if (Object.isNullOrUndefined(this.serverUrl)) return;
        if (!jQuery.support.cors) alert("jQuery CORS not enabled");
        if (this.loading && !availability) {
            alert("Concurrent loading from FsxWs");
            return;
        }

        // init
        successfulReadCallback = Object.ifNotNullOrUndefined(successfulReadCallback, null);
        this.loading = !availability && true;
        var url = availability ? this.serverUrl + exports.FsxWs.QueryParameterTest : this.serverUrl + exports.FsxWs.QueryParameterNoWaypoints;
        if (!availability) this._statisticsRead.start();
        var datatype = BrowserDetect.browser.toLowerCase() == "explorer" ? "jsonp" : "json";
        var me = this;

        // AJAX call
        $.ajax({
            type: 'GET',
            url: url,
            cache: false,
            async: true,
            crossDomain: true,
            dataType: datatype,
            success: function (data, status) {
                if (status == "success" && !Object.isNullOrUndefined(data)) {
                    // testing?
                    if (availability) {
                        me.lastStatus = exports.FsxWs.Ok;
                    } else {
                        // normal mode
                        if (data.length > 0) {
                            var rtEntry = me._statisticsRead.end(); // I just write full reads in the statistics in order to get real comparisons
                            globals.googleAnalyticsEvent("readFromFsxWs", "FULLREAD", rtEntry.timeDifference);
                            me.aircrafts = data;
                            var newFlights = me.aircraftsToFlight(data);
                            me.flights = vd.entity.Flight.updateFlights(me.flights, newFlights);
                            me.lastStatus = exports.FsxWs.Ok;
                            if (!Object.isNullOrUndefined(successfulReadCallback)) successfulReadCallback();
                        } else {
                            globals.log.trace("FsxWs Data loaded, but no data in array");
                            me.lastStatus = exports.FsxWs.ReadNoData;
                        }
                    }
                    // final state and callback
                    if (autoEnableDisable) me.enabled = true;
                    if (me.lastStatus == exports.FsxWs.Ok && !Object.isNullOrUndefined(successfulReadCallback)) successfulReadCallback();
                } else {
                    me.lastStatus = exports.FsxWs.ReadNoData;
                    if (autoEnableDisable) me.enabled = false;
                    globals.log.error("Reading from FsxWs success, but not data");
                }
                me.loading = false;
            },
            error: function (xhr, textStatus, errorThrown) {
                me.loading = false;
                if (autoEnableDisable) me.enabled = false;
                me.lastStatus = exports.FsxWs.ReadFailed;
                var errorMsg = String.isNullOrEmpty(errorThrown.message) ? "N/A" : errorThrown.message;
                var msg = "FsxWs data cannot be loaded, status: \"" + textStatus + "\". Error: \"" + errorMsg + "\". URL: " + url;
                if (availability)
                    globals.log.info(msg);
                else
                    globals.log.error(msg);
            }
        });
    };

    /**
    * Successful read?
    * @return success
    */
    exports.FsxWs.prototype.successfulRead = function () {
        return this.lastStatus == exports.FsxWs.Ok;
    };

    /**
    * Dispose the "stored data" (hide as well).
    * @return {Boolean} info whether something was disposed
    */
    exports.FsxWs.prototype.disposeData = function () {
        if (this.loading) return false;
        if (this.lastStatus == vd.entity.FsxWs.Init) return false;
        this.aircrafts = new Array();
        vd.entity.base.BaseEntityModel.dispose(this.flights);
        this.flights = new Array();
        this.lastStatus = vd.entity.FsxWs.Init;
        return true;
    };

    /**
    * Aircrafts to flight.
    * @param {Array} aircrafts array of JSON Aircrafts
    * @return {Array} flight
    */
    exports.FsxWs.prototype.aircraftsToFlight = function (aircrafts) {
        aircrafts = Object.ifNotNullOrUndefined(aircrafts, this.aircrafts);
        var flights = new Array();
        if (Array.isNullOrEmpty(aircrafts)) return flights;
        for (var a = 0, len = aircrafts.length; a < len; a++) {
            var aircraft = aircrafts[a];
            // VatGM: Create Flight from FsxWs aircraft
            var fp = {
                "idfsx": aircraft.id,
                "name": aircraft.id == 1 ? "Me" : "FSX " + aircraft.title,
                "frequency": aircraft.com1,
                "qnh": aircraft.kohlsmanMb,
                "aircraft": aircraft.model,
                "callsign": aircraft.title,
                "altitude": String.toNumber(aircraft.altitudeFt, -1, 0),
                "groundspeed": String.toNumber(aircraft.groundSpeedKts, -1, 0),
                "heading": String.toNumber(aircraft.headingTrueDeg, -1, 0),
                "latitude": String.toNumber(aircraft.latitude, -1),
                "longitude": String.toNumber(aircraft.longitude, -1),
                "elevation": vd.util.UtilsCalc.mToFt(
                    String.toNumber(aircraft.groundAltitudeM, -1),
                    2),
                "verticalspeed": String.toNumber(aircraft.verticalSpeedFts, -1),
                "variation": String.toNumber(aircraft.magneticVariationDeg, 0),
                "bankangle": String.toNumber(aircraft.bankAngleDeg, -1),
                "pitchangle": String.toNumber(aircraft.pitchAngleDeg, -1),
                "aoa": String.toNumber(aircraft.angleOfAttackDeg, -1),
                "grounded": aircraft.simOnGround,
                "helicopter": aircraft.isHelicopter,
                "transponder": aircraft.transponder
            };
            var flight = new vd.entity.Flight(fp);
            flights.push(flight);
        }
        return flights;
    };

    /**
    * Merge with VATSIM flight data.
    * (this will change the flight data of FsxWs).
    * @param  {Array} vatsimClients
    * @param  {Boolean} [addNonExisitingVatsimFlights] flights in VATSIM only will be added
    * @return {Array} vd.entity.Flight 
    */
    exports.FsxWs.prototype.mergeWithVatsimFlights = function (vatsimClients, addNonExisitingVatsimFlights) {
        addNonExisitingVatsimFlights = Object.ifNotNullOrUndefined(addNonExisitingVatsimFlights, true);

        // VATSIM data?
        if (Array.isNullOrEmpty(vatsimClients)) {
            if (Array.isNullOrEmpty(this.flights)) return new Array();
            return this.flights;
        }

        // FsxWs data?
        if (Array.isNullOrEmpty(this.flights)) {
            return vatsimClients;
        }

        var mergedEntities = new Array();
        var fsxFlights = this.flights.slice(0); // copy of array

        for (var f = 0, len = vatsimClients.length; f < len; f++) {
            var vatsimEntity = vatsimClients[f];
            if (vatsimEntity.entity != "Flight") {
                mergedEntities.push(vatsimEntity);
                continue;
            }
            var sameFlight = vd.entity.base.BaseEntityModel.findByCallsignFirst(fsxFlights, vatsimEntity.callsign);
            if (Object.isNullOrUndefined(sameFlight)) {
                // no equivalent flight
                if (addNonExisitingVatsimFlights) mergedEntities.push(vatsimEntity); // simply add VASTIM flight
            } else {
                fsxFlights.remove(sameFlight);
                // following is by reference and changes this.flight[x] as well, but this has no negative side effects
                sameFlight.pilot = vatsimEntity.pilot;
                sameFlight.vatsimId = vatsimEntity.vatsimId;
                sameFlight.flightplan = vatsimEntity.flightplan;
                mergedEntities.push(sameFlight); // updated FsxFlight (data of VATSIM and FsxWs)
            }
        }
        if (Array.isNullOrEmpty(mergedEntities))
            mergedEntities = fsxFlights;
        else
            mergedEntities = mergedEntities.concat(fsxFlights); // no matching flight @ VATSIM

        // return
        return mergedEntities;
    };

    /**
    * Query parameters indicating no waypoints
    * @type {String}
    * @const
    */
    exports.FsxWs.QueryParameterNoWaypoints = "?withwaypoints=false";

    /**
    * Query parameter indicating just a test (check server)
    * @type {String}
    * @const
    */
    exports.FsxWs.QueryParameterTest = "?test=true";

    /**
    * Path for JSON Web service.
    * @type {String}
    * @const
    */
    exports.FsxWs.PathJsonService = "aircraftsJson";

    /**
    * Reading status init value.
    * @type {Number}
    * @const
    */
    exports.FsxWs.Init = -1;
    /**
    * Reading OK.
    * @type {Number}
    * @const
    */
    exports.FsxWs.Ok = 0;
    /**
    * Reading OK.
    * @type {Number}
    * @const
    */
    exports.FsxWs.NoFsxWs = 10;
    /**
    * Reading failed.
    * @type {Number}
    * @const
    */
    exports.FsxWs.ReadFailed = 11;
    /**
    * Reading succeeded, but no data.
    * @type {Number}
    * @const
    */
    exports.FsxWs.ReadNoData = 12;
    /**
    * Status code to readable message.
    * @type {Number}
    * @return {String}
    */
    exports.FsxWs.statusToInfo = function (status) {
        var info;
        switch (status) {
            case vd.entity.FsxWs.Init:
                info = "Init";
                break;
            case vd.entity.FsxWs.Ok:
                info = "Data loaded";
                break;
            case vd.entity.FsxWs.ReadFailed:
                info = "Read failed";
                break;
            case vd.entity.FsxWs.NoFsxWs.ReadNoData:
                info = "No data";
                break;
            default:
                info = "Unknown, check console";
                break;
        }
        return info;
    };
});