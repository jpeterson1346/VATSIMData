/**
* @module vd.gc
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.gc', function (exports) {

    /**
    * Display elevations and altitudes such as the ground elevation and flight altitude.
    * @constructor
    * @param {HTMLDomElement|String} canvas
    * @param {AltitudeProfileSettings} [altitudeProfileSettings]
    * @author KWB
    */
    exports.AltitudeProfile = function (htmlElement, heightProfileSettings) {
        if (Object.isNullOrUndefined(htmlElement)) throw "HTML element missing as target";
        /**
        * The DOM element for the chart.
        * @type {HTMLDomElement} 
        */
        this.profileElement = vd.util.UtilsWeb.elementFromStringOrDomElement(htmlElement);
        /**
        * The settings for the height profile.
        * @type {AltitudeProfileSettings}
        */
        this.altitudeProfileSettings = Object.ifNotNullOrUndefined(heightProfileSettings, globals.altitudeProfileSettings);
        /**
        * Statistics about displaying the projection.
        * @type {vd.util.RuntimeStatistcis}
        * @private
        */
        this._statisticsAltitudeProfile = new vd.util.RuntimeStatistics("Altitude projection synchronous part");
    };

    /**
    * Display the flights as projection by their latitude / longitude values.
    * @param  {Array}   flights
    * @param  {String}  latOrLon lat/lon
    * @param  {Boolean} withElevationProfile display an elevation profile
    * @return {Boolean} displayed?
    */
    exports.AltitudeProfile.prototype.displayProjection = function (flights, latOrLon, withElevationProfile) {
        if (!this.isVisible()) return false;
        flights = Array.isNullOrEmpty(flights) ? globals.clients.findFlightsDisplayed(true) : flights;
        withElevationProfile = Object.ifNotNullOrUndefined(withElevationProfile, this.altitudeProfileSettings.elevationProfile);
        var statsEntry = new vd.util.RuntimeEntry("Display projection " + flights.length + " flights, elevation profile " + withElevationProfile + " (AltitudeProfile)");
        var data = new google.visualization.DataTable();
        data.addColumn('number', latOrLon);
        data.addColumn('number', 'flight altitude');
        data.addColumn('number', 'flight elevation');
        data.addColumn('number', 'profile elevation');
        var m = 100; // trick, to get the chart scaled as the map
        var lat = (!String.isNullOrEmpty(latOrLon) && latOrLon.toLowerCase().startsWith("lat"));
        var elevationMode = lat ? "v" : "h";
        var bounds = globals.map.getBounds();
        var xRangeMin = lat ? bounds.getSouthWest().lat() * m : bounds.getSouthWest().lng() * m;
        var xRangeMax = lat ? bounds.getNorthEast().lat() * m : bounds.getNorthEast().lng() * m;
        var digits = globals.unitAltitude == "ft" ? 0 : 2;
        for (var f = 0, len = flights.length; f < len; f++) {
            var flight = flights[f];
            var l = (lat ? flight.latitude * m : flight.longitude * m).toFixed(0) * 1; // trick to get the dots directly above the planes
            var el = globals.unitAltitude == "ft" ? flight.elevation : vd.util.UtilsCalc.ftToM(flight.elevation, digits);
            var a = globals.unitAltitude == "ft" ? flight.altitude : vd.util.UtilsCalc.ftToM(flight.altitude, digits);
            data.addRow([l, a, el, null]);
        }

        if (withElevationProfile) {
            var me = this;
            vd.gm.Elevation.getElevationsForBounds(bounds, elevationMode, function (elevations, status) {
                // asynchronously get the elevations and then draw
                var elv;
                if (status == google.maps.ElevationStatus.OK) {
                    var eLen = elevations.length;
                    var statsEntryAsync = new vd.util.RuntimeEntry("Elevation for bounds, samples: " + eLen);
                    for (var e = 0; e < eLen; e++) {
                        var elevation = elevations[e];
                        if (globals.mapElevationZeroCutoff && elevation.elevation < 0)
                            elv = 0;
                        else
                            elv = globals.unitAltitude == "m" ? elevation.elevation : vd.util.UtilsCalc.mToFt(elevation.elevation, 0);

                        var loc = (lat ? elevation.location.lat() * m : elevation.location.lng() * m).toFixed(0) * 1; // trick to get the dots directly above the planes
                        data.addRow([loc, null, null, elv]);
                    }
                    vd.gm.Elevation.statisticsElevationsForBounds.add(statsEntryAsync, true);
                    globals.log.trace(statsEntryAsync.toString());
                } else {
                    globals.log.warn("Elevation request for bounds " + bounds.toString() + " failed, status: " + status);
                }

                // draw, even if there are no data
                me._draw(data, xRangeMin, xRangeMax);
            });
        } else {
            // no google elevations
            this._draw(data, xRangeMin, xRangeMax);
        }

        // log + statistics
        this._statisticsAltitudeProfile.add(statsEntry, true);
        globals.log.trace(statsEntry.toString());

        // end
        return true;
    };

    /**
    * Display the given data.
    * @param {google.visualization.DataTable} data
    * @param {Number} xMin
    * @param {Number} xMax
    * @private
    * @see <a href="http://code.google.com/apis/chart/interactive/docs/gallery/scatterchart.html#Configuration_Options">Configuration options</a>
    */
    exports.AltitudeProfile.prototype._draw = function (data, xMin, xMax) {
        var rows = data.getNumberOfRows();
        var chart = new google.visualization.ScatterChart(this.profileElement);

        // formatters
        var latLonFormatter = new google.visualization.PatternFormat("{0}E-02");
        var altFormatter = new google.visualization.NumberFormat({ suffix: globals.unitAltitude, fractionDigits: 0 });
        latLonFormatter.format(data, [0], 0);
        altFormatter.format(data, 1);
        altFormatter.format(data, 2);
        altFormatter.format(data, 3);

        // draw
        chart.draw(data, {
            title: 'Height profile',
            legend: "none",
            backgroundColor: this.altitudeProfileSettings.profileBackgroundColor,
            axisTitlePosition: "none",
            tooltipTextStyle: null,
            // width: "100%",
            // height: "100%",
            pointSize: 3,
            chartArea: { left: 0, top: 0, width: "100%", height: "100%" },
            series: [
                { pointSize: this.altitudeProfileSettings.altitudePointSize, color: this.altitudeProfileSettings.altitudeColor, visibleInLegend: false },
                { pointSize: this.altitudeProfileSettings.elevationPointSize, color: this.altitudeProfileSettings.elevationColor, visibleInLegend: false },
                { pointSize: this.altitudeProfileSettings.elevationProfilePointSize, color: this.altitudeProfileSettings.elevationProfileColor, visibleInLegend: false }
            ],
            vAxis: {
                // title: "h",
                // titleTextStyle: { color: "green" },
                textPosition: "in",
                minValue: 0,
                maxValue: rows > 0 ? null : 10000,
                textStyle: {
                    fontSize: this.altitudeProfileSettings.axisFontSize
                }
            },
            hAxis: {
                // titleTextStyle: { color: "green" },
                textPosition: "none",
                title: "l",
                minValue: xMin,
                maxValue: xMax,
                viewWindowMode: "explicit",
                viewWindow: {
                    min: xMin,
                    max: xMax
                }
            }
        });
    };

    /**
    * Is the height profile visible?
    * @return {Boolean}
    */
    exports.AltitudeProfile.prototype.isVisible = function () {
        return $(this.profileElement).height() > 10;
    };
});