  /*------------------------------ LANG: NUMBER ------------------------------*/

  (function(plugin) {
    var pad    = '000000',
     __toFixed = 0..toFixed,
     __abs     = Math.abs,
     __ceil    = Math.ceil,
     __floor   = Math.floor,
     __round   = Math.round;

    plugin.abs = function abs() {
      return fuse.Number(__abs(this));
    };

    plugin.ceil = function ceil() {
      return fuse.Number(__ceil(this));
    };

    plugin.clone = function clone() {
      return fuse.Number(this);
    };

    plugin.floor = function floor() {
      return fuse.Number(__floor(this));
    };

    plugin.round = function round(fractionDigits) {
      return fuse.Number(fractionDigits
        ? parseFloat(__toFixed.call(this, fractionDigits))
        : __round(this));
    };

    plugin.times = function times(callback, thisArg) {
      var i = -1, length = toInteger(this);
      if (arguments.length == 1) {
        while (++i < length) callback(i, i);
      } else {
        while (++i < length) callback.call(thisArg, i, i);
      }
      return this;
    };

    plugin.toColorPart = function toColorPart() {
      return plugin.toPaddedString.call(this, 2, 16);
    };

    plugin.toPaddedString = function toPaddedString(length, radix) {
      var string = toInteger(this).toString(radix || 10);
      if (length <= string.length) return fuse.String(string);
      if (length > pad.length) pad = Array(length + 1).join('0');
      return fuse.String((pad + string).slice(-length));
    };

    // prevent JScript bug with named function expressions
    var abs =         null,
     ceil =           null,
     clone =          null,
     floor =          null,
     round =          null,
     times =          null,
     toColorPart =    null,
     toPaddedString = null;
  })(fuse.Number.plugin);
