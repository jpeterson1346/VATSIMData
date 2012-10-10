/**
* @module vd.entity
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity', function (exports) {

    /**
    * @constructor
    * @classdesc 
    * VatsimClients is the central class for reading the client data from the VATSIM data file.
    * Here data are parsed and the entity objects are created.
    * @see vd.module:entity.Airport
    * @see vd.module:entity.Flight
    * @see vd.module:page.PageController main user of this "class", in order to display the clients (pilots/ATC)
    * @author KWB
    * @since 0.7
    */
    exports.VatsimClients = function () {
        /**
        * Enabled, disabled? Disables primarily read.
        * @type {Boolean}
        */
        this.enabled = true;
        /**
        * When this was last updated.
        * @type {Date} 
        */
        this.update = null;
        /**
        * Number of connected clients (aka VATSIM users).
        * @type {Number}
        */
        this.clientsConnected = 0;
        /**
        * Number of connected clients (aka VATSIM users).
        * Info string with update time.
        * @type {String}
        */
        this.info = "";
        /**
        * Data file location.
        * @type {String}
        */
        this.datafile = null;
        /**
        * Last status. see define status codes.
        * @type {Number}
        */
        this.lastStatus = exports.VatsimClients.Init;
        /**
        * List of all updates.
        * @type {Array} 
        */
        this.readHistory = new Array();
        /**
        * When in test mode, current file number for test data.
        * @type {Number}
        * @private
        */
        this._testModeFileNumber = 0;
        /**
        * Loading in progress
        * @type {Boolean}
        */
        this.loading = false;

        //
        // ---- helper entities
        //

        /**
        * All read ATCs.
        * @type {Array}
        * @see Atc
        */
        this.atcs = new Array();
        /**
        * All read flight plans.
        * @type {Array}
        * @see Flightplan
        */
        this.flightplans = new Array();

        //
        // ---- main entities
        //

        /**
        * All read flights.
        * @type {Array}
        * @see Flight
        */
        this.flights = new Array();
        /**
        * All read Airports.
        * @type {Array}
        * @see Airport
        */
        this.airports = new Array();

        //
        // ---- statistics
        //

        /**
        * Log read statistics.
        * @type {vd.util.RuntimeStatistics}
        */
        this._statisticsRead = new vd.util.RuntimeStatistics("VatsimClients read");
        /**
        * Log parse statistics.
        * @type {vd.util.RuntimeStatistics}
        */
        this._statisticsParse = new vd.util.RuntimeStatistics("VatsimClients parse");
    };

    /**
    * Dispose the "stored data" (hide as well).
    */
    exports.VatsimClients.prototype.disposeData = function () {
        if (this.loading) return;
        this.atcs = new Array();
        this.flightplans = new Array();
        vd.entity.base.BaseEntityModel.dispose(this.aircrafts);
        this.aircrafts = new Array();
        vd.entity.base.BaseEntityModel.dispose(this.flights);
        this.flights = new Array();
        this.lastStatus = vd.entity.VatsimClients.Init;
    };

    /**
    * Trigger read data from the VATSIM servers ("data file").
    * @param {function} [successfulReadCallback]
    * @see vd.entity.FsxWs.readFromFsxWs
    */
    exports.VatsimClients.prototype.readFromVatsim = function (successfulReadCallback) {

        // checks
        if (!this.enabled) return;
        if (!jQuery.support.cors) alert("jQuery CORS not enabled");
        if (this.loading) {
            alert("Concurrent loading from VATSIM");
            return;
        }

        // prepare
        successfulReadCallback = Object.ifNotNullOrUndefined(successfulReadCallback, null);
        this.loading = true;
        this._setDatafile();
        var url = this.datafile;
        if (String.isNullOrEmpty(url)) alert("VATSIM read URL empty / undefined");
        var me = this;
        this._statisticsRead.start();

        // AJAX call
        $.ajax({
            type: 'GET',
            url: url,
            cache: false,
            async: true,
            crossdomain: false,
            datatype: "text",
            success: function (data, status) {
                if (status == "success" && !String.isNullOrEmpty(data)) {
                    var r;
                    try {
                        r = me._parseVatsimDataFile(data); // also updates timestamp / history
                    } catch (e) {
                        globals.log.error("VATSIM file \"" + url + "\" ,parsing error " + e);
                        r = exports.VatsimClients.ParsingFailed;
                    }
                    if (r == exports.VatsimClients.Ok) {
                        var rtEntry = me._statisticsRead.end(); // I just write full reads in the statistics in order to get real comparisons
                        globals.googleAnalyticsEvent("readFromVatsim", "FULLREAD", rtEntry.timeDifference);
                    } else if (r == exports.VatsimClients.NoNewData)
                        globals.log.trace("VATSIM Data loaded but no new data");
                    else
                        globals.log.error("Parsing VATSIM data failed");

                    // final state and callback
                    me.lastStatus = r;
                    if (r == exports.VatsimClients.Ok && !Object.isNullOrUndefined(successfulReadCallback)) successfulReadCallback();
                } else {
                    me.lastStatus = exports.VatsimClients.ReadFailed;
                    globals.log.error("Reading from VATSIM success, but not data");
                }
                me.loading = false;
            },
            error: function (xhr, textStatus, errorThrown) {
                me.loading = false;
                me.lastStatus = exports.VatsimClients.ReadFailed;
                globals.log.error("VATSIM data cannot be loaded, status " + textStatus + ". Error: " + errorThrown + ". File: " + url);
            }
        });
    };

    /**
    * Set the data file for the next load, on a local machine
    * it uses the test files.
    * @private
    */
    exports.VatsimClients.prototype._setDatafile = function () {
        // http://www.net-flyer.net/DataFeed/vatsim-data.txt
        if (vd.util.UtilsWeb.isLocalServer()) {
            // local test mode
            this._testModeFileNumber = (this._testModeFileNumber > 8) ? 1 : this._testModeFileNumber + 1;
            var file = this._testModeFileNumber + "_vatsim-data.txt";
            this.datafile = vd.util.UtilsWeb.replaceCurrentPage("data/" + file); // full url required for Chrome
        } else {
            // normal mode
            if (String.isNullOrEmpty(this.datafile)) this.datafile = vd.util.UtilsWeb.replaceCurrentPage("php/VatsimProxy.php5");
        }
    };

    /**
    * Parse the VATSIM data file.
    * @param  {String} rawData from the request
    * @return {Number} status, e.g. whether data was already available or something failed
    */
    exports.VatsimClients.prototype._parseVatsimDataFile = function (rawData) {

        // init
        var statsEntry = new vd.util.RuntimeEntry("Parsing file (VatsimClients)");
        var lines = rawData.split("\n");
        var section = "";
        var flights = new Array();
        var flightplans = new Array();
        var atcs = new Array();
        var airports = new Array();
        var currentAirport = null;
        var status;

        // parse each line
        for (var l = 0, len = lines.length; l < len; l++) {
            var line = lines[l];
            line = line.trim();
            if (String.isNullOrEmpty(line) || line.startsWith(";")) continue; // empty line or comment
            if (line.length > 2 && line.startsWith("!") && line.endsWith(":")) {
                // new section
                section = line.substring(1, line.length - 1);
                continue;
            }
            if (section == "CLIENTS") {
                // 00 callsign: 1 cid: 2 realname: 3 clienttype: 4 frequency: 5 latitude: 6 longitude: 7 altitude: 8 groundspeed
                // 09 planned_aircraft: 10 planned_tascruise: 11 planned_depairport: 12 planned_altitude: 13 planned_destairport
                // 14 server: 15 protrevision: 16 rating: 17 transponder: 18 facilitytype: 19 visualrange:
                // 20 planned_revision: 21 planned_flighttype: 22 planned_deptime: 23 planned_actdeptime: 24 planned_hrsenroute: 25 planned_minenroute: 26 planned_hrsfuel: 27 planned_minfuel: 
                // 28 planned_altairport: 29 planned_remarks: 30 planned_route: 31 planned_depairport_lat: 32 planned_depairport_lon: 33 planned_destairport_lat: 34 planned_destairport_lon:
                // 35 atis_message: 36 time_last_atis_received: 37 time_logon: 38 heading: 39 QNH_iHg: 40 QNH_Mb:
                var clientElements = line.split(":");
                var callsign = clientElements[0];
                var id = clientElements[1];
                var name = clientElements[2];
                var type = clientElements[3];
                var lat = clientElements[5];
                var lng = clientElements[6];

                if (String.isNullOrEmpty(type) || String.isNullOrEmpty(callsign) || String.isNullOrEmpty(id) || !Object.isNumber(lat) || !Object.isNumber(lng))
                    continue; // inconsistent dataset
                if (type == "PILOT") {
                    var flightplan = null;
                    if (!String.isNullOrEmpty(clientElements[11]) && !String.isNullOrEmpty(clientElements[13])) {
                        flightplan = new vd.entity.helper.Flightplan(
                            {
                                from: String.isNullOrEmpty(clientElements[11]) ? null : clientElements[11].toUpperCase().trim(),
                                to: String.isNullOrEmpty(clientElements[13]) ? null : clientElements[13].toUpperCase().trim(),
                                alternate: String.isNullOrEmpty(clientElements[28]) ? null : clientElements[28].toUpperCase().trim(),
                                type: String.isNullOrEmpty(clientElements[29]) ? null : clientElements[21].toUpperCase() + "FR",
                                remarks: String.isNullOrEmpty(clientElements[29]) ? null : clientElements[29].trim(),
                                route: String.isNullOrEmpty(clientElements[30]) ? null : clientElements[30].trim()
                            });
                        flightplans.push(flightplan);
                    }

                    var flight = new vd.entity.Flight(
                        {
                            flightplan: flightplan,
                            callsign: callsign,
                            idvatsim: id,
                            name: name,
                            frequency: String.toNumber(clientElements[4], null),
                            altitude: String.toNumber(clientElements[7], null),
                            groundspeed: String.toNumber(clientElements[8], null),
                            aircraft: clientElements[9],
                            transponder: String.isNullOrEmpty(clientElements[17]) ? null : clientElements[17].leading(4, "0"),
                            visibility: String.toNumber(clientElements[19], null),
                            latitude: lat,
                            longitude: lng,
                            heading: String.toNumber(clientElements[38], null),
                            qnh: clientElements[40]
                        });
                    if (!Object.isNullOrUndefined(flightplan)) flightplan.flight = flight;
                    flights.push(flight);
                } else if (type == "ATC") {
                    var atis = vd.entity.helper.Atc.formatAtis(clientElements[35]);
                    var atc = new vd.entity.helper.Atc(
                        {
                            callsign: callsign,
                            idvatsim: id,
                            controller: name,
                            name: name,
                            frequency: String.toNumber(clientElements[4], null),
                            altitude: String.toNumber(clientElements[7], null),
                            latitude: lat,
                            longitude: lng,
                            atis: String.isNullOrEmpty(atis) ? null : atis,
                            visibility: String.toNumber(clientElements[19], null),
                            qnh: clientElements[40]
                        });
                    if (atc.isAirportAtc()) {
                        var airport = atc.getCallsignMainPart();
                        if (Object.isNullOrUndefined(currentAirport) || currentAirport.name != airport) {
                            currentAirport = new vd.entity.Airport({ name: airport, callsign: airport, idvatsim: id });
                            airports.push(currentAirport);
                        }
                        currentAirport.addAtc(atc);
                    }
                    atcs.push(atc);
                }
            } else if (section == "GENERAL") {
                var kv = this._splitGeneralSection(line);
                if (!Object.isNullOrUndefined(kv)) {
                    if (kv[0] == "UPDATE") {
                        var dt = Date.parseString(kv[1], "yyyyMMddHHmmss");
                        if (this.readHistory.contains(dt))
                            return exports.VatsimClients.NoNewData;
                        else {
                            this.update = dt;
                            this.readHistory.unshift(this.update);
                        }
                    } else if (kv[0] == "CONNECTED CLIENTS") this.clientsConnected = kv[1] * 1;
                }
            }
        } // end parsing lines

        // update info, helper entities
        if (Object.isNullOrUndefined(this.update)) alert("Update undefined in VATSIM data parsing");
        this.info = this.update.format("dd.MM.yyyy HH:mm:ss") + " " + this.clientsConnected;
        this.atcs = atcs; // atc currently replaced, since not displayed on map
        this.flightplans = flightplans;

        // VISUAL (displayed) entities are updated, not just replaced
        // This leaves the references to this object intact, just changes its values

        // update flights
        this.flights = vd.entity.Flight.updateFlights(this.flights, flights);
        if (Object.isNullOrUndefined(this.flights)) {
            globals.log.error("Parsing vatsimClients, flights undefined");
            return exports.VatsimClients.ParsingFailed;
        }

        // set airports        
        this.airports = vd.entity.Airport.updateAirports(this.airports, airports, this.flights);
        if (Object.isNullOrUndefined(this.airports)) {
            globals.log.error("Parsing vatsimClients, airports undefined");
            return exports.VatsimClients.ParsingFailed;
        }

        // statistics / log
        this._statisticsParse.add(statsEntry);
        globals.log.trace(statsEntry.toString());

        // completed    
        status = exports.VatsimClients.Ok;

        // bye
        return status;
    };

    /**
    * Part of the parsing
    * @private
    */
    exports.VatsimClients.prototype._splitGeneralSection = function (line) {
        if (String.isNullOrEmpty(line)) return null;
        if (line.indexOf("=") < 0) return [line];
        var kv = line.split("=");
        return [kv[0].trim(), kv[1].trim()];
    };

    /**
    * Get all clients. While this.clients only gets the primary clients,
    * this returns all of them.
    * @returns {Array} array of Flight, Airport ...
    */
    exports.VatsimClients.prototype.allClients = function () {
        var c = this.flights.concat(this.airports);
        c = c.concat(this.flightplans);
        c = c.concat(this.atcs);
        return c;
    };

    /**
    * All primary clients, not the helper entities.
    * @returns {Array} array of Flight, Airport ...
    */
    exports.VatsimClients.prototype.vatsimClients = function () {
        var c = this.flights.concat(this.airports);
        return c;
    };

    /**
    * Number of primary clients.
    * @returns {Number}
    */
    exports.VatsimClients.prototype.count = function () {
        return this.vatsimClients().length;
    };

    /**
    * Find by unique object id.
    * @param {Number} objectId
    * @returns {BaseEntityModel}
    */
    exports.VatsimClients.prototype.findByObjectId = function (objectId) {
        var clients = this.allClients();
        return vd.entity.base.BaseEntityModel.findByObjectId(clients, objectId);
    };

    /**
    * Find by id.
    * @param {Number} id
    * @returns {Array} BaseEntityModel
    */
    exports.VatsimClients.prototype.findByVatsimId = function (id) {
        var clients = this.allClients();
        return vd.entity.base.BaseEntityModel.findByObjectId(clients, id);
    };

    /**
    * Find client with first occurance of id.
    * @param {Number} id
    * @returns {BaseEntityModel}
    * @see BaseEntityModel#findByVatsimIdFirst
    */
    exports.VatsimClients.prototype.findByVatsimIdFirst = function (id) {
        var clients = this.allClients();
        return vd.entity.base.BaseEntityModel.findByVatsimIdFirst(clients, id);
    };

    /**
    * Find displayed / hidden flights.
    * @param {Boolean} displayed
    * @returns {Array} flights displayed / not displayed
    */
    exports.VatsimClients.prototype.findFlightsDisplayed = function (displayed) {
        return vd.entity.base.BaseEntityMap.findByDisplayed(this.flights, displayed);
    };

    /**
    * Find flights in bounds.
    * @param {Boolean} inBounds
    * @returns {Array} flights displayed / not displayed
    */
    exports.VatsimClients.prototype.findFlightsInBounds = function (inBounds) {
        return vd.entity.base.BaseEntityMap.findInBounds(this.flights, inBounds);
    };

    /**
    * Never read, init status
    * @type {Number}
    * @const
    */
    exports.VatsimClients.Init = -1;
    /**
    * Reading OK.
    * @type {Number}
    * @const
    */
    exports.VatsimClients.Ok = 0;
    /**
    * Reading but no new data.
    * @type {Number}
    * @const
    */
    exports.VatsimClients.NoNewData = 1;
    /**
    * Reading failed.
    * @type {Number}
    * @const
    */
    exports.VatsimClients.ReadFailed = 10;
    /**
    * Parsing failed.
    * @type {Number}
    * @const
    */
    exports.VatsimClients.ParsingFailed = 11;
    /**
    * Status code to readable message.
    * @type {Number}
    * @return {String}
    */
    exports.VatsimClients.statusToInfo = function (status) {
        var info;
        switch (status) {
            case vd.entity.VatsimClients.Init:
                info = "Init";
                break;
            case vd.entity.VatsimClients.Ok:
                info = "Data loaded";
                break;
            case vd.entity.VatsimClients.NoNewData:
                info = "No new data, skipping read";
                break;
            case vd.entity.VatsimClients.ReadFailed:
                info = "Read failed";
                break;
            case vd.entity.VatsimClients.ParsingFailed:
                info = "Parser failed";
                break;
            default:
                info = "Unknown, check console";
                break;
        }
        return info;
    };
});