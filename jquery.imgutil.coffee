# encapsulate plugin
do ($=jQuery, window=window, document=document) ->

  ns = {}
  
  # ============================================================
  # utility
  # http://msdn.microsoft.com/ja-jp/scriptjunkie/gg723713.aspx
  # by caching deferreds, 'fetchImg' does not throw multiple request about one src
  # to wait the first img's loading.

  ns.createCachedFunction = (requestedFunction) ->
    cache = {}
    (key, options) ->
      if(!cache[key])
        cache[key] = $.Deferred (defer) ->
          requestedFunction defer, key, options
        .promise()
      cache[key]

  # ============================================================
  # loadImg

  ns.loadImg = (src) ->
  
    defer = $.Deferred()
    img = new Image
    
    cleanUp = ->
      img.onload = img.onerror = null

    img.onload = ->
      cleanUp()
      defer.resolve $(img)

    img.onerror = ->
      cleanUp()
      defer.reject $(img)

    img.src = src
    defer.promise()

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
            setTimeout ->
              oneTry()
            , 100
          else
            cache[src]
            $div.remove()
            defer.resolve res

      oneTry()

      return defer.promise()

    # main
    ns.calcNaturalWH = ns.createCachedFunction (defer, src) ->
      (ns.loadImg src).then ($img) ->
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
  # calcStylesToBeContainedInRect

  ns.calcStylesToBeContainedInRect = do ->

    defaults =
      imgWidth: null
      imgHeight: null
      rectWidth: null
      rectHeight: null

    return (options) ->

      o = $.extend {}, defaults, options
      ret = {}

      if o.imgWidth < o.rectWidth
        ret.left = Math.floor ((o.rectWidth - o.imgWidth) / 2)
      else
        ret.left = 0
      if o.imgHeight < o.rectHeight
        ret.top = Math.floor ((o.rectHeight - o.imgHeight) / 2)
      else
        ret.top = 0
      
      return ret

  # ============================================================
  # calcRectContainImgWH

  ns.calcRectContainImgWH = do ->

    # utils
    
    enlargeImgWH = (options) ->
      options.imgWidth = options.imgWidth * 100
      options.imgHeight = options.imgHeight * 100
      return options

    # options

    defaults =
      imgWidth: null
      imgHeight: null
      rectWidth: null
      rectHeight: null
      enlargeSmallImg: true

    # main

    return (options) ->

      o = $.extend {}, defaults, options

      if o.enlargeSmallImg
        o = enlargeImgWH o

      if (o.imgWidth < o.rectWidth) and (o.imgHeight < o.rectHeight)
        return {
          width: o.imgWidth
          height: o.imgHeight
        }

      shrinkRateW = o.rectWidth / o.imgWidth
      shrinkRateH = o.rectHeight / o.imgHeight

      if shrinkRateW < shrinkRateH
        return {
          width: o.rectWidth
          height: Math.ceil(o.imgHeight * shrinkRateW)
        }

      if shrinkRateW > shrinkRateH
        return {
          width: Math.ceil(o.imgWidth * shrinkRateH)
          height: o.rectHeight
        }

      if shrinkRateW is shrinkRateH
        return {
          width: o.imgWidth * shrinkRateW
          height: o.imgHeight * shrinkRateH
        }
    

  # ============================================================
  # calcStylesToCoverRect

  ns.calcStylesToCoverRect = do ->

    defaults =
      imgWidth: null
      imgHeight: null
      rectWidth: null
      rectHeight: null

    return (options) ->

      o = $.extend {}, defaults, options
      ret = {}
      
      if o.imgWidth > o.rectWidth
        ret.left = -1 * (Math.floor ((o.imgWidth - o.rectWidth) / 2))
      else
        ret.left = 0
      if o.imgHeight > o.rectHeight
        ret.top = -1 * (Math.floor ((o.imgHeight - o.rectHeight) / 2))
      else
        ret.top = 0

      return ret

  # ============================================================
  # calcRectCoverImgWH

  ns.calcRectCoverImgWH = do ->

    defaults =
      imgWidth: null
      imgHeight: null
      rectWidth: null
      rectHeight: null

    return (options) ->

      o = $.extend {}, defaults, options

      tryToFitW = ->
        shrinkRatio = o.rectWidth / o.imgWidth
        adjustedH = Math.floor (shrinkRatio * o.imgHeight)
        if adjustedH < o.rectHeight
          return false
        return {
          width: o.rectWidth
          height: adjustedH
        }
        
      tryToFitH = ->
        shrinkRatio = o.rectHeight / o.imgHeight
        adjustedW = Math.floor (shrinkRatio * o.imgWidth)
        if adjustedW < o.rectWidth
          return false
        return {
          width: adjustedW
          height: o.rectHeight
        }

      res = tryToFitW()
      if res is false
        res = tryToFitH()
        if res is false
          res.width = o.rectWidth
          res.height = o.rectHeight

      return res
      
  # ============================================================
  # calcEdgeFitImgWH

  ns.calcEdgeFitImgWH = do ->

    defaults =
      edge: null # 'left' or 'right' or 'top' or 'bottom'
      imgWidth: null
      imgHeight: null
      rectWidth: null
      rectHeight: null

    return (options) ->
    
      o = $.extend {}, defaults, options
      ret = {}
      
      switch o.edge
        when 'right', 'left'
          shrinkRateH = o.rectHeight / o.imgWidth
          ret.width = Math.round (o.imgWidth * shrinkRateH)
          ret.height = o.rectHeight
        when 'top', 'bottom'
          shrinkRateW = o.rectWidth / o.imgWidth
          ret.width = o.rectWidth
          ret.height = Math.round (o.imgHeight * shrinkRateW)
          
      switch o.edge
        when 'left'
          ret.top = 0
          ret.right = 'auto'
          ret.bottom = 'auto'
          ret.left = 0
        when 'right'
          ret.top = 0
          ret.right = 0
          ret.bottom = 'auto'
          ret.left = 'auto'
        when 'top'
          ret.top = 0
          ret.right = 'auto'
          ret.bottom = 'auto'
          ret.left = 0
        when 'bottom'
          ret.top = 'auto'
          ret.right = 'auto'
          ret.bottom = 0
          ret.left = 0
      
      return ret

  # ============================================================
  # AbstractImgRectFitter

  class ns.AbstractImgRectFitter

    constructor: ->

      src = @$el.attr @options.attr_src
      if src
        @options.src = src

      if @options.oninit
        data =
          el: @$el
        @options.oninit data

      @_doFirstRefresh()
    
    _doFirstRefresh: ->

      @_stillLoadingImg = true
      @_calcNaturalImgWH().done =>
        @_stillLoadingImg = false
        @refresh()

      return this

    _calcNaturalImgWH: ->

      defer = $.Deferred()

      success = (origWH, $img) =>
        @originalImgWidth = origWH.width
        @originalImgHeight = origWH.height
        if @options.cloneImg
          $img = $img.clone()
        @$img = $img
        defer.resolve()
        return

      fail = =>
        if @options.onfail
          @options.onfail()
        defer.reject()
        return

      ns.calcNaturalWH(@options.src).then success, fail

      return defer.promise()

    _putImg: ($img) ->

      if @options.overrideImgPut
        @options.overrideImgPut(@$el, $img)
      else
        @$el.empty().append $img
      return this

    _finalizeImg: (styles) ->

      if @options.useNewImgElOnRefresh
        $img = @$img.clone()
        $img.css styles
        @_putImg $img
      else
        @$img.css styles
        $imgInside = @$el.find 'img'
        if $imgInside.length is 0
          @_putImg @$img

      return this
      


  # ============================================================
  # ImgCoverRect
  
  class ns.ImgCoverRect extends ns.AbstractImgRectFitter

    @defaults =
      src: null
      oninit: null
      onfail: null
      cloneImg: true
      useNewImgElOnRefresh: false
      attr_src: 'data-imgcoverrect-src'
      overrideImgPut: null

    constructor: (@$el, options) ->

      @options = $.extend {}, ns.ImgCoverRect.defaults, options
      super

    refresh: ->

      return if @_stillLoadingImg is true

      @rectWidth = @$el.width()
      @rectHeight = @$el.height()

      adjustedWH = ns.calcRectCoverImgWH
        imgWidth: @originalImgWidth
        imgHeight: @originalImgHeight
        rectWidth: @rectWidth
        rectHeight: @rectHeight

      styles =
        width: adjustedWH.width
        height: adjustedWH.height

      otherStyles = ns.calcStylesToCoverRect
        imgWidth: adjustedWH.width
        imgHeight: adjustedWH.height
        rectWidth: @rectWidth
        rectHeight: @rectHeight

      styles = $.extend styles, otherStyles
      @_finalizeImg styles

      return this

  # bridge

  do ->

    dataKey = 'imgcoverrect'

    $.fn.imgCoverRect = (options) ->
      return @each (i, el) ->
        $el = $(el)
        $el.data dataKey, (new ns.ImgCoverRect $el, options)

    $.fn.refreshImgCoverRect = ->
      return @each (i, el) ->
        $el = $(el)
        instance = $el.data dataKey
        return unless instance
        instance.refresh()
    

  # ============================================================
  # imgContainRect

  class ns.ImgContainRect extends ns.AbstractImgRectFitter
    
    @defaults =
      src: null
      oninit: null
      onfail: null
      cloneImg: true
      enlargeSmallImg: true
      useNewImgElOnRefresh: false
      attr_src: 'data-imgcontainrect-src'
      overrideImgPut: null

    constructor: (@$el, options) ->

      @options = $.extend {}, ns.ImgContainRect.defaults, options
      super

    refresh: ->

      return if @_stillLoadingImg is true

      @rectWidth = @$el.width()
      @rectHeight = @$el.height()

      adjustedWH = ns.calcRectContainImgWH
        imgWidth: @originalImgWidth
        imgHeight: @originalImgHeight
        rectWidth: @rectWidth
        rectHeight: @rectHeight

      styles =
        width: adjustedWH.width
        height: adjustedWH.height

      otherStyles = ns.calcStylesToBeContainedInRect
        imgWidth: adjustedWH.width
        imgHeight: adjustedWH.height
        rectWidth: @rectWidth
        rectHeight: @rectHeight

      styles = $.extend styles, otherStyles
      @_finalizeImg styles

      return this
    
  # bridge
  
  do ->

    dataKey = 'imgcontainrect'

    $.fn.imgContainRect = (options) ->
      return @each (i, el) ->
        $el = $(el)
        $el.data dataKey, (new ns.ImgContainRect $el, options)

    $.fn.refreshImgContainRect = ->
      return @each (i, el) ->
        $el = $(el)
        instance = $el.data dataKey
        return unless instance
        instance.refresh()

  # ============================================================
  # imgFitToEdge

  class ns.ImgFitToEdge extends ns.AbstractImgRectFitter
    
    @defaults =
      src: null
      oninit: null
      onfail: null
      cloneImg: true
      enlargeSmallImg: true
      useNewImgElOnRefresh: false
      attr_src: 'data-fittoedge-src'
      overrideImgPut: null
      
    constructor: (@$el, options) ->

      @options = $.extend {}, ns.ImgFitToEdge.defaults, options
      @edge = @$el.attr 'data-fittoedge-edge'
      super
    
    refresh: ->
    
      return if @_stillLoadingImg is true

      @rectWidth = @$el.width()
      @rectHeight = @$el.height()
      
      styles = ns.calcEdgeFitImgWH
        edge: @edge
        imgWidth: @originalImgWidth
        imgHeight: @originalImgHeight
        rectWidth: @rectWidth
        rectHeight: @rectHeight
      
      @_finalizeImg styles

      return this
      
  # bridge
  
  do ->

    dataKey = 'imgfittoedge'

    $.fn.imgFitToEdge = (options) ->
      return @each (i, el) ->
        $el = $(el)
        $el.data dataKey, (new ns.ImgFitToEdge $el, options)

    $.fn.refreshImgFitToEdge = ->
      return @each (i, el) ->
        $el = $(el)
        instance = $el.data dataKey
        return unless instance
        instance.refresh()
      

  # ============================================================
  # globalify

  $.imgUtil = ns
