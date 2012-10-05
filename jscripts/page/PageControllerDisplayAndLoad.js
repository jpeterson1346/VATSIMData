/**
* @module vd.page
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.page', function (exports) {

    // #region ------------ clients, flights (VATSIM / FSX) display ------------

    /**
    * Load entities (flights VATSIM/FSX, airports, ATC ...).
    * @param {Boolean} displayInfo status bar info
    * @param {String} additional info, only makes sense with displayInfo
    * @return {String} infoString clear text message
    */
    // VatGM: Display entities (from FSX / VATSIM)
    exports.PageController.prototype.displayEntities = function (displayInfo, initInfo) {
        displayInfo = Object.ifNotNullOrUndefined(displayInfo, false);

        // init
        var info = String.isNullOrEmpty(initInfo) ? "" : initInfo;
        var vatsimClients; // representing all VATSIM entities

        // handle the VATSIM clients
        if (!Object.isNullOrUndefined(globals.vatsimClients) && globals.vatsimClients.enabled) {
            vatsimClients = globals.vatsimClients;

            // get new elevations
            if (globals.elevationServiceEnabled) {
                // we only need to do this for VATSIM entities, FSX entities do already have height
                // since this is a) a time consuming method and b) makes only sense for entities "in bound"
                // I trigger the update here (e.g. after the map has moved).
                var flightsInBounds = vd.entity.base.BaseEntityMap.findInBounds(vatsimClients.flights); // flights in bounds
                vd.gm.Elevation.getElevationsForEntities(flightsInBounds); // runs asynchronously, might be disabled
            }

            if (vatsimClients.lastStatus != vd.entity.VatsimClients.Init) {
                info += "VATSIM: " + vd.entity.VatsimClients.statusToInfo(vatsimClients.lastStatus) + ".";
                this._setVatsimInfoFields(vatsimClients.info); // info about load
            }
        }

        // handle the FSX data
        if (!Object.isNullOrUndefined(globals.fsxWs) && globals.fsxWs.enabled) {
            if (globals.fsxWs.lastStatus != vd.entity.FsxWs.Init) {
                info += " FsxWs: " + vd.entity.FsxWs.statusToInfo(globals.fsxWs.lastStatus) + ".";
            }
        }

        // display
        var mergedClients = globals.allEntities;
        if (!Object.isNullOrUndefined(mergedClients) && !mergedClients.isEmpty()) {
            var forceRedraw = true;
            if (mergedClients.containsDisposedEntities()) alert("Display entities, disposed elements found: " + mergedClients.disposedEntitiesCount());
            mergedClients.display(true, forceRedraw);
        }

        // display info whether flights / airports will be shown
        var hiddenInfo = this._hiddenByZoomMessage();
        info = info.appendIfNotEmpty(hiddenInfo, " ");

        // update the grids
        this.updateGridsBackground(this._gridsVisible());

        // update the height profile
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
    exports.PageController.prototype._followOnMap = function (baseEntity) {
        var info;
        if (!Object.isNullOrUndefined(baseEntity)) {
            globals.map.setCenter(baseEntity.latLng());
            info = "Center on '" + baseEntity.callsign;
            info += "'.";
        } else {
            info = "Followed object no longer available.";
            this.followId("", false, false);
        }
        return info;
    };
    // #endregion ------------ clients, flights (VATSIM / FSX) data display ------------

    // #region ------------ Timers for automatic updates ------------

    /**
    * Set a new or cancel the timer.
    */
    exports.PageController.prototype.resetUpdateTimer = function () {

        // new values and get actual update time
        this.timerLoadVatsimUpdate = String.toNumber($("#inputTimerUpdateVatsim").val(), -1) * 1000;
        var timeOut = this.timerLoadVatsimUpdate;
        this.timerFsxDataUpdate = String.toNumber($("#inputTimerUpdateFsx").val(), -1) * 1000;

        // always use the smallest valid time, even with no FSX available -> FSX might be switched on
        if (timeOut < 0 || (this.timerFsxDataUpdate > 0 && this.timerFsxDataUpdate < timeOut)) timeOut = this.timerFsxDataUpdate;
        if (this.timerLoadVatsimUpdate < 0 && this.timerFsxDataUpdate < 0) return;

        // init timer
        var me = this;
        setTimeout(function () { me.timerDispatcher(); }, timeOut);
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
    exports.PageController.prototype.timerDispatcher = function () {
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
        if (this.timerFsxDataUpdate > 0 && !Object.isNullOrUndefined(globals.fsxWs) && timePassed) {
            var autoDisable = true;
            if (globals.fsxWs.lastStatus == vd.entity.FsxWs.Init)
                globals.fsxWs.readFromFsxWs(true, autoDisable); // run one test
            else if (globals.fsxWs.enabled) {
                globals.fsxWs.readFromFsxWs(false, autoDisable,
                    function () {
                        me.successfulDataReadFsxWs();
                    }); // trigger a new read
            }

            // time stamp
            this.timerFsxDataUpdateLastCall = new Date();

            // update fields after a delay, hopefully the async check is completed by then
            setTimeout(function () {
                me._setFsxWsInfoFields();
            }, globals.fsxWsAvailabilityDelay);
        }

        // check for VATSIM data
        timePassed = (this.timerLoadVatsimUpdateLastCall.getTime() + this.timerLoadVatsimUpdate < now);
        if (this.timerLoadVatsimUpdate > 0 && !Object.isNullOrUndefined(globals.vatsimClients) && timePassed) {
            globals.vatsimClients.readFromVatsim(
                function () {
                    me.successfulDataReadVatsim();
                }); // trigger a new read (async)
            this.timerLoadVatsimUpdateLastCall = new Date();
        }

        // retrigger timer
        this.resetUpdateTimer();
        globals.timerDispatcherSemaphore = false;
    };

    /**
    * Merge the clients.
    */
    exports.PageController.prototype.mergeClients = function () {
        var mergedClients = new vd.entity.base.EntityMapList();
        if (!Object.isNullOrUndefined(globals.vatsimClients) && globals.vatsimClients.enabled) {
            var vatsimeEntities = globals.vatsimClients.vatsimClients();
            mergedClients = new vd.entity.base.EntityMapList(vatsimeEntities);
        }

        if (!Object.isNullOrUndefined(globals.fsxWs) && globals.fsxWs.enabled) {
            mergedClients = globals.fsxWs.mergeWithVatsimClients(mergedClients);
        }

        // make globally available
        globals.allEntities = mergedClients;
    };

    /**
    * Succesfully read data from VATSIM.
    */
    // VatGM: Callback, read data from VATSIM
    exports.PageController.prototype.successfulDataReadVatsim = function () {
        this.mergeClients();
        this.displayEntities(false, "VATSIM data read.");
    };

    /**
    * Succesfully read data from VATSIM.
    */
    // VatGM: Callback, read data from FsxWs
    exports.PageController.prototype.successfulDataReadFsxWs = function () {
        this.mergeClients();
        this.displayEntities(false, "FsxWs data read.");
    };

    // #endregion  ------------ Timers for automatic updates ------------

    // #region  ------------ Trigger new loads ------------
    /**
    * Trigger new data loads (VATSIM, FsxWs).
    * Loading is an asynchronous process.
    *
    * @param {Boolean} [display] show an info
    */
    exports.PageController.prototype.triggerNewLoad = function (display) {
        display = Object.ifNotNullOrUndefined(display, false);
        var info = "";
        var me = this;
        if (!Object.isNullOrUndefined(globals.fsxWs) && globals.fsxWs.enabled) {
            if (globals.fsxWs.loading) {
                info = "FsxWs already loading";
            } else {
                info = "Trigger FsxWs load.";
                globals.fsxWs.readFromFsxWs(false, false,
                    function () {
                        me.mergeClients();
                    }
                ); // trigger a new read
                this.timerFsxDataUpdateLastCall = new Date(); // time stamp
            }
        }

        if (!Object.isNullOrUndefined(globals.vatsimClients) && globals.vatsimClients.enabled) {
            if (globals.vatsimClients.loading) {
                info += "VATSIM already loading";
            } else {
                info += "Trigger VATSIM load.";
                globals.vatsimClients.readFromVatsim(
                    function () {
                        me.mergeClients();
                        me._setVatsimInfoFields(); // info about load
                    }
                ); // trigger a new read
                this.timerLoadVatsimUpdateLastCall = new Date(); // time stamp
            }
        }

        if (display) this.displayInfoIfNotEmpty(info);
    };
    // #endregion  ------------ Trigger new loads  ------------
});