  /*------------------------------ LANG: NUMBER ------------------------------*/

  /* create shared pseudo private props */

  fuse._.pad = '000000';

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    function abs() {
      return abs[ORIGIN].Number(Math.abs(this));
    }

    function ceil() {
      return ceil[ORIGIN].Number(Math.ceil(this));
    }

    function clone() {
      return clone[ORIGIN].Number(this);
    }

    function floor() {
      return floor[ORIGIN].Number(Math.floor(this));
    }

    function round(fractionDigits) {
      return round[ORIGIN].Number(fractionDigits
        ? parseFloat(0..toFixed.call(this, fractionDigits))
        : Math.round(this));
    }

    function times(callback, thisArg) {
      var i = -1, length = fuse._.toInteger(this);
      if (arguments.length == 1) {
        while (++i < length) callback(i, i);
      } else {
        while (++i < length) callback.call(thisArg, i, i);
      }
      return this;
    }

    function toColorPart() {
      return toColorPart[ORIGIN].Number.toPaddedString(this, 2, 16);
    }

    function toPaddedString(length, radix) {
      var origin = toPaddedString[ORIGIN], p = fuse._,
       string = p.toInteger(this).toString(radix || 10);

      if (length <= string.length) return origin.String(string);
      if (length > p.pad.length) p.pad = Array(length + 1).join('0');
      return origin.String((p.pad + string).slice(-length));
    }

    /*------------------------------------------------------------------------*/

    plugin.times = times;

    (plugin.abs   = abs)[ORIGIN]   =
    (plugin.ceil  = ceil)[ORIGIN]  =
    (plugin.clone = clone)[ORIGIN] =
    (plugin.floor = floor)[ORIGIN] =
    (plugin.round = round)[ORIGIN] =
    (plugin.toColorPart = toColorPart)[ORIGIN] =
    (plugin.toPaddedString = toPaddedString)[ORIGIN] = fuse;

  })(fuse.Number.plugin);
