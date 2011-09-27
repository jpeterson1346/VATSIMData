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
    * @author KWB
    */
    exports.VatsimClients = function () {
        /**
        * When this was last updated.
        * @type {String} 
        */
        this.update = null;
        /**
        * Number of connected clients (aka VATSIM users).
        * @type {Number}
        */
        this.clientsConnected = 0;
        /**
        * Number of connected clients (aka VATSIM users).
        * @type {Number}
        */
        this.info = "";
        /**
        * Data file location.
        * @type {String}
        */
        this.datafile = null;
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

        // helper entities

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

        // "main" entities 

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
    };

    /**
    * Read data from the VASTIM servers ("data file").
    * @return {Boolean} status, false if data was already available or something failed
    */
    exports.VatsimClients.prototype.readFromVatsim = function () {
        this._setDatafile();
        var runtime = new vd.util.TimeDiff();
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", this.datafile, false);
        xmlhttp.send();
        if (xmlhttp.status == 200) {
            var xml = xmlhttp.responseText;
            var r = this._parseVatsimDataFile(xml);
            if (r)
                globals.log.trace("Data loaded in " + runtime.getDiffFormatted());
            else
                globals.log.error("Data loaded, but parsing failed");
            return r;
        } else {
            globals.log.error("Vatsim data cannot be loaded, status " + xmlhttp.status + ". " + this.datafile);
            return false;
        }
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
    * @return {Boolean} status, false if data was already available or something failed
    */
    exports.VatsimClients.prototype._parseVatsimDataFile = function (rawData) {

        // init
        var timeDiff = new vd.util.TimeDiff();
        var lines = rawData.split("\n");
        var section = "";
        var flights = new Array();
        var flightplans = new Array();
        var atcs = new Array();
        var airports = new Array();
        var currentAirport = null;

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
                    ;
                    var flight = new vd.entity.Flight(
                        {
                            flightplan: flightplan,
                            callsign: callsign,
                            id: id,
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
                            id: id,
                            controller: clientElements[2],
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
                            currentAirport = new vd.entity.Airport({ name: airport, callsign: airport });
                            airports.push(currentAirport);
                        }
                        currentAirport.addAtc(atc);
                    }
                    atcs.push(atc);
                }
            } else if (section == "GENERAL") {
                var kv = this._splitGeneralSection(line);
                if (!Object.isNullOrUndefined(kv)) {
                    var dt = kv[1];
                    if (kv[0] == "UPDATE") {
                        if (this.readHistory.contains(dt))
                            return false; // break!
                        else {
                            this.update = Date.parseString(kv[1], "yyyyMMddHHmmss");
                            this.readHistory.unshift(this.update);
                        }
                    } else if (kv[0] == "CONNECTED CLIENTS") this.clientsConnected = kv[1] * 1;
                }
            }
        } // end parsing lines

        // update info, helper entities
        this.info = this.update.format("dd.MM.yyyy HH:mm:ss") + " " + this.clientsConnected;
        this.atcs = atcs;
        this.flightplans = flightplans;

        // update flights with elevation
        var success = false;
        if (!globals._asyncBoundsUpdateSemaphore) {
            globals._asyncBoundsUpdateSemaphore = true;

            // set flights
            this.flights = vd.entity.Flight.updateFlights(this.flights, flights);
            if (!Object.isNullOrUndefined(this.flights)) {
                var flightsInBounds = vd.entity.base.BaseEntityMap.findInBounds(this.flights);
                vd.gm.Elevation.getElevationsForEntities(flightsInBounds); // runs asynchronously
            } else {
                globals.log.error("Parsing clients, flights undefined");
            }
            // set airports        
            this.airports = vd.entity.Airport.updateAirports(this.airports, airports, this.flights);
            if (Object.isNullOrUndefined(this.airports)) {
                globals.log.error("Parsing clients, airports undefined");
            }
            
            // trace
            globals.log.trace("Parsing completed " + timeDiff.getDiffFormatted());
            
            // completed    
            globals._asyncBoundsUpdateSemaphore = false;
            success = true;
        } else {
            // handling of race condition
            globals.log.warn("Parsing clients, race condition detected!");
        }

        // bye
        return success;
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
    * Display the clients (invoke display on all entities).
    * @param {Boolean} display
    * @param {Boolean} [forceRedraw] redraw, e.g. because settings changed
    */
    exports.VatsimClients.prototype.display = function (display, forceRedraw) {
        if (this.count() < 1) return;
        var clients = this.clients();
        vd.entity.base.BaseEntityMap.display(clients, display, forceRedraw);
    };

    /**
    * Clear all overlays of all clients.
    */
    exports.VatsimClients.prototype.clearOverlays = function () {
        if (this.count() < 1) return;
        this.display(false, false);
        var clients = this.allClients();
        for (var c = 0, len = clients.length; c < len; c++) {
            var client = clients[c];
            if (!Object.isNullOrUndefined(client.overlays)) client.overlays.clear();
        }
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
    exports.VatsimClients.prototype.clients = function () {
        var c = this.flights.concat(this.airports);
        return c;
    };

    /**
    * Number of primary clients.
    * @returns {Number}
    */
    exports.VatsimClients.prototype.count = function () {
        return this.clients().length;
    };

    /**
    * Find by unique object id.
    * @param {Number} objectId
    * @returns {BaseEntityVatsim}
    */
    exports.VatsimClients.prototype.findByObjectId = function (objectId) {
        var clients = this.allClients();
        return vd.entity.base.BaseEntityVatsim.findByObjectId(clients, objectId);
    };

    /**
    * Find by id.
    * @param {Number} id
    * @returns {Array} BaseEntityVatsim
    */
    exports.VatsimClients.prototype.findById = function (id) {
        var clients = this.allClients();
        return vd.entity.base.BaseEntityVatsim.findByObjectId(clients, id);
    };

    /**
    * Find client with first occurance of id.
    * @param {Number} id
    * @returns {BaseEntityVatsim}
    * @see BaseEntityVatsim#findByIdFirst
    */
    exports.VatsimClients.prototype.findByIdFirst = function (id) {
        var clients = this.allClients();
        return vd.entity.base.BaseEntityVatsim.findByIdFirst(clients, id);
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
});