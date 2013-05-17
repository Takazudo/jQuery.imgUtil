# encapsulate plugin
do ($=jQuery, window=window, document=document) ->

  ns = {}

  # ============================================================
  # calcNaturalWH

  do ->

    cache = {} # cache caliculation result

    # prepare holder to caliculation
    $holder = null

    $holderSetup = ->
      $.Deferred (defer) ->
        $ ->
          $holder = $('<div id="calcNaturalWH-tempholder"></div>').css
            position: 'absolute'
            left: '-9999px'
            top: '-9999px'
          $('body').append $holder
          defer.resolve()
      .promise()

    naturalWHDetectable = (img) ->
      if(
        (not img.naturalWidth?) or
        (img.naturalWidth is 0) or
        (not img.naturalHeight?) or
        (img.naturalHeight is 0)
      )
        false
      else
        true

    # try caliculation 10 times if failed.
    # I don't know why but this caliculation fails sometimes.
    # delaying caliculation works well against this
    tryCalc = ($img, src) ->

      $img = $img.clone() # to avoid test style applied here
      img = $img[0]

      defer = $.Deferred()

      res = {}

      # prepare elements
      $img.css(width: 'auto', height: 'auto')
      $div = $('<div></div>').append($img)
      $holder.append $div

      count = 0
      oneTry = ->
        res.width = img.naturalWidth or $img.width()
        res.height = img.naturalHeight or $img.height()
        if(count > 10)
          $div.remove()
          defer.reject()
        else
          if (!res.width or !res.height)
            count++
            (wait 100).done -> oneTry()
          else
            cache[src]
            $div.remove()
            defer.resolve res

      oneTry()

      return defer.promise()

    # main
    ns.calcNaturalWH = $.ImgLoaderNs.createCachedFunction (defer, src) ->
      ($.loadImg src).then ($img) ->
        img = $img[0]
        if not (naturalWHDetectable img)
          $holderSetup().done ->
            (tryCalc $img, src).then (wh) ->
              defer.resolve wh, $img
            , ->
              defer.reject()
        else
          wh =
            width: img.naturalWidth
            height: img.naturalHeight
          cache[src] = wh
          defer.resolve wh, $img
      , ->
        defer.reject()

  # ============================================================
  # calcRectFitImgWH
  
  ns.calcRectFitImgWH = do ->

    bigger = (numA, numB) ->
      return numA  if numA > numB
      numB

    calc = (origW, origH, rectW, rectH) ->

      if (origW < rectW) and (origH < rectH)
        return {
          width: origW
          height: origH
        }

      shrinkRateW = rectW / origW
      shrinkRateH = rectH / origH

      if shrinkRateW < shrinkRateH
        return {
          width: rectW
          height: Math.ceil(origH * shrinkRateW)
        }

      if shrinkRateW > shrinkRateH
        return {
          width: Math.ceil(origW * shrinkRateH)
          height: rectH
        }

      if shrinkRateW is shrinkRateH
        return {
          width: origW * shrinkRateW
          height: origH * shrinkRateH
        }

    enlargeWh = (wh) ->
      return {
        width: wh.width * 100
        height: wh.height * 100
      }

    return (imgsrc, options) ->

      o = $.extend
        width: null
        height: null
        enlargeSmallImg: true # allow bigger value than original size or not
        returnClonedImg: true
      , options

      defer = $.Deferred()

      success = (origWh, $img) ->
        if o.enlargeSmallImg
          origWh = enlargeWh(origWh)
        if o.returnClonedImg
          $img = $img.clone()
        res = calc(origWh.width, origWh.height, o.width, o.height)
        defer.resolve
          width: res.width
          height: res.height
          img: $img

      fail = ->
        defer.reject()

      ns.calcNaturalWH(imgsrc).then success, fail

      return defer.promise()

  # ============================================================
  # globalify

  $.imgUtil = ns
