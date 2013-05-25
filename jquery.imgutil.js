/*! jQuery.imgUtil (https://github.com/Takazudo/jQuery.imgUtil)
 * lastupdate: 2013-05-25
 * version: 0.5.0
 * author: 'Takazudo' Takeshi Takatsudo <takazudo@gmail.com>
 * License: MIT */
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

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
    ns.calcStylesToBeContainedInRect = (function() {
      var defaults;
      defaults = {
        imgWidth: null,
        imgHeight: null,
        rectWidth: null,
        rectHeight: null
      };
      return function(options) {
        var o, ret;
        o = $.extend({}, defaults, options);
        ret = {};
        if (o.imgWidth < o.rectWidth) {
          ret.left = Math.floor((o.rectWidth - o.imgWidth) / 2);
        } else {
          ret.left = 0;
        }
        if (o.imgHeight < o.rectHeight) {
          ret.top = Math.floor((o.rectHeight - o.imgHeight) / 2);
        } else {
          ret.top = 0;
        }
        return ret;
      };
    })();
    ns.calcRectContainImgWH = (function() {
      var defaults, enlargeImgWH;
      enlargeImgWH = function(options) {
        options.imgWidth = options.imgWidth * 100;
        options.imgHeight = options.imgHeight * 100;
        return options;
      };
      defaults = {
        imgWidth: null,
        imgHeight: null,
        rectWidth: null,
        rectHeight: null,
        enlargeSmallImg: true
      };
      return function(options) {
        var o, shrinkRateH, shrinkRateW;
        o = $.extend({}, defaults, options);
        if (o.enlargeSmallImg) {
          o = enlargeImgWH(o);
        }
        if ((o.imgWidth < o.rectWidth) && (o.imgHeight < o.rectHeight)) {
          return {
            width: o.imgWidth,
            height: o.imgHeight
          };
        }
        shrinkRateW = o.rectWidth / o.imgWidth;
        shrinkRateH = o.rectHeight / o.imgHeight;
        if (shrinkRateW < shrinkRateH) {
          return {
            width: o.rectWidth,
            height: Math.ceil(o.imgHeight * shrinkRateW)
          };
        }
        if (shrinkRateW > shrinkRateH) {
          return {
            width: Math.ceil(o.imgWidth * shrinkRateH),
            height: o.rectHeight
          };
        }
        if (shrinkRateW === shrinkRateH) {
          return {
            width: o.imgWidth * shrinkRateW,
            height: o.imgHeight * shrinkRateH
          };
        }
      };
    })();
    ns.calcStylesToCoverRect = (function() {
      var defaults;
      defaults = {
        imgWidth: null,
        imgHeight: null,
        rectWidth: null,
        rectHeight: null
      };
      return function(options) {
        var o, ret;
        o = $.extend({}, defaults, options);
        ret = {};
        if (o.imgWidth > o.rectWidth) {
          ret.left = -1 * (Math.floor((o.imgWidth - o.rectWidth) / 2));
        } else {
          ret.left = 0;
        }
        if (o.imgHeight > o.rectHeight) {
          ret.top = -1 * (Math.floor((o.imgHeight - o.rectHeight) / 2));
        } else {
          ret.top = 0;
        }
        return ret;
      };
    })();
    ns.calcRectCoverImgWH = (function() {
      var defaults;
      defaults = {
        imgWidth: null,
        imgHeight: null,
        rectWidth: null,
        rectHeight: null
      };
      return function(options) {
        var o, res, tryToFitH, tryToFitW;
        o = $.extend({}, defaults, options);
        tryToFitW = function() {
          var adjustedH, shrinkRatio;
          shrinkRatio = o.rectWidth / o.imgWidth;
          adjustedH = Math.floor(shrinkRatio * o.imgHeight);
          if (adjustedH < o.rectHeight) {
            return false;
          }
          return {
            width: o.rectWidth,
            height: adjustedH
          };
        };
        tryToFitH = function() {
          var adjustedW, shrinkRatio;
          shrinkRatio = o.rectHeight / o.imgHeight;
          adjustedW = Math.floor(shrinkRatio * o.imgWidth);
          if (adjustedW < o.rectWidth) {
            return false;
          }
          return {
            width: adjustedW,
            height: o.rectHeight
          };
        };
        res = tryToFitW();
        if (res === false) {
          res = tryToFitH();
          if (res === false) {
            res.width = o.rectWidth;
            res.height = o.rectHeight;
          }
        }
        return res;
      };
    })();
    ns.AbstractImgRectFitter = (function() {

      function AbstractImgRectFitter() {
        var data, src;
        src = this.$el.attr(this.options.attr_src);
        if (src) {
          this.options.src = src;
        }
        if (this.options.oninit) {
          data = {
            el: this.$el
          };
          this.options.oninit(data);
        }
        this._doFirstRefresh();
      }

      AbstractImgRectFitter.prototype._doFirstRefresh = function() {
        var _this = this;
        this._stillLoadingImg = true;
        this._calcNaturalImgWH().done(function() {
          _this._stillLoadingImg = false;
          return _this.refresh();
        });
        return this;
      };

      AbstractImgRectFitter.prototype._calcNaturalImgWH = function() {
        var defer, fail, success,
          _this = this;
        defer = $.Deferred();
        success = function(origWH, $img) {
          _this.originalImgWidth = origWH.width;
          _this.originalImgHeight = origWH.height;
          if (_this.options.cloneImg) {
            $img = $img.clone();
          }
          _this.$img = $img;
          defer.resolve();
        };
        fail = function() {
          if (_this.options.onfail) {
            _this.options.onfail();
          }
          defer.reject();
        };
        ns.calcNaturalWH(this.options.src).then(success, fail);
        return defer.promise();
      };

      AbstractImgRectFitter.prototype._putImg = function($img) {
        if (this.options.overrideImgPut) {
          this.options.overrideImgPut(this.$el, $img);
        } else {
          this.$el.empty().append($img);
        }
        return this;
      };

      AbstractImgRectFitter.prototype._finalizeImg = function(styles) {
        var $img, $imgInside;
        if (this.options.useNewImgElOnRefresh) {
          $img = this.$img.clone();
          $img.css(styles);
          this._putImg($img);
        } else {
          this.$img.css(styles);
          $imgInside = this.$el.find('img');
          if ($imgInside.length === 0) {
            this._putImg(this.$img);
          }
        }
        return this;
      };

      return AbstractImgRectFitter;

    })();
    ns.ImgCoverRect = (function(_super) {

      __extends(ImgCoverRect, _super);

      ImgCoverRect.defaults = {
        src: null,
        oninit: null,
        onfail: null,
        cloneImg: true,
        useNewImgElOnRefresh: false,
        attr_src: 'data-imgcoverrect-src',
        overrideImgPut: null
      };

      function ImgCoverRect($el, options) {
        this.$el = $el;
        this.options = $.extend({}, ns.ImgCoverRect.defaults, options);
        ImgCoverRect.__super__.constructor.apply(this, arguments);
      }

      ImgCoverRect.prototype.refresh = function() {
        var adjustedWH, otherStyles, styles;
        if (this._stillLoadingImg === true) {
          return;
        }
        this.rectWidth = this.$el.width();
        this.rectHeight = this.$el.height();
        adjustedWH = ns.calcRectCoverImgWH({
          imgWidth: this.originalImgWidth,
          imgHeight: this.originalImgHeight,
          rectWidth: this.rectWidth,
          rectHeight: this.rectHeight
        });
        styles = {
          width: adjustedWH.width,
          height: adjustedWH.height
        };
        otherStyles = ns.calcStylesToCoverRect({
          imgWidth: adjustedWH.width,
          imgHeight: adjustedWH.height,
          rectWidth: this.rectWidth,
          rectHeight: this.rectHeight
        });
        styles = $.extend(styles, otherStyles);
        this._finalizeImg(styles);
        return this;
      };

      return ImgCoverRect;

    })(ns.AbstractImgRectFitter);
    (function() {
      var dataKey;
      dataKey = 'imgcoverrect';
      $.fn.imgCoverRect = function(options) {
        return this.each(function(i, el) {
          var $el;
          $el = $(el);
          return $el.data(dataKey, new ns.ImgCoverRect($el, options));
        });
      };
      return $.fn.refreshImgCoverRect = function() {
        return this.each(function(i, el) {
          var $el, instance;
          $el = $(el);
          instance = $el.data(dataKey);
          if (!instance) {
            return;
          }
          return instance.refresh();
        });
      };
    })();
    ns.ImgContainRect = (function(_super) {

      __extends(ImgContainRect, _super);

      ImgContainRect.defaults = {
        src: null,
        oninit: null,
        onfail: null,
        cloneImg: true,
        enlargeSmallImg: true,
        useNewImgElOnRefresh: false,
        attr_src: 'data-imgcontainrect-src',
        overrideImgPut: null
      };

      function ImgContainRect($el, options) {
        this.$el = $el;
        this.options = $.extend({}, ns.ImgContainRect.defaults, options);
        ImgContainRect.__super__.constructor.apply(this, arguments);
      }

      ImgContainRect.prototype.refresh = function() {
        var adjustedWH, otherStyles, styles;
        if (this._stillLoadingImg === true) {
          return;
        }
        this.rectWidth = this.$el.width();
        this.rectHeight = this.$el.height();
        adjustedWH = ns.calcRectContainImgWH({
          imgWidth: this.originalImgWidth,
          imgHeight: this.originalImgHeight,
          rectWidth: this.rectWidth,
          rectHeight: this.rectHeight
        });
        styles = {
          width: adjustedWH.width,
          height: adjustedWH.height
        };
        otherStyles = ns.calcStylesToBeContainedInRect({
          imgWidth: adjustedWH.width,
          imgHeight: adjustedWH.height,
          rectWidth: this.rectWidth,
          rectHeight: this.rectHeight
        });
        styles = $.extend(styles, otherStyles);
        this._finalizeImg(styles);
        return this;
      };

      return ImgContainRect;

    })(ns.AbstractImgRectFitter);
    (function() {
      var dataKey;
      dataKey = 'imgcontainrect';
      $.fn.imgContainRect = function(options) {
        return this.each(function(i, el) {
          var $el;
          $el = $(el);
          return $el.data(dataKey, new ns.ImgContainRect($el, options));
        });
      };
      return $.fn.refreshImgContainRect = function() {
        return this.each(function(i, el) {
          var $el, instance;
          $el = $(el);
          instance = $el.data(dataKey);
          if (!instance) {
            return;
          }
          return instance.refresh();
        });
      };
    })();
    return $.imgUtil = ns;
  })(jQuery, window, document);

}).call(this);
