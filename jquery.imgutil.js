/*! jQuery.imgUtil (https://github.com/Takazudo/jQuery.imgUtil)
 * lastupdate: 2013-05-24
 * version: 0.1.0
 * author: 'Takazudo' Takeshi Takatsudo <takazudo@gmail.com>
 * License: MIT */
(function() {
  var __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function($, window, document) {
    var ns;
    ns = {};
    ns.Event = (function() {

      function Event() {}

      Event.prototype.on = function(ev, callback) {
        var evs, name, _base, _i, _len;
        if (this._callbacks == null) {
          this._callbacks = {};
        }
        evs = ev.split(' ');
        for (_i = 0, _len = evs.length; _i < _len; _i++) {
          name = evs[_i];
          (_base = this._callbacks)[name] || (_base[name] = []);
          this._callbacks[name].push(callback);
        }
        return this;
      };

      Event.prototype.once = function(ev, callback) {
        this.on(ev, function() {
          this.off(ev, arguments.callee);
          return callback.apply(this, arguments);
        });
        return this;
      };

      Event.prototype.trigger = function() {
        var args, callback, ev, list, _i, _len, _ref;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        ev = args.shift();
        list = (_ref = this._callbacks) != null ? _ref[ev] : void 0;
        if (!list) {
          return;
        }
        for (_i = 0, _len = list.length; _i < _len; _i++) {
          callback = list[_i];
          if (callback.apply(this, args) === false) {
            break;
          }
        }
        return this;
      };

      Event.prototype.off = function(ev, callback) {
        var cb, i, list, _i, _len, _ref;
        if (!ev) {
          this._callbacks = {};
          return this;
        }
        list = (_ref = this._callbacks) != null ? _ref[ev] : void 0;
        if (!list) {
          return this;
        }
        if (!callback) {
          delete this._callbacks[ev];
          return this;
        }
        for (i = _i = 0, _len = list.length; _i < _len; i = ++_i) {
          cb = list[i];
          if (!(cb === callback)) {
            continue;
          }
          list = list.slice();
          list.splice(i, 1);
          this._callbacks[ev] = list;
          break;
        }
        return this;
      };

      return Event;

    })();
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
    ns.ImgFillRect = (function(_super) {

      __extends(ImgFillRect, _super);

      ImgFillRect.defaults = {
        src: null,
        oninit: null,
        onfail: null,
        cloneImg: true
      };

      function ImgFillRect($el, options) {
        var data, src,
          _this = this;
        this.$el = $el;
        this.options = $.extend(ns.ImgFillRect.defaults, options);
        src = this.$el.attr('data-imgfillrect-src');
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

      ImgFillRect.prototype.loadImg = function() {
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

      ImgFillRect.prototype.calcImgSize = function(imgWh) {
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

      ImgFillRect.prototype.calcAdjustStyles = function(imgSize) {
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

      return ImgFillRect;

    })(ns.Event);
    $.fn.imgFillRect = function(options) {
      return this.each(function(i, el) {
        var $el;
        $el = $(el);
        return $el.data('imgfillrect', new ns.ImgFillRect($el, options));
      });
    };
    return $.imgUtil = ns;
  })(jQuery, window, document);

}).call(this);
