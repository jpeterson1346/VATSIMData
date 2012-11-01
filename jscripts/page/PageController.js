/**
* @module vd.page
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.page', function (exports) {

    // #region ------------ Constructor ------------
    /**
    * @classdesc Page controller. Anything directly controlling the UI.
    * @constructor
    * @see vd.module:page.Globals
    * @author KWB
    */
    exports.PageController = function () {
        /**
        * The collecting event for bounds changing.
        * @private
        * @type {CollectingEvent}
        */
        this._boundsChangedCollectedEvent = null;
        /**
        * Collective refresh event, avoid too many refreshs.
        * @private
        * @type {CollectingEvent}
        */
        this._backgroundRefreshCollectEvent = null;
        /**
        * Collective grid update refresh event, avoid too many refreshs.
        * @private
        * @type {CollectingEvent}
        */
        this._backgroundUpdateGridCollectEvent = null;
        /**
        * Time when the content bar was last deleted.
        * @private
        * @type {Number}
        */
        this._lastInfoBarContentDeleteTime = 0;
        /**
        * Grids in wide mode.
        * @private
        * @type {Boolean}
        */
        this._gridWideMode = null;
        /**
        * Currently shown route.
        * @private
        * @type {vd.entity.Route}
        */
        this._shownRoute = null;
        /**
        * Statistics about page refresh (do not confuse with browser reload).
        * @type {vd.util.RuntimeStatistics}
        * @private
        * @see vd.module:page.PageController#refresh
        */
        this._statisticsRefresh = new vd.util.RuntimeStatistics("Page refresh");
        /**
        * Statistics about page data grid updates.
        * @type {vd.util.RuntimeStatistics}
        * @private
        * @see vd.module:page.PageController#refresh
        */
        this._statisticsDataGridUpdates = new vd.util.RuntimeStatistics("Data grid updates");
        /**
        * Ground overlays, when read
        * @type {Array}
        * @see vd.module:entity.GroundOverlay
        * @private
        */
        this._groundOverlays = new Array();
        /**
        * Ground overlays, when read
        * @type {vd.module.GroundOverlay}
        * @private
        */
        this.groundOverlayDisplayed = null;
        /**
        * Markers.
        * @type {Array} Array of markers
        * @private
        */
        this._markers = new vd.gm.OverlayGroup("PageMarkes", null);
        /**
        * How many times tab has been changed
        * @type {Number}
        * @private
        */
        this._statsTabUsage = 0;
        /**
        * Mouse over flights grid?
        * @type {Boolean}
        * @private
        */
        this._gridFlightsMouseOver = false;
        /**
        * Mouse over flights grid?
        * @type {Boolean}
        * @private
        */
        this._gridAtcMouseOver = false;
    };
    // #endregion ------------ Constructor ------------

    // #region ------------ Static const values ------------
    /**
    * No particular reason for display.
    * @type {Number}
    * @const
    * @static
    */
    exports.PageController.DisplayForceRedisplay = 0;
    /**
    * New FsxWs data.
    * @type {Number}
    * @const
    * @static
    */
    exports.PageController.DisplayNewDataFsx = 1;
    /**
    * New VATSIM data.
    * @type {Number}
    * @const
    * @static
    */
    exports.PageController.DisplayNewDataVatsim = 2;
    /**
    * Map moved.
    * @type {Number}
    * @const
    * @static
    */
    exports.PageController.DisplayMapMoved = 3;
    /**
    * Usage mode.
    * @type {Number}
    * @const
    * @static
    */
    exports.PageController.UsageModeIllegal = -1;
    /**
    * Usage mode.
    * @type {Number}
    * @const
    * @static
    */
    exports.PageController.UsageModeFsxAndVatsim = 0;
    /**
    * Usage mode as FSX moving map.
    * @type {Number}
    * @const
    * @static
    */
    exports.PageController.UsageModeFsxMovingMapWithVatsim = 1;
    /**
    * Usage mode as FSX moving map.
    * @type {Number}
    * @const
    * @static
    */
    exports.PageController.UsageModeFsxMovingMapFsxOnly = 2;
    /**
    * VATSIM data only.
    * @type {Number}
    * @const
    * @static
    */
    exports.PageController.UsageModeVatsimOnly = 3;
    // #endregion ------------ Static const values ------------

    // #region ------------ public part init / close ------------
    /**
    * Init everything.
    */
    exports.PageController.prototype.initialize = function () {
        var browser = this.browserCheck();
        if (browser)
            this.displayInfo(); // clear
        else {
            var noBrowserInfo = "Browser does not support all features!";
            this.displayInfo(noBrowserInfo);
            alert(noBrowserInfo);
        }
        this.unitsChanged(false); // units such as km, ft ..

        // now the map, the following depends on the map
        if (globals.vatsimClients.count() > 0) globals.resetEntities(); // re-entry
        this._initMap();

        // tabs and client information, then side bars
        this.showHideInputAndTabs(); // init side bar
        this._initSideBarData(); // side bar data init
        this._initAltitudeProfile(); // all related to height profile

        // load flights when map completed
        var me = this;
        google.maps.event.addListenerOnce(globals.map, 'tilesloaded',
            function () {
                me.resetUpdateTimer(); // inital kick off reading
                if (globals.geolocationWorking) me._initGeoLocationPosition();
            }
        );

        // register resize event
        $(window).resize(function () { me.windowResizeEvent(); });

    }; // initialize

    /**
    * Close the application.
    */
    exports.PageController.prototype.close = function () {
        if (!Object.isNullOrUndefined(globals.logAppenderPopUp)) globals.logAppenderPopUp.close();
    };
    // #endregion ------------ public part init / close ------------

    // #region ------------ public part general ------------
    /**
    * Does the browser fullfill all requirements?
    * @return true means check is passed 
    */
    exports.PageController.prototype.browserCheck = function () {
        var bar = document.getElementById("inputFlightWaypointsLegend");
        if (Object.isNullOrUndefined(bar.getContext)) return false;
        return true;
    };

    /**
    * Bring logger to front and focus (aka pop up logger).
    */
    exports.PageController.prototype.showLogger = function () {
        if (Object.isNullOrUndefined(globals.logAppenderPopUp)) {
            if (Object.isNullOrUndefined(globals.logAppenderConsole))
                this.displayInfo("Logger is disabled");
            else
                this.displayInfo("Logger is disabled, check your browser's console");
        } else {
            globals.logAppenderPopUp.show();
            globals.logAppenderPopUp.focus();
        }
    };

    /**
    * Test FsxWs connection and update info.
    */
    exports.PageController.prototype.refreshFsxWsInfo = function () {
        if (Object.isNullOrUndefined(globals.fsxWs)) {
            alert("No refresh possible, FsxWs object not available!");
            return;
        }
        globals.fsxWs.readFromFsxWs(true, true); // test availability (this is async)
        var me = this;

        // update fields after a delay, hopefully the async check is completed by then
        setTimeout(function () {
            me._setFsxWsInfoFields();
        }, globals.fsxWsAvailabilityDelay);
    };

    /**
    * Show VATroute.
    */
    exports.PageController.prototype.showVatRoute = function () {
        var routeString = $("#inputVatRoute").val();
        var wps = vd.entity.helper.RouteParser.parseVatRoute(routeString);
        if (Array.isNullOrEmpty(wps)) {
            this.displayInfo("No waypoints for this route.");
        } else {
            if (!Object.isNullOrUndefined(this._shownRoute)) this._shownRoute.dispose();
            this._shownRoute = new vd.entity.Route({ waypoints: wps });
            this._shownRoute.display(true, true, true);
            var bounds = this._shownRoute.getBounds();
            if (!Object.isNullOrUndefined(bounds)) globals.map.fitBounds(bounds);
        }
    };

    /**
    * Hide Route.
    */
    exports.PageController.prototype.hideRoute = function () {
        if (!Object.isNullOrUndefined(this._shownRoute)) {
            this._shownRoute.dispose();
            this._shownRoute = null;
        }
    };

    /**
    * Show some VATroute demo data.
    */
    exports.PageController.prototype.loadVatRouteDemoData = function () {
        var routeString = vd.entity.helper.RouteParser.vatRouteDemoData();
        $("#inputVatRoute").val(routeString);
    };

    /**
    * Hide all clients.
    */
    exports.PageController.prototype.hideAllEntities = function () {
        if (Object.isNullOrUndefined(globals.allEntities)) return;
        globals.allEntities.display(false);
        this._clearOwnMapOverlays(); // overlays which are not based the FsxWs / VATSIM entities, e.g. routes
    };

    /**
    * Call func if key is CR.
    * @param {KeyboardEvent} event
    * @param {function}      func to be called
    */
    exports.PageController.prototype.onEnter = function (event, func) {
        if (Object.isNullOrUndefined(event) || event.keyCode != 13 || Object.isNullOrUndefined(func)) return;
        func();
    };

    /**
    * Go to a new location, "the" geolocation
    */
    exports.PageController.prototype.gotoGeolocation = function () {
        if (globals.geolocationWorking) {
            var l = new google.maps.LatLng(globals.geolocationLat, globals.geolocationLon);
            exports.newLocation(true, l);
        } else {
            alert("No geolocation available");
        }
    };

    /**
    * Find place and set new location if found.
    * @param {Boolean} center
    * @param {String}  [place]
    * @param {Number}  [zoomLevel]
    */
    exports.PageController.prototype.newPlace = function (center, place, zoomLevel) {
        var ePlace = document.getElementById("inputPlace");
        if (String.isNullOrEmpty(place)) place = ePlace.value;
        if (String.isNullOrEmpty(place)) return; // still nothing

        // async call
        var me = this;
        globals.geocoder.geocode({ 'address': place, 'bounds': globals.map.getBounds() },
            function (results, status) {
                if (status == google.maps.GeocoderStatus.OK && results && results[0]) {
                    var latLng = results[0].geometry.location;
                    var fullName = results[0]['formatted_address'];
                    ePlace.value = fullName;
                    if (!Object.isNullOrUndefined(latLng)) {
                        me.newLocation(center, latLng, zoomLevel);
                    }
                }
            });
    };

    /**
    * Latitude / Longitude to address / place.
    */
    exports.PageController.prototype.reverseLookup = function () {
        var elat = document.getElementById("inputLatitude");
        var elon = document.getElementById("inputLongitude");
        if (!vd.util.UtilsCalc.isValidlatLon(elat.value, elon.value)) return;
        var latLng = new google.maps.LatLng(elat.value, elon.value);
        // async call
        globals.geocoder.geocode({ 'latLng': latLng, 'bounds': globals.map.getBounds() },
            function (results, status) {
                if (status == google.maps.GeocoderStatus.OK && results && results[0]) {
                    var fullName = results[0]['formatted_address'];
                    document.getElementById("inputPlace").value = fullName;
                }
            });
    };

    /**
    * Display a marker for latitude / longitude.
    */
    exports.PageController.prototype.addLatLngMarker = function () {
        var elat = document.getElementById("inputLatitude");
        var elon = document.getElementById("inputLongitude");
        if (!vd.util.UtilsCalc.isValidlatLon(elat.value, elon.value)) return;
        var latLng = new google.maps.LatLng(elat.value, elon.value);
        var latLngFormatted = vd.util.UtilsMap.formatLatLngValues(latLng, globals.coordinatesDigitsDisplayed);
        var title = latLngFormatted["lat"] + "/" + latLngFormatted["lng"];
        var markerOptions = { position: latLng, map: globals.map, title: title };
        var marker = new google.maps.Marker(markerOptions);
        this._markers.add(marker);
        this._markers.display(true);
        globals.map.setCenter(latLng);
    };

    /**
    * Display a marker for latitude / longitude.
    */
    exports.PageController.prototype.removeLatLngMarkers = function () {
        this._markers.clear();
    };

    /**
    * New location.
    * @param {Boolean}            center
    * @param {google.maps.LatLng} [latLng]
    * @param {Number}             [zoomLevel]
    */
    exports.PageController.prototype.newLocation = function (center, latLng, zoomLevel) {
        var elat = document.getElementById("inputLatitude");
        var elon = document.getElementById("inputLongitude");
        if (Object.isNullOrUndefined(latLng)) {
            if (!vd.util.UtilsCalc.isValidlatLon(elat.value, elon.value)) return;
            latLng = new google.maps.LatLng(elat.value, elon.value);
        }
        if (center) globals.map.setCenter(latLng);
        if (Object.isNumber(zoomLevel)) globals.map.setZoom(zoomLevel);
        var fll = vd.util.UtilsMap.formatLatLngValues(latLng, globals.coordinatesDigitsDisplayed);
        elat.value = fll["lat"];
        elon.value = fll["lng"];
    };

    /**
    * Show / hide the input fields.
    * @see vd.module:page.PageController#altitudeProfileSettings
    */
    exports.PageController.prototype.showHideInputAndTabs = function () {
        var me = this;
        var selected = $("#headerBarTabSelection").val().toUpperCase();
        var sideBar = document.getElementById("sideBar");
        var sideBarLocation = document.getElementById("sideBarLocation");
        var sideBarSettings = document.getElementById("sideBarSettings");
        var sideBarData = document.getElementById("sideBarData");
        var sideBarAbout = document.getElementById("sideBarAbout");
        var sideBarEntities = document.getElementById("sideBarEntities");
        var sideBarCredits = document.getElementById("sideBarCredits");
        var sideBarRoute = document.getElementById("sideBarRoute");
        var sideBarNavaids = document.getElementById("sideBarNavaids");
        var sideBarOverlays = document.getElementById("sideBarOverlays");
        var mapCanvas = document.getElementById("mapCanvas");
        var altitudeProfile = document.getElementById("mapAltitudeProfile");

        // one time init, remember style sheet values
        // http://stackoverflow.com/questions/2226869/css-parser-abstracter-how-to-convert-stylesheet-into-object
        if (Object.isNullOrUndefined(globals.sideBarMinWidth)) {
            this._initAltitudeProfile();
            globals.sideBarMinWidth = $(sideBar).css('min-Width');
            globals.sideBarLocationDisplay = $(sideBarLocation).css('display');
            globals.sideBarSettingsDisplay = $(sideBarSettings).css('display');
            globals.sideBarEntitiesDisplay = $(sideBarEntities).css('display');
            globals.sideBarDataDisplay = $(sideBarData).css('display');
            globals.sideBarAboutDisplay = $(sideBarAbout).css('display');
            globals.sideBarCreditsDisplay = $(sideBarCredits).css('display');
            globals.sideBarRouteDisplay = $(sideBarRoute).css('display');
            globals.sideBarNavaidsDisplay = $(sideBarNavaids).css('display');
            globals.sideBarOverlaysDisplay = $(sideBarOverlays).css('display');
            if (Object.isNullOrUndefined(globals.sideBarMinWidth)) globals.log.error("Cannot retrieve CSS values, IE Compatibility View?");
        }

        if (selected.startsWith("H")) {
            // to invisibile
            sideBar.style.width = "0%";
            sideBar.style.minWidth = "0px";
            mapCanvas.style.width = "100%";
            mapCanvas.style.height = "97%";
            altitudeProfile.style.width = "100%";
        } else {
            // to visible by reseting to CSS values
            sideBar.style.width = null;
            sideBar.style.minWidth = null;
            mapCanvas.style.width = null;
            mapCanvas.style.height = null;
            altitudeProfile.style.width = null;
            this.altitudeProfileSettings(false); // set mapCanvas / mapAltitudeProfile height

            sideBarLocation.style.display = selected.startsWith("M") ? globals.sideBarLocationDisplay : "none";
            sideBarSettings.style.display = selected.startsWith("S") ? globals.sideBarSettingsDisplay : "none";
            sideBarData.style.display = selected.startsWith("D") ? globals.sideBarDataDisplay : "none";
            sideBarAbout.style.display = selected.startsWith("A") ? globals.sideBarAboutDisplay : "none";
            sideBarCredits.style.display = selected.startsWith("C") ? globals.sideBarCreditsDisplay : "none";
            sideBarEntities.style.display = selected.startsWith("E") ? globals.sideBarEntitiesDisplay : "none";
            sideBarRoute.style.display = selected.startsWith("R") ? globals.sideBarRouteDisplay : "none";
            sideBarNavaids.style.display = selected.startsWith("N") ? globals.sideBarNavaidsDisplay : "none";
            sideBarOverlays.style.display = selected.startsWith("O") ? globals.sideBarOverlaysDisplay : "none";

            // further updates
            if (selected.startsWith("D"))
                setTimeout(
                    function () {
                        me.updateGrids(true);
                    }, 250); // delayed data update
            if (selected.startsWith("S")) this._displayAltitudeColorBar(); // force redraw
        }

        // resizing
        this.windowResizeEvent(); // force resize

        // Google Analytics
        globals.googleAnalyticsEvent("tabChanged", selected, this._statsTabUsage++);
    };

    /**
    * Select a tab, and optionally apply parameters (e.g. how the data grids are collapsed).
    * @param {String} tab
    * @param {Object} [optParams]
    */
    exports.PageController.prototype.selectTab = function (tab, optParams) {
        if (!String.isNullOrEmpty(tab)) {
            var t = tab.substr(0, 1).toUpperCase();
            var value = null;
            switch (t) {
                case "M":
                    value = "Map";
                    break;
                case "S":
                    value = "Settings";
                    break;
                case "D":
                    value = "Data";
                    break;
                case "E":
                    value = "Entities";
                    break;
                case "C":
                    value = "Credits";
                    break;
                case "R":
                    value = "Route";
                    break;
                case "O":
                    value = "Overlays";
                    break;
            }
            var el = document.getElementById("headerBarTabSelection");
            if (!String.isNullOrEmpty(value)) {
                $(el).val(value);
                this.showHideInputAndTabs();
            }
        }
        if (!Object.isNullOrUndefined(optParams)) {
            this.collapseGrids(optParams);
        }
    };

    /**
    * Display a status information if not empty and write it to the log.
    * @param {String}  content
    * @param {Boolean} [timerCalled]
    */
    exports.PageController.prototype.displayInfoIfNotEmpty = function (content, timerCalled) {
        if (String.isNullOrEmpty(content)) return;
        timerCalled = Object.ifNotNullOrUndefined(timerCalled, false);
        this.displayInfo(content, timerCalled);
    };

    /**
    * Display a status information and write it to the log.
    * @param {String}  [content]
    * @param {Boolean} [timerCalled]
    */
    exports.PageController.prototype.displayInfo = function (content, timerCalled) {
        if (!Object.isNullOrUndefined(content)) content = content.trim();
        var hasContent = !String.isNullOrEmpty(content);
        timerCalled = Object.ifNotNullOrUndefined(timerCalled, false);
        var now = new Date().getTime();
        var me = this;
        var ti = document.getElementById("headerBarTaskInfo");
        if (Object.isNullOrUndefined(globals.headerTaskInfoDisplay)) globals.headerTaskInfoDisplay = ti.style.display;
        if (hasContent) {
            // write to log
            globals.log.info(content);

            // write to status header
            $(ti).empty();
            ti.style.display = globals.headerTaskInfoDisplay;
            ti.appendChild(document.createTextNode(" " + content));
            this._lastInfoBarContentDeleteTime = now + globals.timerCleanUpInfoBar;
            setTimeout(
                function () {
                    me.displayInfo(null, true); // clean me up later
                }, globals.timerCleanUpInfoBar);
        } else {
            if (!timerCalled || now > this._lastInfoBarContentDeleteTime) {
                $(ti).empty();
                ti.style.display = "none";
            }
        }
    };

    /**
    * Map follows an id (FSX/Vatsim).
    * @param {String|Number} [id] explicit id or value of field taken
    * @param {Boolean} [displayInfo] display an info message
    * @param {Boolean} [refresh] update the entities, e.g. by highlighting them
    */
    exports.PageController.prototype.followId = function (id, displayInfo, refresh) {
        var idByParameter = !Object.isNullOrUndefined(id);
        id = Object.ifNotNullOrUndefined(id, $("#inputFollowId").val());
        if (id == globals.mapFollowId) return; // already followed
        var entity = null;
        if (!String.isNullOrEmpty(id) && !Object.isNullOrUndefined(globals.allEntities)) {
            if (idByParameter) {
                entity = globals.allEntities.findByObjectId(id); // search by id first, most likely
                if (Object.isNullOrUndefined(entity)) entity = globals.allEntities.findById(id, false); // now by FSX id and VATSIM id
            } else {
                // by entry in fields
                entity = globals.allEntities.findById(id, false); // by FSX id and VATSIM id
                if (Object.isNullOrUndefined(entity)) entity = globals.allEntities.findByObjectId(id); // search by object id first
            }
        }

        // already followed       
        if (!Object.isNullOrUndefined(entity)) {
            if (entity.objectId == globals.mapFollowId) return; // already followed
        }
        displayInfo = Object.ifNotNullOrUndefined(displayInfo, true);
        refresh = Object.ifNotNullOrUndefined(refresh, true);

        // element for info text
        var td = document.getElementById("inputFollowedVatsimClient");
        $(td).empty();

        if (Object.isNullOrUndefined(entity)) {
            $("#inputFollowId").val("");
            globals.mapFollowId = null;
            if (displayInfo) this.displayInfo("Follow mode 'off'.");
            td.appendChild(document.createTextNode("Follow mode 'off'."));
        } else {
            var infoText = entity.callsign.appendIfNotEmpty(entity.name, " ");
            globals.mapFollowId = entity.objectId;
            td.appendChild(document.createTextNode(infoText));
            if (displayInfo) this.displayInfo("Will follow '" + infoText + "'.");
            globals.map.setCenter(entity.latLng());

            // write a meaningful id back to the field
            if (entity.isVatsimBased())
                $("#inputFollowId").val(entity.vatsimId);
            else if (entity.isFsxBased())
                $("#inputFollowId").val(entity.fsxId);
            else
                $("#inputFollowId").val(entity.objectId);
        }
        if (refresh) this.backgroundRefresh();
    };
    // #endregion ------------ public part general ------------

    // #region ------------ public part events ------------
    /**
    * Map has been dragged.
    */
    exports.PageController.prototype.boundsChangedEvent = function () {
        var me = this;
        if (Object.isNullOrUndefined(this._boundsChangedCollectedEvent))
            this._boundsChangedCollectedEvent = new vd.util.CollectingEvent(
                function () {
                    me._asyncBoundsUpdate();
                }, globals.collectiveBoundsChangedInterval, true, "Bounds changed event");
        else
            this._boundsChangedCollectedEvent.fire();
    };

    /**
    * Window resize.
    * @see <a href="http://stackoverflow.com/questions/743214/how-do-i-resize-a-google-map-with-javascript-after-it-has-loaded">Google Map resize</a>
    */
    exports.PageController.prototype.windowResizeEvent = function () {
        var me = this;
        if (Object.isNullOrUndefined(this._windowsResizeCollectedEvent))
            this._windowsResizeCollectedEvent = new vd.util.CollectingEvent(
                function () {
                    me._initGrids(true);
                    me._updateAltitudeProfile();
                    google.maps.event.trigger(globals.map, "resize");
                }, globals.collectiveBoundsWindowsRefreshDelay, true, "Windows resize");
        else
            this._windowsResizeCollectedEvent.fire();
    };

    /**
    * Redisplay the clients.
    * @param {Boolean} withInfo
    */
    exports.PageController.prototype.refresh = function (withInfo) {
        var statsEntry = new vd.util.RuntimeEntry("Refresh (PageController)");
        withInfo = Object.ifNotNullOrUndefined(withInfo, false);
        this.displayEntities(withInfo, "Refresh.");

        // statistics / logging
        this._statisticsRefresh.add(statsEntry, true);
        globals.log.trace(statsEntry.toString());
    };

    /**
    * Redisplay the entities (after some delay in the background).
    * @param {Boolean} forceRedraw
    */
    exports.PageController.prototype.backgroundRefresh = function () {
        var me = this;
        if (Object.isNullOrUndefined(this._backgroundRefreshCollectEvent))
            this._backgroundRefreshCollectEvent = new vd.util.CollectingEvent(
                function () {
                    me.refresh();
                }, globals.collectiveBackgroundRefreshEvent, true, "Refresh (redisplay) the clients");
        else
            this._backgroundRefreshCollectEvent.fire();
    };

    /**
    * Load ground overlay charts list.
    */
    exports.PageController.prototype.loadOverlayChartList = function () {
        var icao = vd.util.UtilsWeb.getSelectedValue("inputGroundOverlaysAirport");
        if (String.isNullOrEmpty(icao)) return;
        var selectedOverlays = vd.entity.base.BaseEntityModel.findByCallsign(this._groundOverlays, icao); // already in memory
        if (Array.isNullOrEmpty(selectedOverlays)) {
            selectedOverlays = globals.groundOverlays.readGroundOverlays(icao);
            this._groundOverlays.append(selectedOverlays);
        }
        var names = vd.entity.GroundOverlay.names(selectedOverlays);
        document.getElementById("inputGroundOverlaysAirportCharts").options.length = 0;
        vd.util.UtilsWeb.selectAddOptions("inputGroundOverlaysAirportCharts", names);
    };

    /**
    * Display overlay chart.
    * @param {Boolean} [center]
    */
    exports.PageController.prototype.displayOverlayChart = function (center) {
        var name = vd.util.UtilsWeb.getSelectedValue("inputGroundOverlaysAirportCharts");
        center = Object.ifNotNullOrUndefined(center, true);
        var selectedOverlays = vd.entity.base.BaseEntityModel.findByName(this._groundOverlays, name); // already in memory
        if (Array.isNullOrEmpty(selectedOverlays)) {
            this.displayInfo("No ground overlay charts can be displayed");
            return;
        }
        this.removeOverlayChart();
        this.groundOverlayDisplayed = selectedOverlays[0];
        this.groundOverlayDisplayed.display(true, center, true);
        this._groundOverlayUrls();
    };

    /**
    * Remove (hide) overlay chart.
    */
    exports.PageController.prototype.removeOverlayChart = function () {
        if (Object.isNullOrUndefined(this.groundOverlayDisplayed)) return;
        this.groundOverlayDisplayed.display(false);
        this.groundOverlayDisplayed = null;
        this._groundOverlayUrls();
    };

    /**
    * Settings for overlay chart has been changed.
    */
    exports.PageController.prototype.groundOverlayChanged = function () {
        globals.styles.groundOverlayOpacity = String.toNumber(vd.util.UtilsWeb.getSelectedValue("inputGroundOverlayOpacity"), globals.styles.groundOverlayOpacity);
        if (vd.util.UtilsWeb.checkboxChecked("inputGroundOverlayBackgroundTransparent"))
            globals.styles.groundOverlayBackground = "transparent";
        else
            globals.styles.groundOverlayBackground = vd.util.Utils.getValidColor($("#inputGroundOverlayBackgroundColor").val(), globals.styles.groundOverlayBackground).toHex();

        // redisplay
        if (Object.isNullOrUndefined(this.groundOverlayDisplayed)) return;
        this.groundOverlayDisplayed.rotate = String.toNumber($("#inputGroundOverlayRotate").val(), 0);
        this.displayOverlayChart(false);
    };

    /**
    * Zoom to ground overlay.
    * Nothing happens if there is no ground overlay.
    */
    exports.PageController.prototype.zoomToGroundOverlay = function () {
        if (Object.isNullOrUndefined(this.groundOverlayDisplayed)) return;
        this.groundOverlayDisplayed.zoomMapToVicinity();
    };

    /**
    * Usage mode has changed. usage mode specifes how the data
    * and display is handled en detail.
    * @see vd.module:page.PageController.UsageModeFsxMovingMapWithVatsim
    */
    exports.PageController.prototype.usageModeChanged = function () {
        var usageMode = String.toNumber($("#inputUsageMode").val(), vd.page.PageController.UsageModeIllegal);
        var vatsimLoadOn = String.toNumber($("#inputTimerUpdateVatsim").val(), -1) > 0;
        var fsxLoadOn = String.toNumber($("#inputTimerUpdateFsx").val(), -1) > 0;
        if (usageMode == vd.page.PageController.UsageModeFsxMovingMapWithVatsim ||
            usageMode == vd.page.PageController.UsageModeFsxMovingMapFsxOnly ||
            usageMode == vd.page.PageController.UsageModeFsxAndVatsim ||
            usageMode == vd.page.PageController.UsageModeVatsimOnly) {
            if ((usageMode == vd.page.PageController.UsageModeFsxMovingMapWithVatsim
                || usageMode == vd.page.PageController.UsageModeFsxMovingMapOnly) && !this.isFsxWsEnabled()) {
                this.displayInfo("Make sure FsxWs is running and connected.");
            }

            // set logical defaults for load time
            var timerChange = false;
            if (usageMode == vd.page.PageController.UsageModeFsxMovingMapFsxOnly) {
                if ($("#inputTimerUpdateVatsim").val() >= 0) {
                    $("#inputTimerUpdateVatsim").val(-1);
                    timerChange = true;
                }
            } else if (!vatsimLoadOn) {
                if ($("#inputTimerUpdateVatsim").val() <= 0) {
                    $("#inputTimerUpdateVatsim").val(30);
                    timerChange = true;
                }
            }
            if (usageMode == vd.page.PageController.UsageModeVatsimOnly) {
                if ($("#inputTimerUpdateFsx").val() >= 0) {
                    $("#inputTimerUpdateFsx").val(-1);
                    timerChange = true;
                }
            } else if (!fsxLoadOn) {
                if ($("#inputTimerUpdateFsx").val() <= 0) {
                    $("#inputTimerUpdateFsx").val(5);
                    timerChange = true;
                }
            }
            // remember mode
            globals.usageMode = usageMode;
            if (timerChange) this.resetUpdateTimer(false);
        } else {
            alert("Illegal usage mode, check origin");
        }
    };
    // #endregion ------------ public part events ------------

    // #region ------------ public part grids ------------
    /**
    * Update the grid tables / grid data.
    * Remark: Time consuming method, use wisely.
    * @param {boolean} forceUpdate update even when grid is invisible
    */
    exports.PageController.prototype.updateGrids = function (forceUpdate) {
        var gridsVisible = this._gridsVisible();
        if (!(forceUpdate || gridsVisible)) return;
        if (Object.isNullOrUndefined(globals.allEntities) || globals.allEntities.isEmpty()) return;

        // methods: http://www.trirand.com/jqgridwiki/doku.php?id=wiki:methods
        // pager: http://www.trirand.com/jqgridwiki/doku.php?id=wiki:pager
        //    var pagerPos = flightsGrid.getGridParam('page');
        //    flightsGrid.setGridParam({ "page": pagerPos });

        var statsEntry = new vd.util.RuntimeEntry("Grid update (Page Controller)");
        var fullUpdate = false;
        var info = "";
        var flightsGrid = null;
        if (forceUpdate || !this._gridFlightsMouseOver) {
            fullUpdate = true;
            flightsGrid = $("#flightData");
            flightsGrid.clearGridData();
            var flights = globals.allEntities.flights();
            for (var f = 0, lenF = flights.length; f < lenF; f++) {
                var flight = flights[f];
                flightsGrid.addRowData(flight.objectId, flight);
            }
        } else if (this._gridFlightsMouseOver) {
            info = "Grid not updated, user on flights grid.";
        }

        var atcGrid = null;
        if (forceUpdate || !this._gridAtcMouseOver) {
            atcGrid = $("#atcData");
            atcGrid.clearGridData();
            var atcs = globals.vatsimClients.atcs; // I need to get the helper entities as well
            for (var a = 0, lenA = atcs.length; a < lenA; a++) {
                var atc = atcs[a];
                atcGrid.addRowData(atc.objectId, atc);
            }
        } else {
            fullUpdate = false;
            if (this._gridAtcMouseOver) info += " Grid not update, user on ATC grid.";
        }

        // filter grid
        this.updateFilterGrid(false);

        // sort
        this.sortGrids("_isInBounds", flightsGrid, atcGrid);

        // statistics / logging / info
        if (fullUpdate) this._statisticsDataGridUpdates.add(statsEntry, true);
        if (gridsVisible) this.displayInfo(info);
        globals.log.trace(statsEntry.toString());
    };

    /**
    * Sort the grids.
    * @param {String} [sortProperty]
    * @param {jQuery|String|HtmlDomElement} [flightsGrid]
    * @param {jQuery|String|HtmlDomElement} [atcGrid]
    */
    exports.PageController.prototype.sortGrids = function (sortProperty, flightsGrid, atcGrid) {
        var sc = String.isNullOrEmpty(sortProperty) ? "_isInBounds" : sortProperty;
        if (!Object.isNullOrUndefined(flightsGrid)) flightsGrid.sortGrid(sc, false, "desc");
        if (!Object.isNullOrUndefined(atcGrid)) atcGrid.sortGrid(sc, false, "desc");
    };

    /**
    * Update the grid tables / grid data in background.
    * Remark: Triggers a time consuming method.
    * @param {boolean} forceUpdate
    */
    exports.PageController.prototype.updateGridsBackground = function (forceUpdate) {
        var me = this;
        if (Object.isNullOrUndefined(this._backgroundUpdateGridCollectEvent))
            this._backgroundUpdateGridCollectEvent = new vd.util.CollectingEvent(
                function () {
                    me.updateGrids(forceUpdate);
                }, globals.collectiveBackgroundGridsDelay, true, "Update grids");
        else
            this._backgroundUpdateGridCollectEvent.fire();
    };

    /**
    * Update the filter grid.
    * @param {Boolean} [refresh] refresh the entities, e.g. by highlighting them.
    */
    exports.PageController.prototype.updateFilterGrid = function (refresh) {
        refresh = Object.ifNotNullOrUndefined(refresh, false);
        var filterGrid = jQuery("#filterData");
        filterGrid.clearGridData();
        for (var f = 0, lenF = globals.filter.entities.length; f < lenF; f++) {
            var entity = globals.filter.entities[f];
            filterGrid.addRowData(entity.objectId, entity);
        }
        if (refresh) this.backgroundRefresh();
    };

    /**
    * Update the data grid.
    * @param {Object} gridParams
    */
    exports.PageController.prototype.collapseGrids = function (gridParams) {
        if (Object.isNullOrUndefined(gridParams)) return;
        var ft = document.getElementById("flightData");
        var at = document.getElementById("atcData");
        var dt = document.getElementById("detailsData");
        var filter = document.getElementById("filterData");
        if (!Object.isNullOrUndefined(gridParams.flightGridHidden)) $(ft).jqGrid().setGridState(this._gridHidden(gridParams.flightGridHidden));
        if (!Object.isNullOrUndefined(gridParams.atcGridHidden)) $(at).jqGrid().setGridState(this._gridHidden(gridParams.atcGridHidden));
        if (!Object.isNullOrUndefined(gridParams.detailsGridHidden)) $(dt).jqGrid().setGridState(this._gridHidden(gridParams.detailsGridHidden));
        if (!Object.isNullOrUndefined(gridParams.filterGridHidden)) $(filter).jqGrid().setGridState(this._gridHidden(gridParams.filterGridHidden));
    };

    /**
    * Records whether the mouse is over the grids or not. 
    * @param {Boolean} mouseOverFlightsGrid
    * @param {Boolean} mouseOverAtcGrid
    */
    exports.PageController.prototype.gridMouseState = function (mouseOverFlightsGrid, mouseOverAtcGrid) {
        if (!Object.isNullOrUndefined(mouseOverAtcGrid)) this._gridAtcMouseOver = mouseOverAtcGrid;
        if (!Object.isNullOrUndefined(mouseOverFlightsGrid)) this._gridFlightsMouseOver = mouseOverFlightsGrid;
    };
    // #endregion ------------ public part grids ------------

    // #region ------------ public part height profile ------------
    /** 
    * Settings for altitude profile (based on GUI checkboxes).
    * @param {Boolean} [resize] further calling the resize event to adjust width / height 
    * @see vd.module:page.PageController#_updateAltitudeProfile
    */
    exports.PageController.prototype.altitudeProfileSettings = function (resize) {
        var profile = document.getElementById("mapAltitudeProfile");
        resize = Object.ifNotNullOrUndefined(resize, true);

        //
        // set values based on checkboxes
        //
        var enabled = vd.util.UtilsWeb.checkboxChecked("inputElevationService");
        globals.altitudeProfile.altitudeProfileSettings.elevationProfile = vd.util.UtilsWeb.checkboxChecked("inputAltitudeProfileElevationLine");
        globals.elevationServiceEnabled = enabled;
        document.getElementById("inputAltitudeProfileShow").disabled = !enabled;
        document.getElementById("inputAltitudeProfileElevationLine").disabled = !enabled;

        //
        // visibility of the altitude profile 
        //
        if (vd.util.UtilsWeb.checkboxChecked("inputAltitudeProfileShow")) {
            profile.style.height = null; // reset the value
        } else {
            profile.style.height = "0px"; // override CSS value
        }
        if (resize) this.windowResizeEvent();
    };

    /**
    * Update the altitude profile.
    * @see vd.module:page.PageController#altitudeProfileSettings
    * @private
    */
    exports.PageController.prototype._updateAltitudeProfile = function () {
        if (Object.isNullOrUndefined(globals.altitudeProfile)) return; // during init
        globals.altitudeProfile.displayProjection();
    };
    // #endregion ------------ public part height profile ------------

    // #region ------------ private part init / close ------------
    /**
    * Init the map.
    * @private
    */
    exports.PageController.prototype._initMap = function () {
        var latLng = new google.maps.LatLng(50.0, 8.0);
        var me = this;
        var mapOptions = {
            streetViewControl: false,
            zoom: 9,
            mapTypeControlOptions: {
                mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE, google.maps.MapTypeId.HYBRID, google.maps.MapTypeId.TERRAIN],
                style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
            },
            overviewMapControl: true,
            overviewMapControlOptions: {
                opened: true
            },
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        globals.assignMap(new google.maps.Map(document.getElementById("mapCanvas"), mapOptions));
        google.maps.event.addListener(globals.map, 'bounds_changed',
            function () { me.boundsChangedEvent(); }
        ); // zoom_changed, dragend
        this._displayLocationAndBounds();
        this.newLocation(true, latLng);
        this._markers.map = globals.map;

        // check (by call back) whether we can expect geo location to be working
        // for performance reason I do not yet set the new position -> updates all flights etc.
        if (navigator.geolocation) {
            globals.geolocationWorking = false; // the feature is supported by the DOM, but is it working?
            navigator.geolocation.getCurrentPosition(
                function (position) {
                    globals.geolocationWorking = true;
                    globals.geolocationLat = position.coords.latitude;
                    globals.geolocationLon = position.coords.longitude;
                });
        }
    };

    /**
    * Init the geolocation position.
    * @private
    */
    exports.PageController.prototype._initGeoLocationPosition = function () {
        // get current position if available
        if (navigator.geolocation) {
            globals.geolocationWorking = false; // the feature is supported by the DOM, but is it working?
            var me = this;
            navigator.geolocation.getCurrentPosition(
                function (position) {
                    globals.geolocationWorking = true;
                    var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    me._displayLocationAndBounds();
                    me.newLocation(true, latLng);
                });
        }
    };

    /** 
    * Init the color input fields.
    * @private
    * @see vd.module:page.PageController#colorSettingsChanged
    */
    exports.PageController.prototype._initColorInputs = function () {
        $("#inputFlightSettingsWaypointLinesColor").val(vd.util.Utils.fixHexColorValue(globals.styles.wpFlightWaypointBaseColor.toHex(), true));
        $("#inputFlightSettingLabelsColor").val(vd.util.Utils.fixHexColorValue(vd.util.Utils.getValidColor(globals.styles.flightLabelBackground, "CCCCCC").toHex(), true));
        $("#inputFlightSettingLabelsColorIfFollowed").val(vd.util.Utils.fixHexColorValue(vd.util.Utils.getValidColor(globals.styles.flightLabelBackgroundIfFollowed, "CCCCCC").toHex(), true));
        vd.util.UtilsWeb.checkboxChecked("inputFlightSettingLabelsColorIfFollowedTransparent", globals.styles.flightLabelBackgroundIfFollowedTransparent);
        $("#inputFlightSettingLabelsColorIfFiltered").val(vd.util.Utils.fixHexColorValue(vd.util.Utils.getValidColor(globals.styles.flightLabelBackgroundIfFiltered, "CCCCCC").toHex(), true));
        vd.util.UtilsWeb.checkboxChecked("inputFlightSettingLabelsColorIfFilteredTransparent", globals.styles.flightLabelBackgroundIfFilteredTransparent);
        $("#inputAirportSettingLabelsColor").val(vd.util.Utils.fixHexColorValue(vd.util.Utils.getValidColor(globals.styles.airportLabelBackground, "CCCCCC").toHex(), true));
        $("#inputFlightSettingLabelsFontColor").val(vd.util.Utils.fixHexColorValue(vd.util.Utils.getValidColor(globals.styles.flightLabelFontColor, "CCCCCC").toHex(), true));
        $("#inputAirportSettingLabelsFontColor").val(vd.util.Utils.fixHexColorValue(vd.util.Utils.getValidColor(globals.styles.airportLabelFontColor, "CCCCCC").toHex(), true));
        $("#inputRouteSettingLabelsColor").val(vd.util.Utils.fixHexColorValue(vd.util.Utils.getValidColor(globals.styles.wpRouteLabelBackground, "CCCCCC").toHex(), true));
        $("#inputRouteSettingLabelsFontColor").val(vd.util.Utils.fixHexColorValue(vd.util.Utils.getValidColor(globals.styles.wpRouteLabelFontColor, "CCCCCC").toHex(), true));
        $("#inputRouteSettingRouteLineColor").val(vd.util.Utils.fixHexColorValue(vd.util.Utils.getValidColor(globals.styles.wpRouteLineColor, "CCCCCC").toHex(), true));
        $("#inputGroundOverlayBackgroundColor").val(vd.util.Utils.fixHexColorValue(vd.util.Utils.getValidColor(globals.styles.groundOverlayBackground, "CCCCCC").toHex(), true));
    };

    /** 
    * Init the FsxWs input fields.
    * @private
    * @see vd.module:page.PageController#fsxWsSettingsChanged
    */
    exports.PageController.prototype._initFsxWsSettings = function () {
        if (Object.isNumber(globals.fsxWs.serverPort) && globals.fsxWs.serverPort >= 79)
            $("#inputFsxWsPort").val(globals.fsxWs.serverPort);
        else
            $("#inputFsxWsPort").val("");

        if (!String.isNullOrEmpty(globals.fsxWs.serverLocation))
            $("#inputFsxWsLocation").val(globals.fsxWs.serverLocation);
        else
            $("#inputFsxWsLocation").val("");

        this._setFsxWsInfoFields();
    };

    /**
    * Init the side bar.
    * @private
    */
    exports.PageController.prototype._initSideBarData = function () {
        // order here is crucial!
        vd.util.UtilsWeb.selectValue("inputWaypointSettingsFlightMaxNumber", globals.waypointSettings.flightWaypointsNumberMaximum);

        // more detailed setups
        this.vatsimClientSettingsChanged({ initializeOnly: true }); // init the settings only
        this.navaidSettingsChanged({ initializeOnly: true });
        this._initGrids();
        this._initColorInputs();
        this._initFsxWsSettings();
        this._initLogLevels();
        this._initAbout();
        this._initGroundOverlays();
        this._displayAltitudeColorBar();
        this.resetUpdateTimer();
    };

    /**
    * Init the grid table.
    * @param {boolean} onlyResize if set just resize, do not completely init
    * @private
    * @see vd.module:page.PageController#updateGrids
    */
    exports.PageController.prototype._initGrids = function (onlyResize) {
        onlyResize = Object.ifNotNullOrUndefined(onlyResize, false);
        var elementSideBar = document.getElementById("sideBar");
        if ($(elementSideBar).width() < 10) return; // sidebar is invisible / hidden. Stop here!

        // Adjust columns on a wide screen?
        var wideScreen = this._isSideBarWide();
        var changedColumns = false;
        if (globals.gridJqGridUnloadPossible) {
            // force a reconstruction of the tables when mode has been changed
            if (!Object.isNullOrUndefined(this._gridWideMode) && this._gridWideMode != wideScreen) {
                // need to clean up old grids (re-entry, force update due to new columns ...)?        
                // Required for re-entry!
                // This must be first before retrieving the elements
                $("#flightData").GridUnload("#flightData");
                $("#atcData").GridUnload("#atcData");
                $("#detailsData").GridUnload("#detailsData");
                $("#filterData").GridUnload("#flightData");
                changedColumns = true;
            }
        }
        this._gridWideMode = wideScreen;

        // now init elements (after Unload!)
        var elementFlightData = document.getElementById("flightData");
        var elementAtcData = document.getElementById("atcData");
        var elementDetailsData = document.getElementById("detailsData");
        var elementFilter = document.getElementById("filterData");
        var me = this;

        // widths ATC / Flights
        var factor = 0.97;
        var widthGrids = ($(elementSideBar).width() * factor).toFixed(0) * 1;
        var widthCallsign = this._gridWideMode ? (0.20 * widthGrids).toFixed(0) : (0.325 * widthGrids).toFixed(0);
        var widthNameFlight = this._gridWideMode ? (0.40 * widthGrids).toFixed(0) : (0.55 * widthGrids).toFixed(0);
        var widthTransponder = this._gridWideMode ? (0.1 * widthGrids).toFixed(0) : 0;
        var widthId = this._gridWideMode ? (0.15 * widthGrids).toFixed(0) : 0;
        var withGrounded = this._gridWideMode ? true : false;
        var numberCheckboxes = this._gridWideMode ? 3 : 2;
        var widthRest = widthGrids - widthCallsign - widthNameFlight - widthTransponder - widthId;
        var widthCheckboxes = Math.round(widthRest / numberCheckboxes); // inBounds / displayed / grounded

        // ATC
        var widthNameAtc = widthGrids - (widthCheckboxes * numberCheckboxes) - widthId - widthCallsign;

        // Filter
        var widthEntity = 0.2 * widthGrids;
        var widthNameFilter = widthGrids - (widthCheckboxes * numberCheckboxes) - widthId - widthCallsign - widthEntity;

        // width details grid
        var widthProperty = widthGrids * 0.4;
        var widthValue = widthGrids - widthProperty;

        // column model
        var colModelFlights = [
            { name: 'objectId', index: 'objectId', width: 60, hidden: true, search: false },
            { name: 'callsign', index: 'callsign', width: widthCallsign, search: true },
            { name: 'pilot', index: 'pilot', width: widthNameFlight, search: true },
        // does for some reasons not work with id
            {name: 'vatsimId', index: 'vatsimId', width: widthId, search: true, hidden: (widthId < 5) },
            { name: 'transponder', index: 'transponder', width: widthTransponder, hidden: (widthTransponder < 5), search: true },
            { name: 'isGrounded', index: 'isGrounded', align: 'center', hidden: !withGrounded, width: widthCheckboxes, formatter: this._booleanToCheckmark, search: true },
            { name: '_isInBounds', index: '_isInBounds', align: 'center', width: widthCheckboxes, formatter: this._booleanToCheckmark, search: true },
            { name: 'displayed', index: 'displayed', align: 'center', width: widthCheckboxes, formatter: this._booleanToCheckmark, search: true }
        ];

        var colModelAtcs = [
            { name: 'objectId', index: 'objectId', width: 60, hidden: true, search: false },
            { name: 'callsign', index: 'callsign', width: widthCallsign, search: true },
            { name: 'controller', index: 'controller', width: widthNameAtc, search: true },
        // does for some reasons not work with id
            {name: 'vatsimId', index: 'vatsimId', width: widthId, search: true, hidden: (widthId < 5) },
            { name: '_isInBounds', index: '_isInBounds', align: 'center', width: widthCheckboxes, formatter: this._booleanToCheckmark, search: true },
            { name: 'displayed', index: 'displayed', align: 'center', width: widthCheckboxes, formatter: this._booleanToCheckmark, search: true }
        ];

        var colModelFilter = [
            { name: 'objectId', index: 'objectId', width: 60, hidden: true, search: false },
            { name: 'callsign', index: 'callsign', width: widthCallsign, search: true },
            { name: 'name', index: 'name', width: widthNameFilter, search: true },
        // does for some reasons not work with id
            {name: 'vatsimId', index: 'vatsimId', width: widthId, search: true, hidden: (widthId < 5) },
            { name: 'entity', index: 'entity', search: false, width: widthEntity }
        ];

        var colModelDetails = [
            { name: 'property', index: 'property', width: widthProperty },
            { name: 'value', index: 'value', width: widthValue }
        ];

        if (!onlyResize || changedColumns) {
            // filter bar, navigator
            // http://www.trirand.com/jqgridwiki/doku.php?id=wiki:toolbar_searching
            var gridFilterOpts = { autosearch: true, defaultSearch: "cn" };
            var navOptions = { add: false, del: false, edit: false, refresh: false, search: true };
            var navCenterOnMap = {
                caption: "",
                buttonicon: "ui-icon-home",
                position: "last",
                title: "Center on map",
                cursor: "pointer",
                onClickButton: null
            };
            var navFollowOnMap = {
                caption: "",
                buttonicon: "ui-icon-locked",
                position: "last",
                title: "Follow on map",
                cursor: "pointer",
                onClickButton: function () {
                    var objectId = $(elementFlightData).jqGrid('getGridParam', 'selrow');
                    if (!String.isNullOrEmpty(objectId)) me.followId(objectId);
                }
            };
            var navAddToFilter = {
                caption: "",
                buttonicon: "ui-icon-plus",
                position: "last",
                title: "Add to filter",
                cursor: "pointer",
                onClickButton: function () {
                    var objectId = $(elementFlightData).jqGrid('getGridParam', 'selrow');
                    if (!String.isNullOrEmpty(objectId)) globals.filter.addByObjectId(objectId);
                    me.updateFilterGrid(true);
                }
            };
            var navRemoveFromFilter = {
                caption: "",
                buttonicon: "ui-icon-minus",
                position: "last",
                title: "Remove from filter",
                cursor: "pointer",
                onClickButton: function () {
                    var objectId = $(elementFilter).jqGrid('getGridParam', 'selrow');
                    if (!String.isNullOrEmpty(objectId)) globals.filter.removeByObjectId(objectId);
                    me.updateFilterGrid(true);
                }
            };
            var navClearFilter = {
                caption: "",
                buttonicon: "ui-icon-trash",
                position: "last",
                title: "Clear filter",
                cursor: "pointer",
                onClickButton: function () {
                    globals.filter.clear();
                    me.updateFilterGrid(true);
                }
            };

            // Flights
            $(elementFlightData).jqGrid({
                datatype: 'clientSide',
                height: "auto",
                width: widthGrids,
                pager: '#flightDataPager',
                forceFit: true,
                colNames: ['ObjId', 'Callsign', 'Pilot', 'Id', 'Squawk', 'grounded', 'bounds', 'displayed'],
                colModel: colModelFlights,
                rowNum: globals.flightGridRows,
                sortname: 'displayed',
                sortorder: 'desc',
                viewrecords: false,
                pagerpos: "right",
                gridview: true,
                ignoreCase: true,
                caption: 'Flights',
                // rowId, status
                onSelectRow: function (rowId) { me._updateDetailsGrid(rowId); },
                // rowId, iRow, iCol, e
                ondblClickRow: function (rowId) { me._centerMapToObject(rowId); }
            });
            navCenterOnMap.onClickButton = function () { me._centerToMapClick(elementFlightData); };
            $(elementFlightData).jqGrid('filterToolbar', gridFilterOpts);
            $(elementFlightData).jqGrid('navGrid', "#flightDataPager", navOptions);
            $(elementFlightData).jqGrid('navButtonAdd', "#flightDataPager", navCenterOnMap);
            $(elementFlightData).jqGrid('navButtonAdd', "#flightDataPager", navAddToFilter);
            $(elementFlightData).jqGrid('navButtonAdd', "#flightDataPager", navFollowOnMap);

            // ATC
            $(elementAtcData).jqGrid({
                datatype: 'clientSide',
                height: "auto",
                width: widthGrids,
                forceFit: true,
                colNames: ['ObjId', 'Callsign', 'Controller', 'Id', 'bounds', 'displayed'],
                colModel: colModelAtcs,
                rowNum: globals.atcGridRows,
                sortname: 'displayed',
                sortorder: 'desc',
                ignoreCase: true,
                viewrecords: false,
                pager: "#atcDataPager",
                pagerpos: "right",
                gridview: true,
                hiddengrid: true, // initially collapse
                caption: 'ATC',
                // rowId, status
                onSelectRow: function (rowId) { me._updateDetailsGrid(rowId); },
                // rowId, iRow, iCol, e
                ondblClickRow: function (rowId) { me._centerMapToObject(rowId); }
            });
            navCenterOnMap.onClickButton = function () { me._centerToMapClick(elementAtcData); };
            $(elementAtcData).jqGrid('filterToolbar', gridFilterOpts);
            $(elementAtcData).jqGrid('navGrid', "#atcDataPager", navOptions);
            $(elementAtcData).jqGrid('navButtonAdd', "#atcDataPager", navCenterOnMap);

            // Filter
            $(elementFilter).jqGrid({
                datatype: 'clientSide',
                height: "auto",
                width: widthGrids,
                forceFit: true,
                colNames: ['ObjId', 'Callsign', 'Name', 'Id', 'E.'],
                colModel: colModelFilter,
                rowNum: globals.atcGridRows,
                sortname: 'displayed',
                sortorder: 'desc',
                ignoreCase: true,
                viewrecords: false,
                pager: "#filterDataPager",
                pagerpos: "right",
                gridview: true,
                hiddengrid: true, // initially collapse
                caption: 'Filter',
                // rowId, status
                onSelectRow: function (rowId) { me._updateDetailsGrid(rowId); },
                // rowId, iRow, iCol, e
                ondblClickRow: function (rowId) { me._centerMapToObject(rowId, true); }
            });
            navCenterOnMap.onClickButton = function () { me._centerToMapClick(elementFilter); };
            $(elementFilter).jqGrid('filterToolbar', gridFilterOpts);
            $(elementFilter).jqGrid('navGrid', "#filterDataPager", navOptions);
            $(elementFilter).jqGrid('navButtonAdd', "#filterDataPager", navCenterOnMap);
            $(elementFilter).jqGrid('navButtonAdd', "#filterDataPager", navRemoveFromFilter);
            $(elementFilter).jqGrid('navButtonAdd', "#filterDataPager", navClearFilter);

            // details
            $(elementDetailsData).jqGrid({
                datatype: 'clientSide',
                data: [{ property: "-->", value: "select object to display"}],
                height: "auto",
                width: widthGrids,
                forceFit: true,
                ignoreCase: true,
                colNames: ['Name', 'Value'],
                colModel: colModelDetails,
                viewrecords: true,
                onSelectRow: function (rowId) { me._updateDetailsGrid(rowId); },
                gridview: true,
                hiddengrid: true, // initially collapse
                caption: 'Details'
            });
        } else {
            this._changeGridColumnWidths(elementFlightData, colModelFlights, widthGrids);
            this._changeGridColumnWidths(elementAtcData, colModelAtcs, widthGrids);
            this._changeGridColumnWidths(elementFilter, colModelFilter, widthGrids);
            this._changeGridColumnWidths(elementDetailsData, colModelDetails, widthGrids);
        }
    };

    /**
    * Init the log levels.
    * @private
    * @see vd.module:page.Globals#_initLogger
    */
    exports.PageController.prototype._initLogLevels = function () {
        var levels = [
            log4javascript.Level.TRACE.name, log4javascript.Level.DEBUG.name,
            log4javascript.Level.INFO.name, log4javascript.Level.WARN.name,
            log4javascript.Level.ERROR.name, log4javascript.Level.FATAL.name];
        vd.util.UtilsWeb.selectAddOptions("inputSettingsLogLevel", levels, globals.log.getEffectiveLevel());
    };

    /**
    * Init the ground overlay parts.
    * @private
    * @see vd.module:page.PageController#displayOverlayChart
    * @see vd.module:page.PageController#loadOverlayChart
    */
    exports.PageController.prototype._initGroundOverlays = function () {
        var airportIcaos = globals.groundOverlays.airports;
        vd.util.UtilsWeb.selectAddOptions("inputGroundOverlaysAirport", airportIcaos);
        var opacities = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
        vd.util.UtilsWeb.selectAddOptions("inputGroundOverlayOpacity", opacities, globals.styles.groundOverlayOpacity);
        this._groundOverlayUrls();
    };

    /**
    * Init the about side bar tab.
    * @private
    */
    exports.PageController.prototype._initAbout = function () {
        var version = document.getElementById("vatGmVersion");
        $(version).empty();
        version.appendChild(document.createTextNode(globals.version));
    };

    /**
    * Init altitude profile.
    * @private
    */
    exports.PageController.prototype._initAltitudeProfile = function () {
        globals.altitudeProfile = new vd.gc.AltitudeProfile("mapAltitudeProfile"); // do this before collapsing bar
        document.getElementById("inputElevationService").checked = globals.elevationServiceEnabled;
        this.altitudeProfileSettings();
    };

    /**
    * Clear own map overlays.
    * @private
    */
    exports.PageController.prototype._clearOwnMapOverlays = function () {
        this.hideRoute();
    };
    // #endregion ------------ private part init ------------

    // #region ------------ private part general ------------
    /**
    * Display bounds and geo location.
    * @private
    */
    exports.PageController.prototype._displayLocationAndBounds = function () {
        this._displayMapBounds();
        this._displayGeolocation();
        this._displayZoomInfo();
    };

    /**
    * Display then map bounds (coordinates).
    * @private
    */
    exports.PageController.prototype._displayMapBounds = function () {
        if (globals.map == null) return; // during init
        var bounds = globals.map.getBounds();
        if (bounds == null) return; // during init
        var center = globals.map.getCenter();

        var unitD = globals.unitDistance;
        var northEast = bounds.getNorthEast();
        var formatNe = vd.util.UtilsMap.formatLatLngValues(northEast, globals.coordinatesDigitsDisplayed);
        var southWest = bounds.getSouthWest();
        var formatSw = vd.util.UtilsMap.formatLatLngValues(southWest, globals.coordinatesDigitsDisplayed);
        var centerBounds = new google.maps.LatLngBounds(southWest, center);
        var txt1 = "NE: " + formatNe["lat"] + " / " + formatNe["lng"];
        var txt2 = "SW: " + formatSw["lat"] + " / " + formatSw["lng"];
        var txt3 = "invalid";

        // distances 
        var z = globals.map.getZoom();
        if (z > 1) {
            // The earth is a globe ;-)
            // Since I have to calculate the "longest" distance I have to go via center and *2
            var distances = vd.util.UtilsCalc.boundsDistances(centerBounds, unitD);
            distances["h"] = distances["h"] * 2; // horizontal
            distances["v"] = distances["v"] * 2; // vertical
            distances["d"] = distances["d"] * 2; // diagonal
            var h = (distances["h"] >= 1000 ? distances["h"].toFixed(0) : distances["h"].toFixed(1)) + unitD;
            var v = (distances["v"] >= 1000 ? distances["v"].toFixed(0) : distances["v"].toFixed(1)) + unitD;
            var d = (distances["d"] >= 1000 ? distances["d"].toFixed(0) : distances["d"].toFixed(1)) + unitD;
            txt3 = h + " x " + v + " / " + d;
        }

        // build DOM
        var td = document.getElementById("locationMapBounds");
        $(td).empty();
        td.appendChild(document.createTextNode(txt1));
        td.appendChild(document.createElement("BR"));
        td.appendChild(document.createTextNode(txt2));
        td.appendChild(document.createElement("BR"));
        td.appendChild(document.createTextNode(txt3));
        center = globals.map.getCenter();
        var formatCenter = vd.util.UtilsMap.formatLatLngValues(center, globals.coordinatesDigitsDisplayed);
        document.getElementById("inputLatitude").value = formatCenter["lat"];
        document.getElementById("inputLongitude").value = formatCenter["lng"];
    };

    /**
    * Update the geo location.
    * @private
    */
    exports.PageController.prototype._displayGeolocation = function () {

        // geo location available
        var td = document.getElementById("inputGeoLocationInfo");
        $(td).empty();

        // update text
        var txt = (globals.geolocationWorking) ? globals.geolocationLat.toFixed(globals.coordinatesDigitsDisplayed) + " / " + globals.geolocationLon.toFixed(globals.coordinatesDigitsDisplayed) : "n/a";
        td.appendChild(document.createTextNode(txt));
    };

    /** 
    * Display an infto that the zoom is too low.
    * @private
    */
    exports.PageController.prototype._displayZoomInfo = function () {
        // Info
        var hiddenInfo = this._hiddenByZoomMessage();
        if (!String.isNullOrEmpty(hiddenInfo)) this.displayInfo(hiddenInfo);
    };

    /**
    * Display a color bar for the altitude.
    * @private
    */
    exports.PageController.prototype._displayAltitudeColorBar = function () {
        var bar = document.getElementById("inputFlightWaypointsLegend");
        if (Object.isNullOrUndefined(bar.getContext)) {
            // check
            globals.log.error("Canvas not available, old browser? IE Compatibility View?");
            return;
        }
        var ctx = bar.getContext("2d");
        var baseColor = globals.styles.wpFlightWaypointBaseColorHsv;
        var endValue = 100;
        var barHeight = $(bar).height();
        var width = $(bar).width();
        var stepWidth = width / endValue;

        for (var value = 0; value <= endValue; value++) {
            var color = vd.util.Utils.valueToGradient(baseColor[0], baseColor[1], value, endValue);
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.fillRect(value * stepWidth, 0, stepWidth, barHeight); // x, y, w,h 
        }
    };

    /**
    * Set VATSIM file info, read when etc.
    * @param {String} info
    * @private
    */
    exports.PageController.prototype._setVatsimInfoFields = function (vatsimFileInfo) {
        // file info
        if (!Object.isNullOrUndefined(globals.vatsimClients)) vatsimFileInfo = String.isNullOrEmpty(vatsimFileInfo) ? globals.vatsimClients.info : vatsimFileInfo;
        var td = document.getElementById("inputDatafileInfo");
        $(td).empty();
        if (!String.isNullOrEmpty(vatsimFileInfo)) td.appendChild(document.createTextNode(vatsimFileInfo));
    };

    /**
    * Set FsxWs file info.
    * @private
    */
    exports.PageController.prototype._setFsxWsInfoFields = function () {
        var info;

        // FsxWs info in general
        var td = document.getElementById("fsxWsURL");
        $(td).empty();
        if (String.isNullOrEmpty(globals.fsxWs.aircraftsUrl))
            info = "No connection info";
        else {
            info = vd.util.UtilsWeb.removeProtocol(globals.fsxWs.aircraftsUrl);
            info = info.truncateRight(globals.sideBarFsxWsUrlMaxChars, false);
            if (globals.isFsxAvailable()) {
                if (globals.fsxWs.lastStatus == vd.entity.FsxWs.Ok)
                    info += " (connected)";
                else if (globals.fsxWs.lastStatus == vd.entity.FsxWs.ReadNoFsxData)
                    info += " (connected, no data)";
                else
                    info += " (inconsistent)";
            } else
                info += " (disconnected)";
        }
        td.appendChild(document.createTextNode(info));

        // Navaid status
        td = document.getElementById("fsxWsNavaidStatus");
        var loadNavaids = false;
        $(td).empty();
        if (!globals.isFsxAvailable()) {
            info = "FsxWs not available / disabled. No Navaids available!";
        } else if (!globals.fsxWs.hasNavaids()) {
            info = "No Navaids available. See FsxWs setup.";
            loadNavaids = true;
        } else {
            info = "Navaids available";
            loadNavaids = true;
        }
        td.appendChild(document.createTextNode(info));
        if (loadNavaids)
            $("#fsxWsNavaidsLoad").show();
        else
            $("#fsxWsNavaidsLoad").hide();
    };

    /**
    * Message displayed when entities are not displayed due to zoom level.
    * @return {String}
    * @private
    */
    exports.PageController.prototype._hiddenByZoomMessage = function () {
        var zoom = globals.map.getZoom();
        var hiddenInfo = "";
        if (zoom <= globals.flightHideZoomLevel) hiddenInfo = "Flights";
        if (zoom <= globals.airportHideZoomLevel) {
            hiddenInfo = String.isNullOrEmpty(hiddenInfo) ? "Airports" : hiddenInfo + ", airports";
        }
        hiddenInfo = hiddenInfo.appendIfThisIsNotEmpty(" will not be displayed due to zoom level.");
        return hiddenInfo;
    };

    /**
    * Is side bar wide mode?
    * @return {Boolean}
    * @private
    */
    exports.PageController.prototype._isSideBarWide = function () {
        var w = $("#sideBar").width();
        return globals.sideBarWideWidth < w;
    };

    /**
    * Enable / disable the ground overlay URLs
    */
    exports.PageController.prototype._groundOverlayUrls = function () {
        var god = document.getElementById("inputGroundOverlayDetails");
        var golv = document.getElementById("inputGroundOverlayChartLatestVersion");

        if (!Object.isNullOrUndefined(this.groundOverlayDisplayed) && !String.isNullOrEmpty(this.groundOverlayDisplayed.infoUrl)) {
            $(god).unbind('click', false);
            god.style.opacity = 1;
        } else {
            $(god).bind('click', false);
            god.style.opacity = 0.3;
        }
        if (!Object.isNullOrUndefined(this.groundOverlayDisplayed) && !String.isNullOrEmpty(this.groundOverlayDisplayed.originalChartUrl)) {
            $(golv).unbind('click', false);
            golv.style.opacity = 1;
        } else {
            $(golv).bind('click', false);
            golv.style.opacity = 0.3;
        }
    };
    // #endregion ------------ private part general ------------

    // #region ------------ private part events ------------
    /**
    * Async handling of bounds changed.
    * @private
    */
    exports.PageController.prototype._asyncBoundsUpdate = function () {
        if (globals._asyncBoundsUpdateSemaphore) {
            // multiple calls / race, must never happen
            return;
        } else {
            globals._asyncBoundsUpdateSemaphore = true;
            this._displayLocationAndBounds();
            var relevantMapMovement = true;
            if (Object.isNullOrUndefined(globals.mapOldCenter)) {
                globals.mapOldCenter = globals.map.getCenter();
                globals.mapOldZoom = globals.map.getZoom();
            } else {
                relevantMapMovement = vd.util.UtilsCalc.isRelevantMapChange(globals.mapOldCenter, globals.mapOldZoom);
            }

            if (relevantMapMovement) {
                globals.mapOldCenter = globals.map.getCenter();
                globals.mapOldZoom = globals.map.getZoom();
                this.displayEntities(true, "Map moved.", exports.PageController.DisplayMapMoved);
            }
            globals._asyncBoundsUpdateSemaphore = false;
        }
    };

    /**
    * Center to map click event
    * @param {HTMLElement} element
    * @private
    */
    exports.PageController.prototype._centerToMapClick = function (element) {
        if (Object.isNullOrUndefined(element)) return;
        var objectId = String.toNumber($(element).jqGrid('getGridParam', 'selrow'), -1);
        if (objectId < 0) return;
        this._centerMapToObject(objectId);
        this._updateDetailsGrid();
    };
    // #endregion ------------ private part events ------------

    // #region ------------ private part grids ------------
    /**
    * Update the details grid and its data.
    * @param {String} rowId
    * @private
    */
    exports.PageController.prototype._updateDetailsGrid = function (rowId) {
        var objectId = String.toNumber(rowId, -1);
        var pv = null;
        if (objectId < 0 && !String.isNullOrEmpty(rowId) && !Object.isNullOrUndefined(globals.gridSelectedEntity)) {
            // navigation within details
            switch (rowId.toLowerCase()) {
                case "flightplan":
                    if (!Object.isNullOrUndefined(globals.gridSelectedEntity.flightplan))
                        pv = globals.gridSelectedEntity.flightplan.toPropertyValue();
                    break;
                case "flight":
                    pv = globals.gridSelectedEntity.toPropertyValue();
                    break;
                case "vataware":
                    if (!Object.isNullOrUndefined(globals.gridSelectedEntity) &&
                    globals.gridSelectedEntity.isVatsimBased()) {
                        var url = globals.urlVatasimPilot + globals.gridSelectedEntity.vatsimId;
                        vd.util.UtilsWeb.newLocation(url, true);
                    }
                default:
                    break;
            }
        } else {
            var entity = globals.allEntities.findByObjectId(objectId);
            if (!Object.isNullOrUndefined(entity)) {
                globals.gridSelectedEntity = entity;
                pv = entity.toPropertyValue();
            } // client
        }

        // display properties if there are any
        if (!Object.isNullOrUndefined(pv)) {
            var detailsDataTable = jQuery("#detailsData");
            detailsDataTable.clearGridData();
            for (var index in pv) {
                // display properties but avoid prototypes
                if (pv.hasOwnProperty(index)) {
                    detailsDataTable.addRowData(index, { property: index, value: pv[index] });
                }
            }
        } // property values
    };

    /**
    * Center to the position. 
    * @param {String} rowId entity.objectId 
    * @param {Boolean} [displayInfo]
    * @private
    * @see <a href="http://www.trirand.com/jqgridwiki/doku.php?id=wiki:events">Docu jqGrid</a>
    */
    exports.PageController.prototype._centerMapToObject = function (rowId, displayInfo) {
        if (String.isNullOrEmpty(rowId)) {
            globals.log.warn("Center to map called without row id");
            return;
        }
        displayInfo = Object.isNullOrUndefined(displayInfo, false);
        var entity = globals.allEntities.findByObjectId(rowId, true); // deep search, also finds secondary entities
        if (Object.isNullOrUndefined(entity)) {
            globals.log.warn("Center to map called with id " + rowId + ", but no entity");
            return;
        }
        globals.map.setCenter(entity.latLng());
        if (displayInfo) this._entityDislayedInfo(entity);

        // At least temporarily display, will be overwritten with next update
        // TODO: KB I abuse a private method here to force a display
        if (!entity.displayed && !Object.isNullOrUndefined(entity._draw)) entity._draw(true);
    };

    /**
    * Info on the object (display inconsistencies)?
    * @param {vd.entity.base.BaseEntityModel}
    * @private
    */
    exports.PageController.prototype._entityDislayedInfo = function (entity) {
        if (Object.isNullOrUndefined(entity)) return;
        var msg = "";
        if (entity.entity == "Flight") {
            if (Object.isNullOrUndefined(entity.flightplan) && globals.flightSettings.displayRequireFlightplan) msg = "No flightplan. ";
            if (entity.isGrounded() && !globals.flightSettings.displayOnGround) msg += "Flight on ground. ";
        }

        if (!String.isNullOrEmpty(msg)) {
            msg += "Entity might not be displayed.";
            this.displayInfo(msg);
        }
    };

    /**
    * Is the data table visible?
    * @return {Boolean}
    * @private
    */
    exports.PageController.prototype._gridsVisible = function () {
        var d = document.getElementById("sideBarData").style.display;
        return !(d.toLowerCase() == "none");
    };

    /**
    * Convert boolean to visible/hidden.
    * @param  {Boolean} hidden
    * @return {String}
    * @private
    */
    exports.PageController.prototype._gridHidden = function (hidden) {
        return hidden ? "hidden" : "visible";
    };

    /**
    * Update the grid widths.
    * @param {Object} table
    * @param {Object} colModel
    * @param {Number} gridWidth 
    * @private
    */
    exports.PageController.prototype._changeGridColumnWidths = function (table, colModel, gridWidth) {
        if (gridWidth < 10) return; // grid most likely invisible / hidden!

        // the whole model cannot be changed at once:
        // http://stackoverflow.com/questions/1485436/jqgrid-with-dynamic-colmodel
        for (var c in colModel) {
            var cp = colModel[c];
            $(table).setColProp(cp.name, { width: cp.width, hidden: cp.hidden });
        }
        $(table).setGridWidth(gridWidth);
    };

    /**
    * Format boolean to checkmark.
    * @param {Boolean} cellvalue
    * @private
    * @see <a href="http://tntluoma.com/sidebars/codes/">Codes (Unicode)</a>
    */
    exports.PageController.prototype._booleanToCheckmark = function (cellvalue) {
        // full signature cellvalue, options, rowObject
        return cellvalue ? "&#10004;" : "";
    };

    // #endregion ------------ private part grids ------------
});