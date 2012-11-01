/**
* @module vd.page
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.page', function(exports) {

    /**
    * Units have been changed (distance, climb rate etc.)
    * @param {Boolean} [redisplay]
    */
    exports.PageController.prototype.unitsChanged = function(redisplay) {
        redisplay = Object.isNullOrUndefined(redisplay) ? true : redisplay;
        var d = $(document.getElementById("inputSettingsDistance")).val();
        var a = $(document.getElementById("inputSettingsAltitude")).val();
        if (d == "km") {
            globals.unitDistance = "km";
            globals.unitSpeed = "km/h";
        } else {
            globals.unitDistance = "nm";
            globals.unitSpeed = "kts";
        }
        if (a == "ft") {
            globals.unitAltitude = "ft";
            globals.unitRateOfClimb = "fpm";
        } else {
            globals.unitAltitude = "m";
            globals.unitRateOfClimb = "m/s";
        }

        // redisplay
        if (redisplay) this.refresh();
    };

    /**
    * Settings for the entites (flight, ATC, waypoints) has been changed.
    * @param {Object} mode specify further actions { initializeOnly: only initialize, do not refresh the GUI, toggleFlights: show / hide flights }
    */
    exports.PageController.prototype.vatsimClientSettingsChanged = function(mode) {
        // make sure we have a mode
        mode = Object.ifNotNullOrUndefined(mode, { });

        var fs = globals.flightSettings;
        if (!Object.isNullOrUndefined(mode["toggleFlights"]) && mode["toggleFlights"]) {
            vd.util.UtilsWeb.toggleCheckbox("inputFlightSettingsShowFlight");
        }

        fs.set({
                displayFlight: document.getElementById("inputFlightSettingsShowFlight").checked,
                displayCallsign: document.getElementById("inputFlightSettingsCallsign").checked,
                displayPilot: document.getElementById("inputFlightSettingsPilot").checked,
                displayId: document.getElementById("inputFlightSettingsId").checked,
                displayTransponder: document.getElementById("inputFlightSettingsTransponder").checked,
                displayOnGround: document.getElementById("inputFlightSettingsOnGround").checked,
                displaySpeedAltitudeHeading: document.getElementById("inputFlightSettingsSpeedAltitudeHeading").checked,
                displayWaypointLines: document.getElementById("inputFlightSettingsWaypointLines").checked,
                displayAircraft: document.getElementById("inputFlightSettingsAircraft").checked,
                displayRequireFlightplan: document.getElementById("inputFlightSettingsRequireFlightplan").checked,
                displayHeightAndDeclination: document.getElementById("inputFlightSettingsHeightAndDeclination").checked
            }
        );

        var atc = globals.atcSettings;
        atc.set({
            displayAtc: document.getElementById("inputAtcSettingsShowAtc").checked,
            displayCallsign: document.getElementById("inputAtcSettingsCallsign").checked,
            displayController: document.getElementById("inputAtcSettingsController").checked,
            displayId: document.getElementById("inputAtcSettingsId").checked,
            displayAreaAtc: document.getElementById("inputAtcSettingsAreaAtc").checked,
            displayObservers: document.getElementById("inputAtcSettingsObserver").checked
        });

        var ap = globals.airportSettings;
        ap.set({
            displayAirport: document.getElementById("inputAirportSettingsShowAirport").checked,
            displayAirportVicinity: document.getElementById("inputAirportSettingsVicinity").checked,
            displayAtis: document.getElementById("inputAirportSettingsAtis").checked,
            displayMetar: document.getElementById("inputAirportSettingsMetar").checked
        });

        var ws = globals.waypointSettings;
        ws.set({
            displayFlightWaypoints: document.getElementById("inputWaypointSettingsFlight").checked,
            displayFlightCallsign: document.getElementById("inputWaypointSettingsFlightCallsign").checked,
            displayFlightAltitudeSpeed: document.getElementById("inputWaypointSettingsFlightSpeedAltitudeHeading").checked,
            flightWaypointsNumberMaximum: $("#inputWaypointSettingsFlightMaxNumber").val(),
            displayDistance: document.getElementById("inputRouteSettingsDistance").checked,
            displayFrequency: document.getElementById("inputRouteSettingsFrequency").checked,
            displayCourse: document.getElementById("inputRouteSettingsCourse").checked,
            displayAirway: document.getElementById("inputRouteSettingsAirway").checked
        });

        // redisplay
        if (Object.isNullOrUndefined(mode["initializeOnly"]) || !mode["initializeOnly"]) this.backgroundRefresh();
    };

    /**
    * Settings for the navaids has been changed.
    * @param {Object} mode specify further actions { initializeOnly: only initialize, ... }
    */
    exports.PageController.prototype.navaidSettingsChanged = function (mode) {
        // make sure we have a mode
        mode = Object.ifNotNullOrUndefined(mode, {});

        var ns = globals.navaidSettings;
        ns.set({
            displayNavaid: document.getElementById("inputNavaidsDisplay").checked,
            displayVOR: document.getElementById("inputNavaidsDisplayVOR").checked,
            displayNDB: document.getElementById("inputNavaidsDisplayNDB").checked,
            displayTACAN: document.getElementById("inputNavaidsDisplayTACAN").checked,
            displayILS: document.getElementById("inputNavaidsDisplayILS").checked,
            displayVORTAC: document.getElementById("inputNavaidsDisplayVORTAC").checked,
            displayName: document.getElementById("inputNavaidsDisplayName").checked,
            displayFrequency: document.getElementById("inputNavaidsDisplayFrequency").checked,
            displayType: document.getElementById("inputNavaidsDisplayType").checked,
            displayCallsign: document.getElementById("inputNavaidsDisplayCallsign").checked
        });

        // redisplay
        if (Object.isNullOrUndefined(mode["initializeOnly"]) || !mode["initializeOnly"]) this.backgroundRefresh();
    };

    /**
    * Log level has been changed.
    */
    exports.PageController.prototype.logLevelChanged = function() {
        var value = vd.util.UtilsWeb.getSelectedValue("inputSettingsLogLevel");
        // log level requires direct reference to its own static values
        switch (value) {
        case log4javascript.Level.TRACE.name:
            globals.log.setLevel(log4javascript.Level.TRACE);
            break;
        case log4javascript.Level.DEBUG.name:
            globals.log.setLevel(log4javascript.Level.DEBUG);
            break;
        case log4javascript.Level.INFO.name:
            globals.log.setLevel(log4javascript.Level.INFO);
            break;
        case log4javascript.Level.WARN.name:
            globals.log.setLevel(log4javascript.Level.WARN);
            break;
        case log4javascript.Level.ERROR.name:
            globals.log.setLevel(log4javascript.Level.ERROR);
            break;
        case log4javascript.Level.FATAL.name:
            globals.log.setLevel(log4javascript.Level.FATAL);
            break;
        default:
            return;
        }
        this.displayInfo("New log level is " + value + ".");
    };

    /**
    * The FSX settings have been changed.
    * @param {Boolean} refresh
    * @see vd.module:page.PageController#_initFsxWsSettings
    */
    exports.PageController.prototype.fsxWsSettingsChanged = function() {
        var fsxWsLocation = $("#inputFsxWsLocation").val();
        var fsxWsPort = $("#inputFsxWsPort").val();
        globals.fsxWs.initServerValues(fsxWsLocation, fsxWsPort, globals.urlFsxWsDefault);

        // back annotate GUI values
        this._initFsxWsSettings();
    };

    /**
    * The color settings have been changed.
    * @param {Boolean} refresh
    * @see vd.module:page.PageController#_initColorInputs
    */
    exports.PageController.prototype.colorSettingsChanged = function(refresh) {
        refresh = Object.ifNotNullOrUndefined(refresh, true);
        globals.styles.setFlightWaypointColor($("#inputFlightSettingsWaypointLinesColor").val());
        globals.styles.flightLabelBackground = vd.util.Utils.getValidColor($("#inputFlightSettingLabelsColor").val(), globals.styles.flightLabelBackground).toHex();
        globals.styles.flightLabelBackgroundIfFollowed = vd.util.Utils.getValidColor($("#inputFlightSettingLabelsColorIfFollowed").val(), globals.styles.flightLabelBackgroundIfFollowed).toHex();
        globals.styles.flightLabelBackgroundIfFollowedTransparent = vd.util.UtilsWeb.checkboxChecked("inputFlightSettingLabelsColorIfFollowedTransparent");
        globals.styles.flightLabelBackgroundIfFiltered = vd.util.Utils.getValidColor($("#inputFlightSettingLabelsColorIfFiltered").val(), globals.styles.flightLabelBackgroundIfFiltered).toHex();
        globals.styles.flightLabelBackgroundIfFilteredTransparent = vd.util.UtilsWeb.checkboxChecked("inputFlightSettingLabelsColorIfFilteredTransparent");
        globals.styles.flightLabelFontColor = vd.util.Utils.getValidColor($("#inputFlightSettingLabelsFontColor").val(), globals.styles.flightLabelFontColor).toHex();
        globals.styles.airportLabelBackground = vd.util.Utils.getValidColor($("#inputAirportSettingLabelsColor").val(), globals.styles.airportLabelBackground).toHex();
        globals.styles.airportLabelFontColor = vd.util.Utils.getValidColor($("#inputAirportSettingLabelsFontColor").val(), globals.styles.airportLabelFontColor).toHex();
        globals.styles.wpRouteLabelBackground = vd.util.Utils.getValidColor($("#inputRouteSettingLabelsColor").val(), globals.styles.wpRouteLabelBackground).toHex();
        globals.styles.wpRouteLabelFontColor = vd.util.Utils.getValidColor($("#inputRouteSettingLabelsFontColor").val(), globals.styles.wpRouteLabelFontColor).toHex();
        globals.styles.wpRouteLineColor = vd.util.Utils.getValidColor($("#inputRouteSettingRouteLineColor").val(), globals.styles.wpRouteLineColor).toHex();
        this._displayAltitudeColorBar();
        if (refresh) this.backgroundRefresh();
    };

    /**
    * Change the filter (e.g. toggle the filter, or set it).
    * @param {Object} filterParams 
    */
    exports.PageController.prototype.filterSettingsChanged = function(filterParams) {
        filterParams = Object.ifNotNullOrUndefined(filterParams, { });
        var tf = !Object.isNullOrUndefined(filterParams["toogleFilter"]) && filterParams["toogleFilter"];
        var f = tf ? vd.util.UtilsWeb.toggleCheckbox("inputApplyFilter") : vd.util.UtilsWeb.checkboxChecked("inputApplyFilter");
        if (f) {
            var it = "Filter is on.";
            if (globals.filter.isEmpty()) it += ". Warning, empty filter!";
            this.displayInfo(it);
        } else {
            this.displayInfo("Filter is off.");
        }
        globals.filtered = f;
        this.refresh();
    };

});