/**
* @module vd.util
* @license <a href = "http://vatgm.codeplex.com/wikipage?title=Legal">Project site</a>
*/
namespace.module('vd.util', function (exports) {

    /**
    * Web utilities.
    * @constructor
    * @author KWB
    */
    exports.UtilsWeb = function () {
        // code goes here
    };

    /**
    * Get the current page name
    * @return {String} current page name
    */
    exports.UtilsWeb.getPageName = function () {
        var sPath = window.location.pathname;
        var sPage = sPath.substring(sPath.lastIndexOf('/') + 1);
        return sPage;
    };

    /**
    * Replace the current page by newDestination.
    * @param  {String} newDestination
    * @return {String} url
    */
    exports.UtilsWeb.replaceCurrentPage = function (newDestination) {
        var page = vd.util.UtilsWeb.getPageName();
        var nd = newDestination.startsWith("/") ? newDestination.substr(1) : newDestination;
        var url = window.location.toString();
        url = url.replace(page, nd);
        return url;
    };

    /**
    * Replace the current path by newDestination.
    * @param  {String} newDestination
    * @return {String} url
    */
    exports.UtilsWeb.replacePath = function (newDestination) {
        var url = window.location.toString();
        url = url.replace(window.location.pathname, newDestination);
        return url;
    };

    /**
    * Get the selected values.
    * @param  {String|HTMLSelectElement} selectElement
    * @return {Array}
    */
    exports.UtilsWeb.getSelectedValues = function (selectElement) {
        var values = new Array();
        var selectDomElement = exports.UtilsWeb.elementFromStringOrDomElement(selectElement);
        if (Object.isNullOrUndefined(selectDomElement)) return values;
        for (var i = 0; i < selectDomElement.length; ++i) {
            if (selectDomElement.options[i].selected == true)
                values.push(selectDomElement.options[i].value);
        }
        return values;
    };

    /**
    * Get the first selected value.
    * @param  {String|HTMLSelectElement} selectElement
    * @return {Array}
    */
    exports.UtilsWeb.getSelectedValue = function (selectElement) {
        var values = exports.UtilsWeb.getSelectedValues(selectElement);
        return (Array.isNullOrEmpty(values)) ? null : values[0];
    };

    /**
    * Get the selected values.
    * @param {HTMLSelectElement} selectElement
    * @param {String} value to be set value, must be one of the options
    */
    exports.UtilsWeb.selectValue = function (selectElement, value) {
        var selectDomElement = exports.UtilsWeb.elementFromStringOrDomElement(selectElement);
        if (Object.isNullOrUndefined(selectDomElement)) return;
        for (var i = 0; i < selectDomElement.length; ++i) {
            selectDomElement.options[i].selected = (selectDomElement.options[i].value == value);
        }
    };

    /**
    * Unselect all values.
    * @param {String|HTMLSelectElement} selectElement
    */
    exports.UtilsWeb.unselectAllValues = function (selectElement) {
        var selectDomElement = exports.UtilsWeb.elementFromStringOrDomElement(selectElement);
        if (Object.isNullOrUndefined(selectDomElement)) return;
        for (var i = 0; i < selectDomElement.length; i++) {
            selectDomElement.options[i].selected = false;
        }
    };

    /**
    * Add options for select element.
    * @param {String|HTMLSelectElement} selectElement
    * @param {Array} options
    */
    exports.UtilsWeb.selectAddOptions = function (selectElement, options, selectedValue) {
        var selectDomElement = exports.UtilsWeb.elementFromStringOrDomElement(selectElement);
        if (Object.isNullOrUndefined(selectDomElement)) return;
        if (Array.isNullOrEmpty(options)) return;
        for (var i = 0, len = options.length; i < len; i++) {
            var opt = options[i];
            var select = opt == selectedValue;
            var option = new Option(opt, opt, false, select);
            selectDomElement.options[selectDomElement.length] = option;
        }
    };

    /**
    * Local server?
    * @return {Boolean}
    */
    exports.UtilsWeb.isLocalServer = function () {
        var server = window.location.hostname;
        if (server == null) return true;
        server = server.toLowerCase();
        if ("localhost" == server) return true;
        return false;
    };

    /**
    * Replace space by "non breakable" space.
    * @param   {String} content
    * @return {String}
    */
    exports.UtilsWeb.spaceToNbsp = function (content) {
        if (String.isNullOrEmpty(content)) return content;
        return content.replace(/\s/g, "&nbsp;");
    };

    /**
    * Replace space by "non breakable" space.
    * @param   {String} content
    * @return {String}
    */
    exports.UtilsWeb.crToBr = function (content) {
        if (String.isNullOrEmpty(content)) return content;
        return content.replace(/\n/g, "<br/>");
    };

    /**
    * Replace space by "non breakable" space.
    * @param   {String} content
    * @return {String}
    */
    exports.UtilsWeb.cleanUpAndSpaceToNsp = function (content) {
        if (String.isNullOrEmpty(content)) return content;
        return spaceToNbsp(content.cleanUp());
    };

    /**
    * Get the original CSS values instead of values of the element.
    * Does not(!) find values of @media sections!
    * @param {String} ruleSelector
    * @param {String} cssprop
    * @param {String} [styleSheet] Styles.css, MySheet.css
    * @return {String} property of the style
    * @see <a href="http://stackoverflow.com/questions/2226869/css-parser-abstracter-how-to-convert-stylesheet-into-object">CSS parser</a>
    */
    exports.UtilsWeb.getCssStyle = function (ruleSelector, cssprop, styleSheet) {
        for (var c = 0, lenC = document.styleSheets.length; c < lenC; c++) {
            var sheet = document.styleSheets[c];
            if (!String.isNullOrEmpty(styleSheet) &&!String.isNullOrEmpty(sheet.href)) {
                if (!sheet.href.endsWith(styleSheet)) continue; // check on sheet name 
            }
            var rules = sheet.cssRules;
            if (Object.isNullOrUndefined(rules)) continue;
            for (var r = 0, lenR = rules.length; r < lenR; r++) {
                var rule = rules[r];
                if (String.isNullOrEmpty(rule.selectorText)) continue;
                if (rule.selectorText == ruleSelector && rule.style) {
                    var ruleProperty = rule.style[cssprop];
                    return ruleProperty; // rule.cssText;
                }
            }
        }
        return null;
    };

    /**
    * Toogle checkbox with given id.
    * @param {String|HTMLCheckbox} checkbox
    * @return {Boolean} new value
    */
    exports.UtilsWeb.toggleCheckbox = function (checkbox) {
        var el = exports.UtilsWeb.elementFromStringOrDomElement(checkbox);
        if (Object.isNullOrUndefined(el) || Object.isNullOrUndefined(el.checked)) return false;
        el.checked = !el.checked;
        return el.checked;
    };

    /**
    * Toogle checkbox with given id.
    * @param {String|HTMLCheckbox|event} checkbox
    * @return {Boolean} new value
    */
    exports.UtilsWeb.checked = function (checkbox) {
        var el = exports.UtilsWeb.elementFromStringOrDomElement(checkbox);
        if (Object.isNullOrUndefined(el) || Object.isNullOrUndefined(el.checked)) return false;
        return el.checked;
    };

    /**
    * Fixing the id string.
    * @param  {String} id
    * @return {String} fixedId
    * @private
    */
    function fixIdString(id) {
        if (String.isNullOrEmpty(id)) return null;
        return (id.startsWith("#")) ? id.substr(1) : id;
    }

    /**
    * Getting the DOM element by its name or just by itself
    * @param {String|DomElement} stringOrDomElement
    * @return {DomElement}
    */
    exports.UtilsWeb.elementFromStringOrDomElement = function (stringOrDomElement) {
        if (Object.isNullOrUndefined(stringOrDomElement)) return null;
        if (!String.isString(stringOrDomElement)) return stringOrDomElement; // assuming we have DOM already
        return document.getElementById(fixIdString(stringOrDomElement));
    };

    /**
    * Open a new location.
    * @param {String} url
    * @param {Boolean} [newWindow]
    */
    exports.UtilsWeb.newLocation = function (url, newWindow) {
        if (String.isNullOrEmpty(url)) return;
        newWindow = Object.ifNotNullOrUndefined(newWindow, true);
        if (newWindow)
            window.open(url);
        else
            location.href = url;
    };
});