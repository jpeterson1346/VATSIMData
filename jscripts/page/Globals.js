/**
* @module vd.page
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.page', function(exports) {

    /**
    * @classdesc
    * Things frequently needed in a global context, e.g. options to write log
    * information and settings.
    * @constructor
    * @author KWB
    */
    exports.Globals = function() {

        var now = new Date();
        var isOsWindows = BrowserDetect.OS.toLowerCase().startsWith("win");

        /**
        * All query parameters
        * @type {Object}
        * @public
        * @example fsxlocation, fsxwsport, gmzoom, gmlat, gmlng
        */
        this.queryParameters = vd.util.UtilsWeb.getQueryParameters();

        /**
        * Only the map (used in iframe etc.)?
        * @type {Boolean}
        * @public
        */
        this.isOnlyMapMode = window.location.pathname.contains("include", true);

        // version
        this.version = "N/A";
        this._initVersion();

        // Logger: http://log4javascript.org/docs/manual.html#configuration
        this.log = null;
        this.logAppenderPopUp = null;
        this.logAppenderConsole = null;
        this.logUseAppenderPopUp = !this.isOnlyMapMode;
        this.logUseAppenderConsole = true;
        this._initLogger();
        this.traceSemaphores = false;
        this.traceAircraftIconMapping = false;

        // urls
        this.urlUserManual = "./doc/Help.pdf";
        this.urlVATroute = "http://www.vatroute.net/";
        this.urlProjectLegalText = "http://vatgm.codeplex.com/wikipage?title=Legal";
        this.urlProjectGettingInvolved = "http://vatgm.codeplex.com/";
        this.urlProjectReportBugs = "http://vatgm.codeplex.com/workitem/list/basic";
        this.urlProjectFeatureRequests = "http://vatgm.codeplex.com/discussions";
        this.urlProjectProvideCharts = "http://vatgm.codeplex.com/wikipage?title=Ground%20overlay%20charts";
        this.urlVatasimPilot = "http://www.vataware.com/pilot.cfm?cid=";
        this.urlVatsimMetar = "http://metar.vatsim.net/search_metar.php?id=";
        this.urlFsxWsDefault = "http://localhost:8080/";
        this.urlFsxWsProject = "http://fsxws.codeplex.com";

        // global id counter
        this._idCounter = 1000000; // starting value, makes it easier to distinguish from other ids
        this._objects = null;

        /**
        * The Vatsim clients.
        * @type {vd.entity.VatsimClients}
        */
        this.vatsimClients = null;
        /**
        * VATSIM Metar data
        * @type {vd.entity.helper.VatsimMetar}
        */
        this.vatsimMetar = new vd.entity.helper.VatsimMetar();

        /**
        * FsxWs JSON objects from web service.
        * @type {vd.entity.FsxWs}
        */
        this.fsxWs = null;
        this.fsxWsAvailabilityDelay = 3000; // before expectiny availability results [ms]

        /** 
        * Combined entities (VATSIM, FSX, ..)
        * @type {vd.entity.base.EntityMapList}
        */
        this.allEntities = null;

        /** 
        * Usage mode (Moving map, ...)
        * @type {Number}
        * @see vd.module:page.PageController
        */
        this.usageMode = vd.page.PageController.UsageModeVatsimOnly;

        // reset all entities
        this.resetEntities();

        // sidebar dimensions
        this.sideBarMinWidth = null;
        this.sideBarWideWidth = 375; // threshold if side bar is considered "wide"
        this.sideBarLocationDisplay = null;
        this.sideBarSettingsDisplay = null;
        this.sideBarDataDisplay = null;
        this.sideBarEntitiesDisplay = null;
        this.sideBarCreditsDisplay = null;
        this.sideBarRouteDisplay = null;
        this.sideBarNavaidsDisplay = null;
        this.sideBarOverlaysDisplay = null;
        this.sideBarAboutDisplay = null;
        this.sideBarFsxWsUrlMaxChars = 30; // truncate too long URLs
        this.headerTaskInfoDisplay = null;

        // styles
        this.styles = new vd.entity.base.Styles();

        // map
        this.map = null;
        this.mapOverlayView = null;
        this.mapOldCenter = null;
        this.mapFollowId = null; // Object id being followed
        this.mapOldZoom = -1;
        this.mapRelevantMovement = 5; // 5%
        this.mapElevationZeroCutoff = true; // Google features sea levels < 0, I am aware this will cutoff some places on land < 0
        this.altitudesDigitsDisplayed = 2; // height, elevation, altitude
        this.coordinatesDigitsDisplayed = 3; // rounding for displayed coordinates
        this.coordinatesDigitsCalculation = 6; // rounding for calculations
        this.angelsDigitsDisplayed = 2;

        // Places, geolocation
        this.geolocation = navigator.geolocation; // browser supports feature
        this.geolocationWorking = this.geolocation; // feature is really working
        this.geolocationLat = 0;
        this.geolocationLon = 0;
        this.geocoder = new google.maps.Geocoder(); // resolve places etc.

        // Elevation
        this.elevationServiceEnabled = isOsWindows && !this.isOnlyMapMode;
        this.elevationService = new google.maps.ElevationService(); // resolves elevations
        this.elevationServicePathRequestSamples = 200;
        this.elevationSingleSamplesMax = 75;

        // (Grounds) overlays
        this.groundOverlaySettings = new vd.entity.GroundOverlaySettings();
        this.groundOverlays = new vd.entity.helper.GroundOverlays(this.map);
        this.groundOverlayMinPixelX = 200; // instead of a zoom level we decide on pixel size
        this.groundOverlayMinPixelY = 200;

        // data grids
        this.gridSelectedEntity = null;
        this.gridJqGridUnloadPossible = isOsWindows; // add additional columns when on a wide screen.

        // altitude profile
        this.altitudeProfile = null;
        this.altitudeProfileSettings = new vd.gc.AltitudeProfileSettings();

        // flights, which property to display and how
        this.flightImageWidth = 20;
        this.flightImageHeight = 20;
        this.flightImageWidthLarge = 26;
        this.flightImageHeightLarge = 26;
        this.flightImageWidthSmall = 16;
        this.flightImageHeightSmall = 16;
        this.flightImageWidthSimplified = 10;
        this.flightImageHeightSimplified = 10;
        this.flightGridRows = 10;
        this.flightHideZoomLevel = 4;
        this.flightMouseoverTimeout = 6 * 1000; //ms
        this.flightSettings = new vd.entity.FlightSettings();
        this.aircraftDataUrl = vd.util.UtilsWeb.replaceCurrentPage("jscripts/entity/AircraftData.json");

        this.atcGridRows = 10;
        this.atcHideZoomLevel = 4;
        this.atcSettings = new vd.entity.helper.AtcSettings();

        // Waypoints
        this.waypointSettings = new vd.entity.helper.WaypointSettings(
            {
                displayFlightWaypointsWhenGrounded: false,
                flightWaypointsNumberMaximum: 50 // default
            }
        );
        this.waypointHideZoomLevel = 4;
        this.waypointLinesHideZoomLevel = 4;

        // Airport
        this.airportHideZoomLevel = 4;
        this.airportAtisTextWidth = 30;
        this.airportSettings = new vd.entity.AirportSettings();

        // route
        this.routeSettings = new vd.entity.RouteSettings();

        // navaids
        this.navaidSettings = new vd.entity.NavaidSettings();
        this.navaidImageWidth = 20;
        this.navaidImageHeight = 20;
        this.navaidHideZoomLevel = 4;
        this.navaidMouseoverTimeout = 6 * 1000; //ms

        // filter
        this.filtered = false;
        this.filter = new vd.entity.base.EntityList();

        // units / threshold
        this.unitAltitude = "ft";
        this.unitSpeed = "kts";
        this.unitDistance = "nm";
        this.unitRateOfClimb = "ft/min";
        this.groundedSpeedThreshold = 30; // 30kts
        this.groundedHeightThreshold = 100; // 100ft AGL considered "grounded"

        // variation (=declination in WMM)
        this.worldMagneticModel = new WorldMagneticModel();
        this.worldMagneticModelDate = now.getFullYear() + (now.getMonth() / 12);

        // semaphores
        this._asyncBoundsUpdateSemaphore = false;

        // timers / collective events
        this.timerDispatcherSemaphore = false;
        this.timerCleanUpInfoBar = 10000; // clean info message after ms
        this.timerKickOffTime = 5000; // kick off time after ms
        this.timerLoadVatsimUpdate = -1;
        this.timerFsxDataUpdate = -1;
        this.timerLoadVatsimUpdateLastCall = new Date(0); // date in the past
        this.timerFsxDataUpdateLastCall = new Date(0); // date in the past
        this.timerInitialCall = true;
        this.collectiveBoundsChangedInterval = 2500; // ms
        this.collectiveBackgroundRefreshEvent = 2000; // ms
        this.collectiveBackgroundGridsDelay = 3000; // ms
        this.collectiveBoundsWindowsRefreshDelay = 1000; // ms

        // jQuery
        jQuery.support.cors = true;
    };

    /**
    * Assign a new / other map.
    * @param {google.maps.Map} map
    **/
    exports.Globals.prototype.assignMap = function(map) {
        this.allEntities.disposeData(); // re-entry, clean up
        this._objects = [];
        this.map = map;
        this.groundOverlays.setMap(map);
        this.mapOverlayView = new google.maps.OverlayView();
        this.mapOverlayView.setMap(map);
        this.mapOverlayView.draw = function() {
            if (!this.ready) {
                this.ready = true;
                google.maps.event.trigger(this, 'ready');
            }
        };
    };

    /**
    * Is the FsxWs service available?
    * @return {Boolean} available
    **/
    exports.Globals.prototype.isFsxWsAvailable = function() {
        if (Object.isNullOrUndefined(this.fsxWs)) return false;
        return this.fsxWs.successfulRead();
    };

    /**
    * Is the given value within the visible viewport's bounds?
    * @param {LatLng} latLng position to be checked.
    * @see Globals#map
    */
    exports.Globals.prototype.isInBounds = function(latLng) {
        return this.map.getBounds().contains(latLng);
    };

    /**
    * Registers an object and get the unique key.
    * @param  {Object} newObject: to be registered object
    * @return {Number} objectId
    */
    exports.Globals.prototype.register = function(newObject) {
        if (Object.isNullOrUndefined(newObject)) return -1;
        var id = this._idCounter++;
        this._objects[id] = newObject;
        return id;
    };

    /**
    * Get an object id without(!) registering an object. This allows to use (abuse?) the ids
    * on temporary objects.
    * @return {Number} objectId
    */
    exports.Globals.prototype.getObjectId = function() {
        var id = this._idCounter++;
        return id;
    };

    /**
    * Get an object by its unique id.
    * @param  {Number} id
    * @return {Object}
    */
    exports.Globals.prototype.getObject = function(id) {
        return this._objects[id];
    };

    /**
    * Reset the clients.
    */
    exports.Globals.prototype.resetEntities = function() {
        // dispose all entities but recycle the list
        if (!Object.isNullOrUndefined(this.allEntities)) this.allEntities.disposeData();
        this.allEntities = new vd.entity.base.EntityMapList();

        // FsxWs data, do not recycle but create new, maybe params have changed
        if (!Object.isNullOrUndefined(this.fsxWs)) this.fsxWs.disposeData();
        if (Object.isNullOrUndefined(this.queryParameters)) alert("Query parameters not initalized");
        this.fsxWs = new vd.entity.FsxWs(this.queryParameters.fsxlocation, this.queryParameters.fsxwsport, this.urlFsxWsDefault);
        this.fsxWs.enabled = !this.isOnlyMapMode;

        //  VATSIM
        if (!Object.isNullOrUndefined(this.vatsimClients)) this.vatsimClients.disposeData();
        this.vatsimClients = new vd.entity.VatsimClients();

        // new objects
        this._objects = [];
    };

    /**
    * Get objects by an array of ids.
    * @param  {Array} ids
    * @return {Array} 0..n objects
    */
    exports.Globals.prototype.getObjects = function(ids) {
        var objs = [];
        if (Array.isNullOrEmpty(ids)) return objs;
        for (var id in ids) {
            var o = this._objects[id];
            if (!Object.isNullOrUndefined(o)) objs.push(o);
        }
        return objs;
    };

    /**
    * Init the version (by version.txt).
    * @private
    */
    exports.Globals.prototype._initVersion = function() {
        var url = vd.util.UtilsWeb.replaceCurrentPage("version/version.txt");
        // ReSharper disable InconsistentNaming
        var xmlhttp = new XMLHttpRequest();
        // ReSharper restore InconsistentNaming
        xmlhttp.open("GET", url, false);
        xmlhttp.send();
        if (xmlhttp.status === 200) {
            var v = xmlhttp.responseText;
            if (!String.isNullOrEmpty(v)) this.version = v;
        }
    };

    /**
    * Google Analytics events.
    * @param {String} action
    * @param {String} label
    * @param {Number} value (MUST be an INTEGER)
    * @see <a href="http://code.google.com/apis/analytics/docs/tracking/eventTrackerGuide.html">Google Analytics Events</a>
    */
    exports.Globals.prototype.googleAnalyticsEvent = function(action, label, value) {
        value = Object.ifNotNullOrUndefined(value, 0);
        // I have to use the global var _gaq here, because it will be changed to valid object later
        // see: http://stackoverflow.com/questions/7944860/google-analytics-events-when-are-they-send
        _gaq.push(['_trackEvent', 'VatGM', action, label, value]);
    };

    /**
    * Init the logger.
    * @private
    */
    exports.Globals.prototype._initLogger = function() {
        var local = vd.util.UtilsWeb.isLocalServer();
        this.log = log4javascript.getDefaultLogger();
        this.log.removeAllAppenders();

        if (this.logUseAppenderConsole) {
            this.logAppenderConsole = new log4javascript.BrowserConsoleAppender();
            this.log.addAppender(this.logAppenderConsole);
        }

        if (this.logUseAppenderPopUp) {
            var popUpLayout = new log4javascript.PatternLayout("%d{HH:mm:ss} %-5p - %m%n");
            this.logAppenderPopUp = new log4javascript.PopUpAppender({ lazyInit: true, initiallyMinimized: true });
            this.logAppenderPopUp.setFocusPopUp(false);
            this.logAppenderPopUp.setLayout(popUpLayout);
            this.logAppenderPopUp.setShowCommandLine(false);
            this.logAppenderPopUp.setNewestMessageAtTop(true);
            this.log.addAppender(this.logAppenderPopUp);
        }

        // level
        if (this.logUseAppenderConsole || this.logUseAppenderPopUp) {
            this.log.setLevel(local ? log4javascript.Level.TRACE : log4javascript.Level.WARN);
            if (local) {
                // display something and hide
                this.log.info("Local mode for logging, level is " + this.log.getLevel());
                if (this.logUseAppenderPopUp) this.logAppenderPopUp.hide();
            }
        } else {
            // no appenders no logging required
            this.log.setLevel(log4javascript.Level.OFF);
        }
    };
});