/**
* @module vd.entity.base
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity.base', function (exports) {

    /**
    * @classdesc Styles for the entities.
    * @constructor
    * @author KWB
    * @see <a href="http://www.w3schools.com/html/html_colors.asp">Colors</a>
    */
    exports.Styles = function () {

        // flights
        this.flightLabelBorder = "1px solid gray";
        this.flightLabelPadding = "2px";
        this.flightLabelBackground = "white";
        this.flightLabelBackgroundIfFollowed = "#F2FF33";
        this.flightLabelBackgroundIfFollowedTransparent = false;
        this.flightLabelBackgroundIfFiltered = "#993300";
        this.flightLabelBackgroundIfFilteredTransparent = false;
        this.flightLabelOpacity = 0.75;
        this.flightLabelTextAlign = "left";
        this.flightLabelFontSize = "7pt";
        this.flightLabelFontColor = "black";

        // airport
        this.airportLabelBorder = "1px solid black";
        this.airportLabelPadding = "2px";
        this.airportLabelBackground = "blue";
        this.airportLabelOpacity = 0.75;
        this.airportLabelTextAlign = "left";
        this.airportLabelFontSize = "8pt";
        this.airportLabelFontColor = "yellow";
        this.airportVicinityLineStrokeWeight = 2;
        this.airportVicinityFillColor = "transparent";
        this.airportVicinityLineStrokeColor = "blue";
        this.airportVicinityLineStrokeOpacity = 0.8;
        this.airportVicinityFillOpacity = 0.35;

        // waypoints Flight
        this.wpFlightLabelBorder = "0px";
        this.wpFlightLabelPadding = "1px";
        this.wpFlightLabelBackground = "white";
        this.wpFlightLabelOpacity = 1;
        this.wpFlightLabelTextAlign = "left";
        this.wpFlightLabelFontSize = "7pt";
        this.wpFlightLabelFontColor = "black";
        this.wpFlightWaypointBaseColor = null;
        this.wpFlightWaypointBaseColorHsv = null;
        this.setFlightWaypointColor("blue");

        // flight waypoint lines / others
        this.wpFlightLineOpacity = 0.5;
        this.wpMarkerIconSize = 12;

        // waypoints Route
        this.wpRouteLabelBorder = "0px";
        this.wpRouteLabelPadding = "1px";
        this.wpRouteLabelBackground = "red";
        this.wpRouteLabelOpacity = 1;
        this.wpRouteLabelTextAlign = "left";
        this.wpRouteLabelFontSize = "8pt";
        this.wpRouteLabelFontColor = "blue";
        this.wpRouteLineOpacity = 0.5;
        this.wpRouteLineColor = "red";
        this.wpRouteLineStrokeWeight = 3;

        // Navaids
        this.navaidLabelBorder = "1px solid black";
        this.navaidLabelPadding = "2px";
        this.navaidImageBackground = "transparent";
        this.navaidImageOpacity = 1;
        this.navaidLabelBackground = "yellow";
        this.navaidLabelBackgroundTransparent = true;
        this.navaidLabelOpacity = 0.75;
        this.navaidLabelTextAlign = "left";
        this.navaidLabelFontSize = "7pt";
        this.navaidLabelFontColor = "black";

        // ground overlays
        this.groundOverlayOpacity = 0.7;
        this.groundOverlayBackground = "white";
    };

    /**
    * Set the color for the flight waypoints.
    * @param {String} color
    */
    exports.Styles.prototype.setFlightWaypointColor = function (color) {
        this.wpFlightWaypointBaseColor = new RgbColor(color);
        this.wpFlightWaypointBaseColorHsv = rgbToHsv(this.wpFlightWaypointBaseColor.r, this.wpFlightWaypointBaseColor.g, this.wpFlightWaypointBaseColor.b);
    };
});