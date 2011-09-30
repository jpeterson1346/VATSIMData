/**
* String starting with given String?
* @param {String} prefix
* @return {Boolean}
*/
String.prototype.startsWith = function(prefix) {
    return this.indexOf(prefix) === 0;
};

/**
* String ending with given String?
* @param {String} suffix
* @return {Boolean}
*/
String.prototype.endsWith = function(suffix) {
    return this.match(suffix + "$") == suffix;
};

/**
* Append String if this string is not empty.
* @param {String} append String being checked and appended
*/
String.prototype.appendIfThisIsNotEmpty = function(append) {
    if (String.isNullOrEmpty(this) || String.isNullOrEmpty(append)) return this;
    return this + append;
};

/**
* String to Array of characters.
* @return {Array}
*/
String.prototype.toCharacters = function() {
    if (this.length < 1) return new Array();
    return this.split("");
};

/**
* String to array of character codes.
* @param {Boolean} [withCharInfo] returns the character itself and its code
* @return {Array}
*/
String.prototype.toCharacterCodes = function(withCharInfo) {
    var codes = new Array();
    withCharInfo = Object.ifNotNullOrUndefined(withCharInfo, false);
    if (this.length < 1) return codes;
    for (var i = 0, len = this.length; i < len; i++) {
        if (withCharInfo)
            codes.push(this[i] + ":" + this.charCodeAt(i));
        else
            codes.push(this.charCodeAt(i));
    }
    return codes;
};

/**
* Is the Object a string?
* @param {Object} candidate
* @return {Boolean}
*/
String.isString = function(candidate) {
    if (Object.isNullOrUndefined(candidate)) return false;
    return (typeof(candidate) == "string" || candidate.constructor == String);
};

/**
* Get string from (character) array.
* @return {String}
*/
String.fromArray = function(arr) {
    if (Array.isNullOrEmpty(arr)) return "";
    return arr.join("");
};

/**
* Strip number - find the first number and return it.
* @return {Number}
*/
String.prototype.stripNumber = function() {
    var m = this.match( /\d+/ );
    if (Array.isNullOrEmpty(m)) return null;
    return m[0];
};

/**
* Internationalized string to its best equivalent in latin characters. Requires
* the latin conversion table.
* @return {String}
* @see <a href="http://semplicewebsites.com/removing-accents-javascript">Latin map</a>
*/
String.prototype.latinise = function() {
    return this.replace( /[^A-Za-z0-9]/g , function(x) { return String.latin_map[x] || x; });
};

/**
* Is latin String?
* @return {Booelan}
*/
String.prototype.isLatin = function() {
    return this == this.latinise();
};

/**
* Remove non ASCII characters.
* @return {String}
*/
String.prototype.ascii = function() {
    return this.replace( /[^\u0000-\u007F]/g , "");
};

/**
* Append String / Array if not null/undefined/empty.
* @param {String|Array} append String being checked and appended
* @param {String} [separator]
*/
String.prototype.appendIfNotEmpty = function(append, separator) {
    if (Object.isNullOrUndefined(append)) return this;
    if (append instanceof Array) {
        var st = this;
        for (var a = 0, len = append.length; a < len; a++) {
            var s = append[a];
            st = st.appendIfNotEmpty(s, separator);
        }
        return st;
    } else {
        if (String.isNullOrEmpty(append)) return this;
        separator = Object.ifNotNullOrUndefined(separator, "");
        return (String.isNullOrEmpty(separator)) ? this + append : this + separator + append;
    }
};

/**
* Is the current char a whitespace?
* @return {Boolean}
*/
String.prototype.isWhitespace = function() {
    if (this.length != 1) return false;
    // http://stackoverflow.com/questions/1496826/check-if-a-single-character-is-a-whitespace
    return /\s/ .test(this);
};

/**
* Is the current char a line break?
* @return {Boolean}
*/
String.prototype.isLinebreak = function() {
    return "\n" == this;
};

/**
* Is candidate null or empty.
* @param {String} candidate
* @return {Boolean}
*/
String.isNullOrEmpty = function(candidate) {
    if (Object.isNullOrUndefined(candidate)) return true;
    // literals ain't 
    // http: //stackoverflow.com/questions/203739/why-does-instanceof-return-false-for-some-literals
    if (candidate instanceof String || candidate.constructor == String) return candidate.length < 1;
    if (candidate instanceof Number || candidate.constructor == Number) return false;
    return true;
};

/**
* To number or failure value.
* @param {String} candidate
* @param {Object} failureValue
* @param {Number} digits
* @return {Number} candidate as Number or failureValue
*/
String.toNumber = function(candidate, failureValue, digits) {
    if (Object.isNullOrUndefined(candidate) || "" == candidate) return failureValue;
    if (isNaN(candidate)) return failureValue;
    var n = candidate * 1;
    if (Object.isNullOrUndefined(digits)) return n;
    return n.toFixed(digits) * 1;
};

/**
* Clean up: Trim and remove multiple spaces.
* @return {String} cleaned String
*/
String.prototype.cleanUp = function() {
    var ns = jQuery.trim(this);
    return ns.replace( / +(?= )/g , '');
};

/**
* Add leading characters
* @return {String} string with leading characters, e.g. "12" -> "00012"
*/
String.prototype.leading = function(length, leadingChar) {
    if (this.length >= length) return this;
    var diff = length - this.length;
    var s = leadingChar.multiply(diff) + this;
    return s;
};

/**
* Multiplies a string n times.
* @param  {Number} times
* @return {String}
*/
String.prototype.multiply = function(times) {
    if (times == 1) return this;
    if (times == 0) return "";
    var str = this;
    var acc = [];
    for (var i = 0; (1 << i) <= times; i++) {
        if ((1 << i) & times)
            acc.push(str);
        str += str;
    }
    return acc.join("");
};

/**
* Index for regular expression. 
* @param {Regular Expression} regex
* @param {Number} startpos
* @return {Number}
* @see <a href="http://stackoverflow.com/questions/273789/is-there-a-version-of-javascripts-string-indexof-that-allows-for-regular-expre">Based on</a>
*/
String.prototype.regexIndexOf = function(regex, startpos) {
    var indexOf = this.substring(startpos || 0).search(regex);
    return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
};

/**
* Last index for regular expression. 
* @param {Regular Expression} regex
* @param {Number} startpos
* @return {Number}
* @see <a href="http://stackoverflow.com/questions/273789/is-there-a-version-of-javascripts-string-indexof-that-allows-for-regular-expre">Based on</a>
*/
String.prototype.regexLastIndexOf = function(regex, startpos) {
    regex = (regex.global) ? regex : new RegExp(regex.source, "g" + (regex.ignoreCase ? "i" : "") + (regex.multiLine ? "m" : ""));
    if (typeof(startpos) == "undefined") {
        startpos = this.length;
    } else if (startpos < 0) {
        startpos = 0;
    }
    var stringToWorkWith = this.substring(0, startpos + 1);
    var lastIndexOf = -1;
    var nextStop = 0;
    var result;
    while ((result = regex.exec(stringToWorkWith)) != null) {
        lastIndexOf = result.index;
        regex.lastIndex = ++nextStop;
    }
    return lastIndexOf;
};

/** 
* Is null or undefined?
* @param {Object} candidate
* @return {Boolean}
* @see <a href="http://www.mapbender.org/JavaScript_pitfalls:_null,_false,_undefined,_NaN">Pitfalls</a>
*/
Object.isNullOrUndefined = function(candidate) {
    return (candidate === null || candidate === undefined);
};

/**
* Return respective value depending on candidate.
* @param {Object} candidate
* @param {Object} ifNullValue
* @return {Object} candidate or ifNullValue
*/
Object.ifNotNullOrUndefined = function(candidate, ifNullValue) {
    return Object.isNullOrUndefined(candidate) ? ifNullValue : candidate;
};

/**
* Unlike isNaN also classify null/undefined as NaN.
* @return {Boolean}
*/
Object.isNumber = function(candidate) {
    if (Object.isNullOrUndefined(candidate)) return false;
    if ("" === candidate) return false; // 0 == "" is true
    return !isNaN(candidate);
};

/**
* Is Array null / undefined, or empty?
* @param {Array} arr
* @return {Boolean}
*/
Array.isNullOrEmpty = function(arr) {
    if (Object.isNullOrUndefined(arr)) return true;
    return arr.length < 1;
};

// Convert array values - which represent a number - to type number.
// @param {Array} array
// @returns {Array}
Array.arrayValuesToNumber = function(array) {
    var a = new Array();
    for (var i in array) {
        var v = this[i];
        if (isNaN(v))
            a[i] = v;
        else
            a[i] = v * 1;
    }
    return a;
};

/**
* Remove array value.
* @param {Object} val
*/
Array.prototype.removeByValue = function(val) {
    for (var i = 0; i < this.length; i++) {
        var c = this[i];
        if (c == val || (val.equals && val.equals(c))) {
            this.splice(i, 1);
            break;
        }
    }
};

/**
* Contains array a particular value?
* Supports an existing equals method.
* @param {Object} val
* @returns {Boolean}
*/
Array.prototype.contains = function(val) {
    for (var i = 0; i < this.length; i++) {
        var c = this[i];
        if (c == val || (val.equals && val.equals(c))) {
            return true;
        }
    }
    return false;
};

/**
* Remove array value
* @param {Object} index
*/
Array.prototype.removeByIndex = function(index) {
    this.splice(index, 1);
};

/**
* Append array to the existing array.
* @param {Array} arrays values to be appended
* @param {Boolean} guarantee unique values
*/
Array.prototype.append = function(array, unique) {
    if (Array.isNullOrEmpty(array)) return;
    unique = Object.ifNotNullOrUndefined(unique, false);
    for (var a = 0, len = array.length; a < len; a++) {
        var v = array[a];
        if (!unique)
            this.push(v);
        else {
            var c = this.contains(v);
            if (!c) this.push(v);
        }
    }
};

/**
* Append properties of obj1 and obj2.
* Remark: This is static since changing Object.prototype bears some risk / incompatibilities. 
* @param {Object} obj1
* @param {Object} obj2
*/
Object.appendProperties = function(obj1, obj2) {
    for (var prop in obj2) {
        if (obj2.hasOwnProperty(prop)) {
            obj1[prop] = obj2[prop];
        }
    }
};