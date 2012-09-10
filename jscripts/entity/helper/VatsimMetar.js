/**
* @module vd.entity.helper
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity.helper', function (exports) {

    /**
    * @classdesc Metar information
    * @constructor
    * @author KWB
    */
    exports.VatsimMetar = function() {
        // code goes here
    };

    /**
    * Read metar from the VASTIM servers.
    * @param  {String} icao ICAO code such as EDDF, EDDL
    * @return {String} metar Metar information as read
    */
    exports.VatsimMetar.prototype.readFromVatsim = function(icao) {
        if (String.isNullOrEmpty(icao)) return null;
        var runtime = new vd.util.TimeDiff();
        var xmlhttp = new XMLHttpRequest();
        var url;
        if (vd.util.UtilsWeb.isLocalServer()) {
            // local test mode
            url = vd.util.UtilsWeb.replaceCurrentPage("data/Metar.txt"); // full url required for Chrome
        } else {
            // normal mode
            url = vd.util.UtilsWeb.replaceCurrentPage("php/VatsimProxy.php5?metar&id=") + icao.toUpperCase();
        }
        xmlhttp.open("GET", url, false);
        xmlhttp.send();
        if (xmlhttp.status == 200) {
            globals.log.trace("METAR read for " + icao + " in " + runtime.getDiffFormatted());
            return xmlhttp.responseText;
        } else {
            globals.log.warn("Failed to read METAR for " + icao + " status " + xmlhttp.status);
            return null;
        }
    };
});