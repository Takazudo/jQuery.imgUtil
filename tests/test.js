(function() {
  var ns, wait;

  ns = $.ImgLoaderNs;

  wait = function(time) {
    return $.Deferred(function(defer) {
      return setTimeout(function() {
        return defer.resolve();
      }, time || 300);
    });
  };

  asyncTest('calcNaturalWH - ok', function() {
    expect(3);
    return ($.imgUtil.calcNaturalWH('imgs/1.jpg')).then(function(wh, $img) {
      equal(wh.width, 320, "width caliculated correctly " + wh.width);
      equal(wh.height, 320, "height caliculated correctly " + wh.height);
      return equal($img.attr('src'), 'imgs/1.jpg', 'img element was returned');
    }, function() {
      return ok(false, 'failed');
    }).always(function() {
      return start();
    });
  });

  asyncTest('calcNaturalWH - ng', function() {
    expect(1);
    return ($.imgUtil.calcNaturalWH('nothinghere.jpg')).then(function(wh) {
      return ok(false, 'successed unexpectedly');
    }, function() {
      return ok(true, 'fails when img was 404');
    }).always(function() {
      return start();
    });
  });

  asyncTest('calcNaturalWH - try many at once', function() {
    var deferreds, i, srcs, _i, _j;
    expect(40);
    srcs = [];
    for (i = _i = 1; _i <= 10; i = ++_i) {
      srcs.push("imgs/" + i + ".jpg");
    }
    for (i = _j = 1; _j <= 10; i = ++_j) {
      srcs.push("imgs/" + i + ".jpg");
    }
    deferreds = $.map(srcs, function(src) {
      return ($.imgUtil.calcNaturalWH(src)).then(function(wh) {
        equal(wh.width, 320, "" + src + " width caliculated correctly " + wh.width);
        return equal(wh.height, 320, "" + src + " height caliculated correctly " + wh.height);
      });
    });
    return ($.when.apply(this, deferreds)).always(function() {
      return start();
    });
  });

}).call(this);
