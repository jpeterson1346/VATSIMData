/**
* @module vd.entity
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.entity', function(exports) {

    /**
    * Get icon.
    * @return {String} icon path
    * @private
    */
    exports.Flight.prototype._mapIcon = function() {
        var image;
        var t = Object.ifNotNullOrUndefined(this.aircraft.toUpperCase(), null);
        if (this.isHelicopter()) {
            image = "Helicopter";
        } else {
            image = "AircraftJet";
            if (!String.isNullOrEmpty(t)) {
                if (t.startsWith("F18") || t.startsWith("F16")) {
                    image = "FighterJet";
                } else if (t.startsWith("C172") || t.startsWith("C152")) {
                    image = "GAPlane";
                }
            }
        }

        // default
        if (Object.isNullOrUndefined(image)) return "images/AircraftJetGnd.png";

        // return
        image += this.isGrounded() ? "Gnd.png" : ".png";
        return "images/" + image;
    };

});