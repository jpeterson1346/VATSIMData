
/**
* @module vd.entity
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity', function (exports) {

    /**
    * Read navaids.
    * @type {Number}
    * @const
    * @static
    */
    exports.FsxWs.Navaids = 1;
    /**
    * Read Airports.
    * @type {Number}
    * @const
    * @static
    */
    exports.FsxWs.Airports = 2;

    /**
    * Trigger read data from the WebService (JSON) for Navigraph data.
    * @param {Number} type as vd.entity.FsxWs.Navaids, vd.entity.FsxWs.Airports
    * @param {function} [successfulReadCallback] call if really read data
    * @see vd.entity.VatsimClients.readFromVatsim
    * @see vd.entity.FsxWs.readFromFsxWs
    */
    exports.FsxWs.prototype.readNavigraphNavaids = function (type, successfulReadCallback) {
        if (!this.enabled) return;
        if (Object.isNullOrUndefined(type)) return;
        if (Object.isNullOrUndefined(this.aircraftsUrl)) return;
        if (!jQuery.support.cors) alert("jQuery CORS not enabled");

        var me = this;
        var url = this._typeToUrl(type);

        // AJAX call
        $.ajax({
            type: 'GET',
            url: url,
            cache: false,
            async: true,
            crossDomain: true,
            dataType: "text",
            success: function (data, status) {
                if (!String.isNullOrEmpty(data)) {
                    switch (type) {
                        case vd.entity.FsxWs.Navaids:
                            me._parseNavaids(data);
                            break;
                        default:
                    }
                    if (!Object.isNullOrUndefined(successfulReadCallback)) successfulReadCallback();
                } else {
                    globals.log.info("FsxWs navaids read, but no data. Status: " + status + ". Url: " + url);
                }
            },
            error: function (xhr, textStatus, errorThrown) {
                var errorMsg = String.isNullOrEmpty(errorThrown.message) ? "N/A" : errorThrown.message;
                var msg = "FsxWs navaids cannot be loaded, status: \"" + textStatus + "\". Error: \"" + errorMsg + "\". URL: " + url;
                globals.log.info(msg);
            }
        });
    };

    /**
    * Type to URL.
    * @param {Number} type
    * @return {String} url
    * @private
    */
    exports.FsxWs.prototype._typeToUrl = function (type) {
        var url = this.serverUrl;
        switch (type) {
            case vd.entity.FsxWs.Navaids:
                url += "/NavData/wpnavaid.txt";
                break;
            case vd.entity.FsxWs.Airports:
                url += "/NavData/airports.dat";
                break;
            default:
                url = null;
        }
        return url;
    };

    /**
    * Are Navaids available?
    * @return {Boolean} navaids
    */
    exports.FsxWs.prototype.hasNavaids = function () {
        return !Array.isNullOrEmpty(this.navaids);
    };

    /**
    * Parse Navaids.
    * @param {String} data
    * @private
    */
    exports.FsxWs.prototype._parseNavaids = function (data) {
        if (!Array.isNullOrEmpty(this.navaids)) vd.entity.base.BaseEntityModel.dispose(this.navaids);
        this.navaids = new Array();
        var lines = data.split("\n");
        // parse each line
        var name;
        var callsign;
        var type;
        var lat, lng;
        var frequency;
        var whatIsThis;
        var navaid;
        var navaidProps;
        for (var l = 0, len = lines.length; l < len; l++) {
            var line = lines[l];
            line = line.trim();
            if (String.isNullOrEmpty(line) || line.startsWith(";")) continue; // empty line or comment
            if (line.length < 61) continue;

            // Format   1         2         3         4         5         6
            // 1234567890123456789012345678901234567890123456789012345678901
            // MARAMBIO                MBI  VORD-64.234722 -56.620000117.90H
            // ISLA REY JORGE          IRJ  NDB -62.199444 -58.961389360.00N
            name = line.substr(0, 24).trim();
            callsign = line.substr(24, 5).trim();
            type = line.substr(29, 4).trim();
            lat = (line.substr(33, 10).trim()) * 1;
            lng = (line.substr(44, 10).trim()) * 1;
            frequency = (line.substr(54, 6).trim()) * 1;
            if (type === "NDB") frequency = frequency / 1000;
            whatIsThis = line.substr(60, 1);
            navaidProps = {
                "latitude": lat,
                "longitude": lng,
                "callsign": callsign,
                "frequency": frequency,
                "name": name,
                "type": type,
                "dunno": whatIsThis
            };
            navaid = new vd.entity.Navaid(navaidProps);
            this.navaids.push(navaid);
        }
    };
});