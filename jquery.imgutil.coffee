# encapsulate plugin
do ($=jQuery, window=window, document=document) ->

  ns = {}

  # ============================================================
  # event module

  class ns.Event

    on: (ev, callback) ->
      @_callbacks = {} unless @_callbacks?
      evs = ev.split(' ')
      for name in evs
        @_callbacks[name] or= []
        @_callbacks[name].push(callback)
      return this

    once: (ev, callback) ->
      @on ev, ->
        @off(ev, arguments.callee)
        callback.apply(@, arguments)
      return this

    trigger: (args...) ->
      ev = args.shift()
      list = @_callbacks?[ev]
      return unless list
      for callback in list
        if callback.apply(@, args) is false
          break
      return this

    off: (ev, callback) ->
      unless ev
        @_callbacks = {}
        return this

      list = @_callbacks?[ev]
      return this unless list

      unless callback
        delete @_callbacks[ev]
        return this

      for cb, i in list when cb is callback
        list = list.slice()
        list.splice(i, 1)
        @_callbacks[ev] = list
        break

      return this

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
  # imgFillRect
  
  class ns.ImgFillRect extends ns.Event

    @defaults =
      src: null
      oninit: null
      onfail: null
      cloneImg: true

    constructor: (@$el, options) ->

      @options = $.extend ns.ImgFillRect.defaults, options

      src = @$el.attr 'data-imgfillrect-src'
      if src
        @options.src = src

      @rectWidth = @$el.width()
      @rectHeight = @$el.height()

      if @options.oninit
        data =
          rectWidth: @rectWidth
          rectHeight: @rectHeight
          el: @$el
        @options.oninit data

      @loadImg().then (origWh, $img) =>
        imgSize = @calcImgSize origWh
        otherStyles = @calcAdjustStyles imgSize
        styles = $.extend imgSize, otherStyles
        $img.css styles
        @$el.empty().append $img
        return
      , =>
        if @options.onfail
          @options.onfail()
        return

    loadImg: ->

      defer = $.Deferred()
      ns.calcNaturalWH(@options.src).then (origWh, $img) =>
        if @options.cloneImg
          $img = $img.clone()
        defer.resolve origWh, $img
      , =>
        defer.reject()
      return defer.promise()

    calcImgSize: (imgWh) ->
      
      ret = {}

      rectW = @rectWidth
      rectH = @rectHeight
      imgW = imgWh.width
      imgH = imgWh.height

      tryToFitW = ->
        shrinkRatio = rectW / imgW
        adjustedH = Math.floor (shrinkRatio * imgH)
        if adjustedH < rectH
          return false
        return {
          adjustedImgWidth: rectW
          adjustedImgHeight: adjustedH
        }
        
      tryToFitH = ->
        shrinkRatio = rectH / imgH
        adjustedW = Math.floor (shrinkRatio * imgW)
        if adjustedW < rectW
          return false
        return {
          adjustedImgWidth: adjustedW
          adjustedImgHeight: rectH
        }

      res = tryToFitW()
      if res is false
        res = tryToFitH()

      ret.width = res.adjustedImgWidth
      ret.height = res.adjustedImgHeight

      return ret

    calcAdjustStyles: (imgSize) ->

      ret = {}
      
      rectW = @rectWidth
      rectH = @rectHeight
      imgW = imgSize.width
      imgH = imgSize.height

      if imgW > rectW
        ret.left = -1 * (Math.floor ((imgW - rectW) / 2))
      if imgH > rectH
        ret.top = -1 * (Math.floor ((imgH - rectH) / 2))

      return ret

  $.fn.imgFillRect = (options) ->
    return @each (i, el) ->
      $el = $(el)
      $el.data 'imgfillrect', (new ns.ImgFillRect $el, options)

  # ============================================================
  # globalify

  $.imgUtil = ns
