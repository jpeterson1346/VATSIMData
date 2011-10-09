/**
* @module vd.gm
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity.helper', function (exports) {

    /**
    * @constructor
    * @classdesc Dealing with Google Map ground overlays such as Airport maps.
    * @param {google.maps.Map} [map]
    * @author KWB
    * @see <a href="http://code.google.com/apis/maps/documentation/javascript/overlays.html#GroundOverlays">Google Map ground overlay Example</a>
    */
    exports.GroundOverlays = function (map) {

        /**
        * All airports with overlays (by ICAO code).
        * @type {Array}
        */
        this.airports = new Array();

        // init
        this.setMap(map);
        this.read();
    };

    /**
    * Set the corresponding map.
    * @param {google.maps.Map}
    */
    exports.GroundOverlays.prototype.setMap = function (map) {
        this.map = map;
    };

    /**
    * Read the overlays.
    */
    exports.GroundOverlays.prototype.read = function () {
        var xmlhttp = new XMLHttpRequest();
        var url = vd.util.UtilsWeb.replaceCurrentPage("overlays/Overlays.xml");
        xmlhttp.open("GET", url, false);
        xmlhttp.send();
        if (xmlhttp.status == 200) {
            if (Object.isNullOrUndefined(xmlhttp.responseXML)) return; // file exists, but empty
            var airportsNode = xmlhttp.responseXML.getElementsByTagName("airports")[0];
            if (!Object.isNullOrUndefined(airportsNode) && !Object.isNullOrUndefined(airportsNode.childNodes)) {
                for (var a = 0, len = airportsNode.childNodes.length; a < len; a++) {
                    var apNode = airportsNode.childNodes[a];
                    if (Object.isNullOrUndefined(apNode)) continue;
                    var airportIcao = apNode.firstChild.data.trim();
                    if (!String.isNullOrEmpty(airportIcao)) this.airports.push(airportIcao);
                }
                this.airports.sort();
            }
        } else {
            globals.log.error("Ground overlay data cannot be loaded, status " + xmlhttp.status + ". " + url);
        }
    };

    /**
    * Read the overlays.
    * @return {Array} 0..n overlay entries
    * @see vd.module:entity.GroundOverlay
    */
    exports.GroundOverlays.prototype.readGroundOverlays = function (icao) {
        var groundOverlays = new Array();
        if (String.isNullOrEmpty(icao)) return groundOverlays;
        icao = icao.toUpperCase();
        var xmlhttp = new XMLHttpRequest();
        var url = vd.util.UtilsWeb.replaceCurrentPage("overlays/" + icao + ".xml");
        xmlhttp.open("GET", url, false);
        xmlhttp.send();
        if (xmlhttp.status == 200) {
            if (Object.isNullOrUndefined(xmlhttp.responseXML)) return groundOverlays; // file exists, but empty
            var entityNode = xmlhttp.responseXML.getElementsByTagName("entity")[0];
            if (!Object.isNullOrUndefined(entityNode) && !Object.isNullOrUndefined(entityNode.childNodes)) {
                for (var c = 0, len = entityNode.childNodes.length; c < len; c++) {
                    var chartNode = entityNode.childNodes[c];
                    if (Object.isNullOrUndefined(chartNode)) continue;
                    var go = new vd.entity.GroundOverlay({ map: this.map, callsign: icao });
                    if (go.setFromXmlNode(chartNode)) {
                        // valid ground overlay, add
                        groundOverlays.push(go);
                    }
                }
            }
        } else {
            globals.log.error("Ground overlay data cannot be loaded, status " + xmlhttp.status + ". " + url);
        }
        return groundOverlays;
    };
});