/*! jQuery.imgUtil (https://github.com/Takazudo/jQuery.imgUtil)
 * lastupdate: 2013-05-18
 * version: 0.1.0
 * author: 'Takazudo' Takeshi Takatsudo <takazudo@gmail.com>
 * License: MIT */
(function() {

  (function($, window, document) {
    var ns;
    ns = {};
    (function() {
      var $holder, $holderSetup, cache, naturalWHDetectable, tryCalc;
      cache = {};
      $holder = null;
      $holderSetup = function() {
        return $.Deferred(function(defer) {
          return $(function() {
            $holder = $('<div id="calcNaturalWH-tempholder"></div>').css({
              position: 'absolute',
              left: '-9999px',
              top: '-9999px'
            });
            $('body').append($holder);
            return defer.resolve();
          });
        }).promise();
      };
      naturalWHDetectable = function(img) {
        if ((img.naturalWidth == null) || (img.naturalWidth === 0) || (img.naturalHeight == null) || (img.naturalHeight === 0)) {
          return false;
        } else {
          return true;
        }
      };
      tryCalc = function($img, src) {
        var $div, count, defer, img, oneTry, res;
        $img = $img.clone();
        img = $img[0];
        defer = $.Deferred();
        res = {};
        $img.css({
          width: 'auto',
          height: 'auto'
        });
        $div = $('<div></div>').append($img);
        $holder.append($div);
        count = 0;
        oneTry = function() {
          res.width = img.naturalWidth || $img.width();
          res.height = img.naturalHeight || $img.height();
          if (count > 10) {
            $div.remove();
            return defer.reject();
          } else {
            if (!res.width || !res.height) {
              count++;
              return (wait(100)).done(function() {
                return oneTry();
              });
            } else {
              cache[src];
              $div.remove();
              return defer.resolve(res);
            }
          }
        };
        oneTry();
        return defer.promise();
      };
      return ns.calcNaturalWH = $.ImgLoaderNs.createCachedFunction(function(defer, src) {
        return ($.loadImg(src)).then(function($img) {
          var img, wh;
          img = $img[0];
          if (!(naturalWHDetectable(img))) {
            return $holderSetup().done(function() {
              return (tryCalc($img, src)).then(function(wh) {
                return defer.resolve(wh, $img);
              }, function() {
                return defer.reject();
              });
            });
          } else {
            wh = {
              width: img.naturalWidth,
              height: img.naturalHeight
            };
            cache[src] = wh;
            return defer.resolve(wh, $img);
          }
        }, function() {
          return defer.reject();
        });
      });
    })();
    ns.calcRectFitImgWH = (function() {
      var bigger, calc, enlargeWh;
      bigger = function(numA, numB) {
        if (numA > numB) {
          return numA;
        }
        return numB;
      };
      calc = function(origW, origH, rectW, rectH) {
        var shrinkRateH, shrinkRateW;
        if ((origW < rectW) && (origH < rectH)) {
          return {
            width: origW,
            height: origH
          };
        }
        shrinkRateW = rectW / origW;
        shrinkRateH = rectH / origH;
        if (shrinkRateW < shrinkRateH) {
          return {
            width: rectW,
            height: Math.ceil(origH * shrinkRateW)
          };
        }
        if (shrinkRateW > shrinkRateH) {
          return {
            width: Math.ceil(origW * shrinkRateH),
            height: rectH
          };
        }
        if (shrinkRateW === shrinkRateH) {
          return {
            width: origW * shrinkRateW,
            height: origH * shrinkRateH
          };
        }
      };
      enlargeWh = function(wh) {
        return {
          width: wh.width * 100,
          height: wh.height * 100
        };
      };
      return function(imgsrc, options) {
        var defer, fail, o, success;
        o = $.extend({
          width: null,
          height: null,
          enlargeSmallImg: true,
          returnClonedImg: true
        }, options);
        defer = $.Deferred();
        success = function(origWh, $img) {
          var res;
          if (o.enlargeSmallImg) {
            origWh = enlargeWh(origWh);
          }
          if (o.returnClonedImg) {
            $img = $img.clone();
          }
          res = calc(origWh.width, origWh.height, o.width, o.height);
          return defer.resolve({
            width: res.width,
            height: res.height,
            img: $img
          });
        };
        fail = function() {
          return defer.reject();
        };
        ns.calcNaturalWH(imgsrc).then(success, fail);
        return defer.promise();
      };
    })();
    return $.imgUtil = ns;
  })(jQuery, window, document);

}).call(this);
