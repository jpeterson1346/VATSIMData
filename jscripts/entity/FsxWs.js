/**
* @module vd.entity
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity', function (exports) {
    /**
    * @constructor
    * @classdesc 
    * Connecting to FsxWs. Read data from FSX via a web service
    * @see vd.module:page.PageController main user of this "class", in order to display the airplanes
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
    * @param {Boolean} [availability] check
    * @param {Boolean} [autoEnableDisable] error / success leads to enabled / disabled service
    * @see vd.entity.VatsimClients.readFromVatsim 
    */
    exports.FsxWs.prototype.readFromFsxWs = function (availability, autoEnableDisable) {
        availability = Object.ifNotNullOrUndefined(availability, false);
        autoEnableDisable = Object.ifNotNullOrUndefined(autoEnableDisable, true);
        if (!availability && !this.enabled) return;
        if (Object.isNullOrUndefined(this.serverUrl)) return;
        if (!jQuery.support.cors) alert("jQuery CORS not enabled");
        if (this.loading) {
            alert("Concurrent loading from FsxWs");
            return;
        }
        this.loading = true;
        var url = availability ? this.serverUrl + exports.FsxWs.QueryParameterTest : this.serverUrl + exports.FsxWs.QueryParameterNoWaypoints;
        this._statisticsRead.start();
        var me = this;

        // AJAX call
        $.ajax({
            type: 'GET',
            url: url,
            cache: false,
            async: true,
            crossdomain: true,
            datatype: "jsonp",
            success: function (data, status) {
                // alert("Data returned :" + data);
                // alert("Status :" + status);
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
                            me.lastStatus = exports.FsxWs.Ok;
                        } else {
                            globals.log.trace("FsxWs Data loaded but no data in array");
                            me.lastStatus = exports.FsxWs.ReadNoData;
                        }
                    }
                    // final state
                    if (autoEnableDisable) me.enabled = true;
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
                errorThrown = String.isNullOrEmpty(errorThrown) ? "N/A" : errorThrown;
                var msg = "FsxWs data cannot be loaded, status: \"" + textStatus + "\". Error: \"" + errorThrown + "\". URL: " + url;
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
    * Merge with VATSIM data.
    * @param  {Array} vatsimClients
    * @return {Array}
    */
    exports.FsxWs.prototype.mergeWithVatsimClients = function (vatsimClients) {
        if (Array.isNullOrEmpty(vatsimClients)) {
            if (Array.isNullOrEmpty(this.aircrafts)) return new Array();
            return this.aircrafts;
        }
        // TODO: KB merge FSX and Vatsim data
        return vatsimClients;
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
                info = "FSX data loaded";
                break;
            case vd.entity.FsxWs.ReadFailed:
                info = "Read failed.";
                break;
            case vd.entity.FsxWs.NoFsxWs.ReadNoData:
                info = "No data.";
                break;
            default:
                info = "Unknown, check console.";
                break;
        }
        return info;
    };
});