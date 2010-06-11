//Convenience aliases
var undef,
nil = null,
$ = fuse.util.$,
$$ = fuse.util.$$,
$A = fuse.util.$A,
$F = fuse.util.$F,
$H = fuse.util.$H,
$R = fuse.util.$R,
$w = fuse.util.$w;

(function(global){
  function isHostType(object, property){
    /* Taken from FuseJS: a helper method for safely detecting host object properties */
    var type = typeof object[property];
    return type === "object" ? !!object[property] : type !== "boolean" && type !== "number" && type !== "string" && type !== "undefined";
  }
  var getClass = Object.prototype.toString;
  /*if(isHostType(global, "addEventListener")){
    d
  }else if(isHostType(global, "attachEvent")){
    d
  }else{
    global.onload = (function(original){
      if(getClass.call(original) === "[object Function]"){
        return 
      }
    }(global.onload));
  }*/
}(this));