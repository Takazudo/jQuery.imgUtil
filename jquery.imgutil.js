/*! jQuery.imgUtil (https://github.com/Takazudo/jQuery.imgUtil)
 * lastupdate: 2013-05-24
 * version: 0.3.0
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
    ns.ImgCoverRect = (function() {

      ImgCoverRect.defaults = {
        src: null,
        oninit: null,
        onfail: null,
        cloneImg: true
      };

      function ImgCoverRect($el, options) {
        var data, src,
          _this = this;
        this.$el = $el;
        this.options = $.extend(ns.ImgCoverRect.defaults, options);
        src = this.$el.attr('data-imgcoverrect-src');
        if (src) {
          this.options.src = src;
        }
        this.rectWidth = this.$el.width();
        this.rectHeight = this.$el.height();
        if (this.options.oninit) {
          data = {
            rectWidth: this.rectWidth,
            rectHeight: this.rectHeight,
            el: this.$el
          };
          this.options.oninit(data);
        }
        this.loadImg().then(function(origWh, $img) {
          var imgSize, otherStyles, styles;
          imgSize = _this.calcImgSize(origWh);
          otherStyles = _this.calcAdjustStyles(imgSize);
          styles = $.extend(imgSize, otherStyles);
          $img.css(styles);
          _this.$el.empty().append($img);
        }, function() {
          if (_this.options.onfail) {
            _this.options.onfail();
          }
        });
      }

      ImgCoverRect.prototype.loadImg = function() {
        var defer,
          _this = this;
        defer = $.Deferred();
        ns.calcNaturalWH(this.options.src).then(function(origWh, $img) {
          if (_this.options.cloneImg) {
            $img = $img.clone();
          }
          return defer.resolve(origWh, $img);
        }, function() {
          return defer.reject();
        });
        return defer.promise();
      };

      ImgCoverRect.prototype.calcImgSize = function(imgWh) {
        var imgH, imgW, rectH, rectW, res, ret, tryToFitH, tryToFitW;
        ret = {};
        rectW = this.rectWidth;
        rectH = this.rectHeight;
        imgW = imgWh.width;
        imgH = imgWh.height;
        tryToFitW = function() {
          var adjustedH, shrinkRatio;
          shrinkRatio = rectW / imgW;
          adjustedH = Math.floor(shrinkRatio * imgH);
          if (adjustedH < rectH) {
            return false;
          }
          return {
            adjustedImgWidth: rectW,
            adjustedImgHeight: adjustedH
          };
        };
        tryToFitH = function() {
          var adjustedW, shrinkRatio;
          shrinkRatio = rectH / imgH;
          adjustedW = Math.floor(shrinkRatio * imgW);
          if (adjustedW < rectW) {
            return false;
          }
          return {
            adjustedImgWidth: adjustedW,
            adjustedImgHeight: rectH
          };
        };
        res = tryToFitW();
        if (res === false) {
          res = tryToFitH();
        }
        ret.width = res.adjustedImgWidth;
        ret.height = res.adjustedImgHeight;
        return ret;
      };

      ImgCoverRect.prototype.calcAdjustStyles = function(imgSize) {
        var imgH, imgW, rectH, rectW, ret;
        ret = {};
        rectW = this.rectWidth;
        rectH = this.rectHeight;
        imgW = imgSize.width;
        imgH = imgSize.height;
        if (imgW > rectW) {
          ret.left = -1 * (Math.floor((imgW - rectW) / 2));
        }
        if (imgH > rectH) {
          ret.top = -1 * (Math.floor((imgH - rectH) / 2));
        }
        return ret;
      };

      return ImgCoverRect;

    })();
    $.fn.imgCoverRect = function(options) {
      return this.each(function(i, el) {
        var $el;
        $el = $(el);
        return $el.data('imgcoverrect', new ns.ImgCoverRect($el, options));
      });
    };
    ns.ImgContainRect = (function() {

      ImgContainRect.defaults = {
        src: null,
        oninit: null,
        onfail: null,
        cloneImg: true,
        enlargeSmallImg: true
      };

      function ImgContainRect($el, options) {
        var data, src,
          _this = this;
        this.$el = $el;
        this.options = $.extend(ns.ImgContainRect.defaults, options);
        src = this.$el.attr('data-imgcontainrect-src');
        if (src) {
          this.options.src = src;
        }
        this.rectWidth = this.$el.width();
        this.rectHeight = this.$el.height();
        if (this.options.oninit) {
          data = {
            rectWidth: this.rectWidth,
            rectHeight: this.rectHeight,
            el: this.$el
          };
          this.options.oninit(data);
        }
        this.calcImgSize().then(function(res) {
          var $img, otherStyles, styles;
          $img = res.img;
          styles = {
            width: res.width,
            height: res.height
          };
          otherStyles = _this.calcAdjustStyles(styles);
          styles = $.extend(styles, otherStyles);
          $img.css(styles);
          _this.$el.empty().append($img);
        }, function() {
          if (_this.options.onfail) {
            _this.options.onfail();
          }
        });
      }

      ImgContainRect.prototype.calcImgSize = function() {
        var defer, o,
          _this = this;
        defer = $.Deferred();
        o = {
          width: this.rectWidth,
          height: this.rectHeight,
          enlargeSmallImg: true,
          returnClonedImg: this.options.cloneImg
        };
        (ns.calcRectFitImgWH(this.options.src, o)).then(function(res) {
          return defer.resolve(res);
        }, function() {
          return defer.reject();
        });
        return defer.promise();
      };

      ImgContainRect.prototype.calcAdjustStyles = function(imgSize) {
        var imgH, imgW, rectH, rectW, ret;
        ret = {};
        rectW = this.rectWidth;
        rectH = this.rectHeight;
        imgW = imgSize.width;
        imgH = imgSize.height;
        if (imgW < rectW) {
          ret.left = Math.floor((rectW - imgW) / 2);
        }
        if (imgH < rectH) {
          ret.top = Math.floor((rectH - imgH) / 2);
        }
        return ret;
      };

      return ImgContainRect;

    })();
    $.fn.imgContainRect = function(options) {
      return this.each(function(i, el) {
        var $el;
        $el = $(el);
        return $el.data('imgcontainrect', new ns.ImgContainRect($el, options));
      });
    };
    return $.imgUtil = ns;
  })(jQuery, window, document);

}).call(this);
