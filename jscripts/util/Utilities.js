/**
* @module vd.util
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.util', function(exports) {

    /**
    * Generic utilities.
    * @constructor
    * @author KWB
    */
    exports.Utils = function() {
        // code goes heres
    };

    /**
    * Number to HEX value.
    * @param  {Number} i 
    * @param  {Number} digits
    * @return {String} hex value
    * @static
    */
    exports.Utils.decToHex = function(i, digits) {
        digits = Object.isNullOrUndefined(digits) ? 4 : digits;
        var result = "0000";
        if (i >= 0 && i <= 15) {
            result = "000" + i.toString(16);
        } else if (i >= 16 && i <= 255) {
            result = "00" + i.toString(16);
        } else if (i >= 256 && i <= 4095) {
            result = "0" + i.toString(16);
        } else if (i >= 4096 && i <= 65535) {
            result = i.toString(16);
        }
        return result.toUpperCase().substr(4 - digits, digits);
    };

    /**
    * Numbers to HEX value.
    * @param  {Array}  values 
    * @param  {Number} digits
    * @return {Array}  hex values
    * @static
    */
    exports.Utils.decsToHex = function(values, digits) {
        var r = "";
        for (var i = 0, len = values.length; i < len; i++) {
            r += exports.Utils.decToHex(values[i], digits);
        }
        return r;
    };

    /**
    * Convert a value to a greyscale.
    * @param  {Number} value
    * @param  {maxValue} interval 0-maxValue
    * @return {String} RGB color string, e.g #CCCCCC
    * @static
    */
    exports.Utils.valueToGreyScale = function(value, maxValue) {
        if (value <= 0) return "#FFFFFF";
        if (value >= maxValue) return "#000000";
        var v = 255 - Math.round(value / maxValue * 255);
        var h = vd.util.decToHex(v, 2);
        var r = "#" + h + h + h;
        return r;
    };

    /**
    * Convert a value to a greyscale.
    * @param  {Number} colorH hue
    * @param  {Number} colorS saturation
    * @param  {maxValue} interval 0-maxValue
    * @return {String} RGB color string, e.g #CCCCCC
    * @see <a href="http://stackoverflow.com/questions/1423925/changing-rgb-color-values-to-represent-a-value">Color representation</a>
    * @see http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascriptvar 
    * @static
    */
    exports.Utils.valueToGradient = function(colorH, colorS, value, maxValue) {
        var v = value / maxValue;
        if (v > 1) v = 1;
        if (v < 0) v = 0;
        v = 1 - v;
        var rgb = hsvToRgb(colorH, colorS, v); // HSV is same as HSB
        var r = "#" + exports.Utils.decsToHex(rgb, 2);
        return r;
    };

    /**
    * Return the candidate if valid, otherwise the default.
    * @param {String} colorCandidate
    * @param {String} defaultValue
    * @return {RgbColor}
    * @static
    */
    exports.Utils.getValidColor = function(colorCandidate, defaultValue) {
        if (Object.isNullOrUndefined(colorCandidate)) return defaultValue;
        var c = new RgbColor(colorCandidate);
        return (c.ok) ? c : new RgbColor(defaultValue);
    };

    /**
    * "Fixes" a hex string representing a color, strips hash, toUpperCase()
    * @param {String}  value
    * @param {Boolean} stripHash strip any leading #
    * @return {String}
    * @static
    */
    exports.Utils.fixHexColorValue = function(value, stripHash) {
        var v = value.trim().toUpperCase();
        if (stripHash) v = v.replace(/^#*/, "");
        return v;
    };

    /**
    * Format a string to a given maxWidth by breaking at whitespaces
    * @param {String} str
    * @param {Number} maxWidth
    * @param {String} lineBreak    
    * @static
    */
    exports.Utils.formatToMaxWidth = function(str, maxWidth, lineBreak) {
        if (String.isNullOrEmpty(str) || maxWidth >= str.length) return str;
        lineBreak = String.isNullOrEmpty(lineBreak) ? "\n" : lineBreak;
        var counter = 0;
        var lastWhitespace = 0;
        var codes = str.toCharacters();
        for (var i = 0, len = str.length; i < len; i++) {
            var c = codes[i];
            if (c.isLinebreak()) {
                counter = 0;
            } else if (c.isWhitespace()) {
                lastWhitespace = i;
                counter++;
            } else {
                counter++;
            }
            if (counter > maxWidth && lastWhitespace >= 0) {
                // I can break
                codes[lastWhitespace] = lineBreak;
                counter = i - lastWhitespace;
                lastWhitespace = -1;
            }
        }
        return String.fromArray(codes);
    };

    /**
    * Inherit the prototype methods. Read topics below. If a class inherits overrriden methods,
    * the superclass methods (super.myMethod) will be made available as well.
    * @param {function} subclass
    * @param {function} superclass
    * @param {function} superclassName
    * @see <a href="http://www.crockford.com/javascript/inheritance.html#sugar">Inheritance</a>
    * @see <a href="http://stackoverflow.com/questions/2107556/how-to-inherit-from-a-class-in-javascript/2107586#2107586">Inherit from JS class</a>
    * @static
    */
    exports.Utils.inheritPrototypes = function(subclass, superclass, superclassName) {
        var superclassPrototypes = superclass.prototype;
        if (Object.isNullOrUndefined(subclass.superclasses)) subclass.superclasses = new Array();
        subclass.superclasses[superclassName] = superclass;
        for (var p in superclassPrototypes) {
            var subpt = subclass.prototype[p];
            if (Object.isNullOrUndefined(subpt)) {
                subclass.prototype[p] = superclassPrototypes[p];
            } else {
                var methodName = p + "$" + superclassName;
                subclass.prototype[methodName] = superclassPrototypes[p];
            }
        }
    };

    /**
    * Formatted Date/time now.
    * @return {String} yyyymmddhhmmss[MMM]
    * @static
    */
    exports.Utils.nowFormattedYYYYMMDDhhmm = function(withMilliseconds) {
        var wms = Object.isNullOrUndefined(withMilliseconds) ? false : withMilliseconds;
        var now = new Date();
        var fs = now.getYear();
        fs += (now.getMonth() < 9 ? '0' : '') + (now.getMonth() + 1);
        fs += (now.getDay() < 10 ? '0' : '') + (now.getDay());
        fs += (now.getHours() < 10 ? '0' : '') + (now.getHours());
        fs += (now.getMinutes() < 10 ? '0' : '') + (now.getMinutes());
        fs += (now.getSeconds() < 10 ? '0' : '') + (now.getSeconds());
        if (!wms) return fs;
        fs += ("00" + now.getMilliseconds()).substr(-3);
        return fs;
    };
});