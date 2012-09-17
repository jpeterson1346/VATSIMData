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
    * @author KWB
    */
    exports.FsxWs = function (fsxWsLocation, fsxWsPort) {

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
        * @type {String} 
        */
        this.update = null;
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

        // call init methods
        this.initServerValues(fsxWsLocation, fsxWsPort);

        //
        // ---- statistics
        //

        /**
        * Log read statistics.
        * @type {vd.util.RuntimeStatistics}
        */
        this._statisticsRead = new vd.util.RuntimeStatistics("FsxWs read");
        /**
        * Log parse statistics.
        * @type {vd.util.RuntimeStatistics}
        */
        this._statisticsParse = new vd.util.RuntimeStatistics("FsxWs parse");
        /**
        * Log parse statistics.
        * @type {vd.util.RuntimeStatistics}
        */
        this._statisticsDisplay = new vd.util.RuntimeStatistics("FsxWs display");
    };

    /**
    * Init the server values and build a valid URL.
    * @param {String} fsxWsLocation like localhost, mycomputer.here.local 
    * @param {Number} fsxWsPort e.g. 8080 
    * @return {Boolean} true values have been reset, false nothing changed (values remain)
    */
    exports.FsxWs.prototype.initServerValues = function (fsxWsLocation, fsxWsPort) {
        this.serverUrl = null;
        this.serverPort = -1;
        this.serverLocation = null;

        // no values at all, return
        if (Object.isNullOrUndefined(fsxWsLocation) && Object.isNullOrUndefined(fsxWsPort)) return;

        // set location or default
        if (String.isNullOrEmpty(fsxWsLocation) && Object.isNullOrUndefined(this.serverLocation))
            this.serverLocation = "localhost";
        else if (!String.isNullOrEmpty(fsxWsLocation))
            this.serverLocation = fsxWsLocation;

        // set port
        if (!Object.isNumber(fsxWsPort) && this.serverPort < 0)
            this.serverPort = 8080;
        else if (Object.isNumber(fsxWsPort))
            this.serverPort = fsxWsPort;

        // set URL
        var url = "http://" + this.serverLocation;
        if (this.serverPort != 80) url += ":" + this.serverPort;
        url += "/aircraftsJson";
        this.serverUrl = url;
    };

    /**
    * Read data from the WebService (JSON). I do not use the jQuery method in order to be 
    * consistent with the Vatsim clients read method (synchronous read, return values). 
    * @return {Number} status, const values indicating if data was already available or something failed
    * @see vd.entity.VatsimClients.readFromVatsim 
    */
    exports.FsxWs.prototype.readFromFsxWs = function () {
        if (Object.isNullOrUndefined(this.serverUrl)) return exports.FsxWs.NoFsxWs;

        this._statisticsRead.start();
        // ReSharper disable InconsistentNaming
        var xmlhttp = new XMLHttpRequest();
        // ReSharper restore InconsistentNaming
        xmlhttp.open("GET", this.serverUrl, false);
        xmlhttp.send();
        if (xmlhttp.status == 200) {
            var xml = xmlhttp.responseText;
            if (xml.isNullOrEmpty()) return exports.FsxWs.ReadNoData;
            var parsedAircrafts = jQuery.parseJSON(xml);
            if (Object.isNullOrUndefined(parsedAircrafts)) return exports.FsxWs.ReadNoData;

            // valid data
            this.aircrafts = parsedAircrafts;
            var dt = vd.utils.Utils.nowFormattedYYYYMMDDhhmm(true);
            this.readHistory.unshift(dt);
            this.update = dt;

            // stats
            var rtEntry = this._statisticsRead.end(); // I just write full reads (not failed reads) in the statistics in order to get real comparisons
            globals.googleAnalyticsEvent("readFromFsxWs", "FULLREAD", rtEntry.timeDifference);
            return exports.FsxWs.Ok;
        } else {
            globals.log.error("FsxWs data cannot be loaded, status " + xmlhttp.status + ". ");
            return exports.FsxWs.ReadFailed;
        }
    };

    /**
    * Is FsxWs available?
    * @return {Boolean} available?
    */
    exports.FsxWs.prototype.isAvailable = function () {
        if (Object.isNullOrUndefined(this.serverUrl)) return false;

        // ReSharper disable InconsistentNaming
        var xmlhttp = new XMLHttpRequest();
        // ReSharper restore InconsistentNaming
        xmlhttp.open("GET", this.serverUrl, false);
        xmlhttp.send();
        return (xmlhttp.status == 200);
    };

    /**
    * Display the clients (invoke display on all entities).
    * This will display the entities if they are in bounds of the map.
    * @param {Boolean} display
    * @param {Boolean} [forceRedraw] redraw, e.g. because settings changed
    */
    // exports.FsxWs.prototype.display = function (display, forceRedraw) {
    // };

    /**
    * Clear all overlays of all clients.
    */
    exports.FsxWs.prototype.clearOverlays = function () {
    };

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

});