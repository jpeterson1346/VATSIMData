/**
* @module vd.page
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.page', function(exports) {

    // #region ------------ clients, flights (VATSIM / FSX) display ------------
    /**
    * Use / load VATSIM data?
    * @return {Boolean} VASTIM enabled
    * @see vd.page.PageController.prototype.resetUpdateTimer
    */
    exports.PageController.prototype.isVatsimEnabled = function() {
        if (Object.isNullOrUndefined(globals.vatsimClients) || !globals.vatsimClients.enabled) return false;
        return this.timerLoadVatsimUpdate > 0;
    };

    /**
    * Use / load FsxWs data?
    * @return {Boolean} FsxWs enabled
    * @see vd.page.PageController.prototype.resetUpdateTimer
    */
    exports.PageController.prototype.isFsxWsEnabled = function() {
        if (Object.isNullOrUndefined(globals.fsxWs) || !globals.fsxWs.enabled) return false;
        return this.timerFsxDataUpdate > 0;
    };

    /**
    * Load entities (flights VATSIM/FSX, airports, ATC ...).
    * @param {Boolean} displayInfo status bar info
    * @param {String} additional info, only makes sense with displayInfo
    * @param {Number} [displayReason] details, improving how to best display 
    * @return {String} infoString clear text message
    */
    // VatGM: Display entities (from FSX / VATSIM)
    exports.PageController.prototype.displayEntities = function(displayInfo, initInfo, displayReason) {
        displayInfo = Object.ifNotNullOrUndefined(displayInfo, false);
        displayReason = Object.ifNotNullOrUndefined(displayReason, exports.PageController.DisplayForceRedisplay);

        // init
        var info = String.isNullOrEmpty(initInfo) ? "" : initInfo;
        var vatsimClients; // representing all VATSIM entities
        var displayVatsim = displayReason == exports.PageController.DisplayForceRedisplay || displayReason == exports.PageController.DisplayNewDataVatsim || displayReason == exports.PageController.DisplayMapMoved;
        var displayFsxWs = displayReason == exports.PageController.DisplayForceRedisplay || displayReason == exports.PageController.DisplayNewDataFsx || displayReason == exports.PageController.DisplayMapMoved;

        // handle the VATSIM clients
        var vatsimFlightsInBound = null; // for elevation service
        if (this.isVatsimEnabled && displayVatsim) {
            vatsimClients = globals.vatsimClients;

            // get new elevations
            if (globals.elevationServiceEnabled) {
                // we only need to do this for VATSIM entities, FSX entities do already have height
                // since this is a) a time consuming method and b) makes only sense for entities "in bound"
                // I trigger the update here (e.g. after the map has moved).
                vatsimFlightsInBound = vd.entity.base.BaseEntityMap.findInBounds(vatsimClients.flights); // flights in bounds
            }

            if (vatsimClients.lastStatus != vd.entity.VatsimClients.Init) {
                info += " VATSIM: " + vd.entity.VatsimClients.statusToInfo(vatsimClients.lastStatus) + ".";
                this._setVatsimInfoFields(vatsimClients.info); // info about load
            }
        }

        // handle the FSX data
        if (this.isFsxWsEnabled() && displayFsxWs) {
            if (globals.fsxWs.lastStatus != vd.entity.FsxWs.Init) {
                info += " FsxWs: " + vd.entity.FsxWs.statusToInfo(globals.fsxWs.lastStatus) + ".";
            }
        }

        // display
        var mergedClients = globals.allEntities;
        if (!Object.isNullOrUndefined(mergedClients) && !mergedClients.isEmpty()) {
            if (mergedClients.containsDisposedEntities()) alert("Display entities, disposed elements found: " + mergedClients.disposedEntitiesCount());
            mergedClients.display(true, displayFsxWs, displayVatsim);
        }

        // display info whether flights / airports will be shown
        var hiddenInfo = this._hiddenByZoomMessage();
        info = info.appendIfNotEmpty(hiddenInfo, " ");

        // update the grids
        this.updateGridsBackground();

        // update the height profile, and request new data for VATSIM data
        if (!Array.isNullOrEmpty(vatsimFlightsInBound)) {
            // the VATSIM data might already have height / elevation by the update of FSX
            // reduce to the purely VATSIM based entities
            vatsimFlightsInBound = vd.entity.base.BaseEntityModel.findVatsimBased(vatsimFlightsInBound, true);
            vd.gm.Elevation.getElevationsForEntities(vatsimFlightsInBound); // runs asynchronously, might be disabled
        }
        this._updateAltitudeProfile();

        // follow a certain user by id
        if (Object.isNumber(globals.mapFollowId)) {
            var entity = mergedClients.findByObjectId(globals.mapFollowId);
            var fInfo = this._followOnMap(entity);
            info = info.appendIfNotEmpty(fInfo, " ");
        }

        // display ground overly charts (if any)
        if (!Object.isNullOrUndefined(this.groundOverlayDisplayed)) this.groundOverlayDisplayed.display(true, false, true);

        // display info (header status bar, and console)
        if (displayInfo) this.displayInfoIfNotEmpty(info);
        return info;
    };

    /**
    * Helper method to follow on map.
    * @param {vd.entity.base.BaseEntityModelOnMap} baseEntity to be followed or null
    * @private
    */
    exports.PageController.prototype._followOnMap = function(baseEntity) {
        var info;
        if (!Object.isNullOrUndefined(baseEntity)) {
            globals.map.setCenter(baseEntity.latLng());
            info = "Center on '" + baseEntity.callsign;
            info += "'.";
        } else {
            info = "Followed object no longer available.";
            this.followId(null, false, false);
        }
        return info;
    };

    /**
    * Load the navaids (via fsx).
    * @param {Boolean} [display]
    */
    exports.PageController.prototype.loadAndDisplayNavaids = function(display) {
        if (!globals.isFsxAvailable()) return;
        var cbDisplay = vd.util.UtilsWeb.checkboxChecked("inputNavaidsDisplay");
        display = Object.ifNotNullOrUndefined(display, cbDisplay);
        globals.fsxWs.readNavigraphNavaids(vd.entity.FsxWs.Navaids,
            function() {
                vd.entity.base.BaseEntityMap.display(globals.fsxWs.navaids, display, true);
            });
    };
    // #endregion ------------ clients, flights (VATSIM / FSX) data display ------------

    // #region ------------ Timers for automatic updates ------------

    /**
    * Set a new or cancel the timer.
    */
    exports.PageController.prototype.resetUpdateTimer = function(displayInfo) {

        displayInfo = Object.ifNotNullOrUndefined(displayInfo, false);

        // new values and get actual update time
        this.timerLoadVatsimUpdate = String.toNumber($("#inputTimerUpdateVatsim").val(), -1) * 1000;
        var timeOut = this.timerLoadVatsimUpdate;
        this.timerFsxDataUpdate = String.toNumber($("#inputTimerUpdateFsx").val(), -1) * 1000;

        // dispose old data, the merge
        var mergeRequired = false;
        if (this.timerLoadVatsimUpdate < 0 && !Object.isNullOrUndefined(globals.vatsimClients)) {
            mergeRequired = globals.vatsimClients.disposeData();
        }
        if (this.timerFsxDataUpdate < 0 && !Object.isNullOrUndefined(globals.fsxWs)) {
            mergeRequired = globals.fsxWs.disposeData() || mergeRequired;
        }
        if (mergeRequired) this.mergeEntities();

        // always use the smallest valid time, even with no FSX available -> FSX might be switched on
        if (timeOut < 0 || (this.timerFsxDataUpdate > 0 && this.timerFsxDataUpdate < timeOut)) timeOut = this.timerFsxDataUpdate;
        if (displayInfo) {
            var info = "VATSIM: " + (this.isVatsimEnabled() ? this.timerLoadVatsimUpdate + "ms updates. " : "disabled. ");
            info += "FsxWs: " + (this.isFsxWsEnabled() ? this.timerFsxDataUpdate + "ms updates." : "disabled.");
            this.displayInfoIfNotEmpty(info);
        }

        // init timer, even if we have both disabled, in order to detect data
        var me = this;
        setTimeout(function() { me.timerDispatcher(); }, timeOut);
    };

    /**
    * Dispatches the timer calls to the respective functions.
    * This saves multiples timers and allows to call the data loaders in a
    * controlled order.
    * <p>
    * A status info will be displayed, the "follow a plane situation" adjusted.
    * </p>
    */
    // VatGM: Dispatching to the Data Loaders
    exports.PageController.prototype.timerDispatcher = function() {
        if (globals.timerDispatcherSemaphore) return; // avoid races
        globals.timerDispatcherSemaphore = true;

        // init values if required
        if (Object.isNullOrUndefined(this.timerLoadVatsimUpdateLastCall)) this.timerLoadVatsimUpdateLastCall = new Date(0);
        if (Object.isNullOrUndefined(this.timerFsxDataUpdateLastCall)) this.timerFsxDataUpdateLastCall = new Date(0);

        // Init
        var now = new Date().getTime();
        var me = this;

        // check for FSX data
        var timePassed = (this.timerFsxDataUpdateLastCall.getTime() + this.timerFsxDataUpdate < now);
        if (timePassed) {
            if (this.isFsxWsEnabled()) {
                var autoDisable = true;
                if (globals.fsxWs.lastStatus == vd.entity.FsxWs.Init)
                    globals.fsxWs.readFromFsxWs(true, autoDisable); // run one test
                else if (globals.fsxWs.enabled) {
                    globals.fsxWs.readFromFsxWs(false, autoDisable,
                        function() {
                            me.successfulDataReadFsxWs();
                        }); // trigger a new read
                }

                // time stamp
                this.timerFsxDataUpdateLastCall = new Date();
            }

            // update fields after a delay, hopefully the async check is completed by then
            // I recheck always, even with FsxWs disabled, because sometimes an event is missed
            setTimeout(function() {
                me._setFsxWsInfoFields();
            }, globals.fsxWsAvailabilityDelay);
        }

        // check for VATSIM data
        timePassed = (this.timerLoadVatsimUpdateLastCall.getTime() + this.timerLoadVatsimUpdate < now);
        if (this.isVatsimEnabled() && timePassed) {
            globals.vatsimClients.readFromVatsim(
                function() {
                    me.successfulDataReadVatsim();
                }); // trigger a new read (async)
            this.timerLoadVatsimUpdateLastCall = new Date();
        }

        // retrigger timer
        this.resetUpdateTimer();
        globals.timerDispatcherSemaphore = false;
    };

    /**
    * Merge the clients of VATSIM and FSX flights.
    */
    exports.PageController.prototype.mergeEntities = function() {
        var mergedList;
        var vatsimEntities = null;

        // VATSIM, do not use isVatsimEnabled() here, just merge
        if (!Object.isNullOrUndefined(globals.vatsimClients)) {
            vatsimEntities = globals.vatsimClients.vatsimClients();
        }

        // FSX, has to be last because of better position data
        // do not use isFsxWsEnabled here
        if (globals.usageMode == vd.page.PageController.UsageModeVatsimOnly) {
            mergedList = new vd.entity.base.EntityMapList(vatsimEntities);
        } else if (globals.usageMode == vd.page.PageController.UsageModeFsxMovingMapFsxOnly) {
            if (Object.isNullOrUndefined(globals.fsxWs)) {
                alert("Missing fsxWs object");
                mergedList = new vd.entity.base.EntityMapList();
            } else {
                mergedList = new vd.entity.base.EntityMapList(globals.fsxWs.flights);
            }
        } else if (!Object.isNullOrUndefined(globals.fsxWs)) {
            var addNonExisitingVatsimFlights = !(globals.usageMode == vd.page.PageController.UsageModeFsxMovingMapWithVatsim);
            var fsxAndVatsimEntites = globals.fsxWs.mergeWithVatsimFlights(vatsimEntities, addNonExisitingVatsimFlights, true);
            mergedList = new vd.entity.base.EntityMapList(fsxAndVatsimEntites);
        } else {
            mergedList = new vd.entity.base.EntityMapList(vatsimEntities);
        }

        // NaviGraph data will be added on top, irregardless of usage mode
        if (!Object.isNullOrUndefined(globals.fsxWs)) {
            if (globals.fsxWs.hasNavaids()) mergedList.addEntities(globals.fsxWs.navaids);
        }

        // make globally available
        globals.allEntities = mergedList;
    };

    /**
    * Succesfully read data from VATSIM.
    */
    // VatGM: Callback, read data from VATSIM
    exports.PageController.prototype.successfulDataReadVatsim = function() {
        this.mergeEntities();
        this.displayEntities(false, "VATSIM data read.", exports.PageController.DisplayNewDataVatsim);
    };

    /**
    * Succesfully read data from VATSIM.
    */
    // VatGM: Callback, read data from FsxWs
    exports.PageController.prototype.successfulDataReadFsxWs = function() {
        this.mergeEntities();
        this.displayEntities(false, "FsxWs data read.", exports.PageController.DisplayNewDataFsx);
    };

    // #endregion  ------------ Timers for automatic updates ------------

    // #region  ------------ Trigger new loads ------------
    /**
    * Trigger new data loads (VATSIM, FsxWs).
    * Loading is an asynchronous process.
    * @param {Boolean} [display] show an info
    */
    exports.PageController.prototype.triggerNewLoad = function(display) {
        display = Object.ifNotNullOrUndefined(display, false);
        var info = "";
        var me = this;
        if (!Object.isNullOrUndefined(globals.fsxWs) && globals.fsxWs.enabled) {
            if (globals.fsxWs.loading) {
                info = "FsxWs already loading.";
            } else {
                info = "Trigger FsxWs load.";
                globals.fsxWs.readFromFsxWs(false, false,
                    function() {
                        me.successfulDataReadFsxWs();
                    }
                ); // trigger a new read
                this.timerFsxDataUpdateLastCall = new Date(); // time stamp
            }
        }

        if (!Object.isNullOrUndefined(globals.vatsimClients) && globals.vatsimClients.enabled) {
            if (globals.vatsimClients.loading) {
                info += "VATSIM already loading.";
            } else {
                info += "Trigger VATSIM load.";
                globals.vatsimClients.readFromVatsim(
                    function() {
                        me.successfulDataReadVatsim();
                    }
                ); // trigger a new read
                this.timerLoadVatsimUpdateLastCall = new Date(); // time stamp
            }
        }

        if (display) this.displayInfoIfNotEmpty(info);
    };
    // #endregion  ------------ Trigger new loads  ------------
});