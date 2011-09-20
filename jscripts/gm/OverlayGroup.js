/**
* @module vd.gm
*/
namespace.module('vd.gm', function(exports, require) {

    /**
    * @constructor
    * @classdesc Consists of 0..n Google Map overlay elements.
    * @param {String} name: name of the group
    * @param {google.maps.Map} map
    */
    exports.OverlayGroup = function(name, map) {
        this.name = name;
        this.map = map;
        this.elements = new Array();
    };

    /**
    * Add an element to the group
    * @param {Object}  overlayElement
    * @param {Object} [element2] optional element
    * @param {Object} [element3] optional element
    */
    exports.OverlayGroup.prototype.add = function(overlayElement, element2, element3) {
        if (overlayElement && !this.elements.contains(overlayElement)) this.elements.push(overlayElement);
        if (element2 && !this.elements.contains(element2)) this.elements.push(element2);
        if (element3 && !this.elements.contains(element3)) this.elements.push(element3);
    };

    /**
    * Show or hide the elements by assigning the map.
    * @param {Boolean} display
    */
    exports.OverlayGroup.prototype.display = function(display) {
        var m = display ? this.map : null;
        for (var i = 0, len = this.elements.length; i < len; i++) {
            var e = this.elements[i];
            if (e.map != m) e.setMap(m);
        }
    };

    /**
    * Clear this group, before hiding all elements.
    */
    exports.OverlayGroup.prototype.clear = function() {
        this.display(false);
        this.elements = new Array();
    };

    /**
    * Remove the given overlay.
    * @param {Overlay} overlay
    */
    exports.OverlayGroup.prototype.remove = function(overlay) {
        if (Object.isNullOrUndefined(overlay)) return;
        var index = -1;
        for (var i = 0, len = this.elements.length; i < len; i++) {
            var e = this.elements[i];
            if (e == overlay) {
                e.setMap(null);
                index = i;
            }
        }
        // do not remove within loop
        if (index >= 0) this.elements.removeByIndex(index);
    };

    /**
    * Remove another overlay group.
    * @param {vd.gm.OverlayGroup} overlayGroup
    */
    exports.OverlayGroup.prototype.removeOverlayGroup = function(overlayGroup) {
        if (this.isEmpty() || Object.isNullOrUndefined(overlayGroup) || overlayGroup.isEmpty()) return;
        for (var i in overlayGroup) {
            var o = overlayGroup.elements[i];
            this.remove(o);
        }
    };

    /**
    * Is the group empty?
    * @param {Overlay} overlay
    */
    exports.OverlayGroup.prototype.isEmpty = function() {
        return this.elements.length == 0;
    };
});