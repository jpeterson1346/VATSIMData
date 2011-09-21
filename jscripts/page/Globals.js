/**
* @module vd.page
*/
namespace.module('vd.page', function (exports) {

    /**
    * Things frequently needed in a global context.
    * @constructor
    */
    exports.Globals = function () {

        var now = new Date();

        // Logger: http://log4javascript.org/docs/manual.html#configuration
        this._initLogger();

        // Vatsim objects
        this._idCounter = 0;
        this.clients = new vd.entity.VatsimClients();
        this.metar = new vd.entity.helper.VatsimMetar();

        // map dimensions
        this.mapCanvasWidth = null;
        this.mapCanvasHeight = null;

        // sidebar dimensions
        this.sideBarWidth = null;
        this.sideBarMinWidth = null;
        this.sideBarLocationDisplay = null;
        this.sideBarSettingsDisplay = null;
        this.sideBarDataDisplay = null;
        this.sideBarEntitiesDisplay = null;
        this.sideBarCreditsDisplay = null;
        this.headerTaskInfoDisplay = null;

        // height profile dimensions
        this.altitudeProfileWidth = null;
        this.altitudeProfileHeight = null;

        // styles
        this.styles = new vd.entity.base.Styles();

        // map
        this.map = null;
        this.mapOverlayView = null;
        this.mapOldCenter = null;
        this.mapFollowVatsimId = null;
        this.mapOldZoom = -1;
        this.mapRelevantMovement = 5; // 5%
        this.mapElevationZeroCutoff = true; // google features sea levels < 0, I am aware this will cutoff some places on land < 0
        this.altitudesDigitsDisplayed = 2; // height, elevation, altitude
        this.coordinatesDigitsDisplayed = 3; // rounding for displayed coordinates
        this.coordinatesDigitsCalculation = 6; // rounding for calculations
        this.angelsDigitsDisplayed = 2;
        this.geolocation = navigator.geolocation; // browser supports feature
        this.geolocationWorking = this.geolocation; // feature is really working
        this.geolocationLat = 0;
        this.geolocationLon = 0;
        this.geocoder = new google.maps.Geocoder(); // resolve places etc.
        this.elevator = new google.maps.ElevationService(); // resolves elevations
        this.elevatorElevationPathRequestSamples = 200;

        // data grids
        this.gridSelectedVatsimClient = null;

        // height profile
        this.altitudeProfile = null;
        this.altitudeProfileSettings = new vd.gc.AltitudeProfileSettings();

        // which property to display and how
        this.flightSettings = new vd.entity.FlightSettings();
        this.flightGridRows = 10;
        this.flightHideZoomLevel = 4;
        this.flightWaypointsWhenGrounded = false;
        this.flightMouseoverTimeout = 6 * 1000; //ms

        this.atcSettings = new vd.entity.helper.AtcSettings();
        this.atcGridRows = 10;
        this.atcHideZoomLevel = 4;

        this.waypointSettings = new vd.entity.helper.WaypointSettings();
        this.waypointHideZoomLevel = 4;
        this.waypointLinesHideZoomLevel = 4;

        this.airportSettings = new vd.entity.AirportSettings();
        this.airportHideZoomLevel = 4;
        this.airportAtisTextWidth = 30;

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

        // declination
        this.worldMagneticModel = new WorldMagneticModel();
        this.worldMagneticModelDate = now.getFullYear() + (now.getMonth() / 12);

        // semaphores
        this._asyncBoundsUpdateSemaphore = false;

        // timers
        this.timerCleanUpInfoBar = 10000; // clean info message after ms
        this.timerUpdateGridsDelay = 3000; // ms
        this.timerLoadUpdate = -1;

        // urls
        this.urlLegalText = "http://vatgm.codeplex.com/wikipage?title=Legal";
        this.urlVatasimPilot = "http://www.vataware.com/pilot.cfm?cid=";
        this.urlGettingInvolved = "http://vatgm.codeplex.com/";
        this.urlVatsimMetar = "http://metar.vatsim.net/search_metar.php?id=";
    };

    /**
    * Assign a map.
    * @param {google.maps.Map} map
    **/
    exports.Globals.prototype.assignMap = function (map) {
        this.clients.clearOverlays(); // re-entry, clean up
        this.map = map;
        this.objects = new Array();

        this.mapOverlayView = new google.maps.OverlayView();
        this.mapOverlayView.setMap(map);
        this.mapOverlayView.draw = function () {
            if (!this.ready) {
                this.ready = true;
                google.maps.event.trigger(this, 'ready');
            }
        };
    };

    // Is the given value within the visible viewport's bounds?
    // @param {LatLng} latLng position to be checked.
    exports.Globals.prototype.isInBounds = function (latLng) {
        return this.map.getBounds().contains(latLng);
    };

    // Registers an object.
    // @param  {Object} newObject: to be registered object
    // @return {String} objectId
    exports.Globals.prototype.register = function (newObject) {
        if (newObject == null) return -1;
        var id = this._idCounter++;
        this.objects[id] = newObject;
        return id.toString();
    };

    // Get an object by its unique id.
    // @param  {Number} id
    // @return {Object}
    exports.Globals.prototype.getObject = function (id) {
        return this.objects[id];
    };

    // Resets the clients
    exports.Globals.prototype.resetClients = function () {
        if (!Object.isNullOrUndefined(this.clients)) this.clients.display(false, true);
        this.clients = new vd.entity.VatsimClients();
    };

    // Get objects by an array of ids.
    // @param  {Array} ids
    // @return {Array} 0..n objects
    exports.Globals.prototype.getObjects = function (ids) {
        var objs = new Array();
        if (ids == null || objs.length < 1) return objs;
        for (var id in ids) {
            var o = this.objects[id];
            if (o != null) objs.push(o);
        }
        return objs;
    };

    /**
    * Init the logger.
    * @private
    **/
    exports.Globals.prototype._initLogger = function () {
        var local = vd.util.UtilsWeb.isLocalServer();
        var popUpLayout = new log4javascript.PatternLayout("%d{HH:mm:ss} %-5p - %m%n");
        this.log = log4javascript.getDefaultLogger();
        this.log.removeAllAppenders();
        this.log.setLevel(local ? log4javascript.Level.TRACE : log4javascript.Level.WARN);
        this.logAppender = new log4javascript.PopUpAppender({ lazyInit: true, initiallyMinimized: true });
        this.logAppender.setFocusPopUp(false);
        this.logAppender.setLayout(popUpLayout);
        this.logAppender.setShowCommandLine(false);
        this.logAppender.setNewestMessageAtTop(true);
        this.log.addAppender(this.logAppender);
        if (local) {
            // display something and hide
            this.log.info("Local mode");
            this.logAppender.hide();
        }
    };
});