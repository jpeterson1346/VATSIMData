/**
* @module vd.entity.base
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity.base', function (exports) {

    /**
    * @classdesc Styles for the entities.
    * @constructor
    * @author KWB
    * @see <a href="http://www.w3schools.com/html/html_colors.asp">Colours</a>
    */
    exports.Styles = function () {

        // flights
        this.flightLabelBorder = "1px solid gray";
        this.flightLabelPadding = "2px";
        this.flightLabelBackground = "white";
        this.flightLabelBackgroundIfFollowed = "#F2FF33";
        this.flightLabelBackgroundIfFiltered = "#993300";
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

        // waypoint
        this.wpFlightLabelBorder = "0px";
        this.wpFlightLabelPadding = "1px";
        this.wpFlightLabelBackground = "white";
        this.wpFlightLabelOpacity = 1;
        this.wpFlightLabelTextAlign = "left";
        this.wpFlightLabelFontSize = "7pt";
        this.wpFlightLabelFontColor = "black";
        this.wpFlightWaypointBaseColour = null;
        this.wpFlightWaypointBaseColourHsv = null;
        this.setFlightWaypointColour("blue");

        // waypoint lines
        this.wpFlightLineOpacity = 0.5;
    };

    /**
    * Set the colour for the flight waypoints.
    * @param {String} colour
    */
    exports.Styles.prototype.setFlightWaypointColour = function (colour) {
        this.wpFlightWaypointBaseColour = new RgbColor(colour);
        this.wpFlightWaypointBaseColourHsv = rgbToHsv(this.wpFlightWaypointBaseColour.r, this.wpFlightWaypointBaseColour.g, this.wpFlightWaypointBaseColour.b);
    };
});