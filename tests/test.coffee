ns = $.ImgLoaderNs
wait = (time) ->
  $.Deferred (defer) ->
    setTimeout ->
      defer.resolve()
    , time or 300

asyncTest 'calcNaturalWH - ok', ->

  expect 3

  ($.calcNaturalWH 'imgs/1.jpg').then (wh, $img) ->
    equal wh.width, 320, "width caliculated correctly #{wh.width}"
    equal wh.height, 320, "height caliculated correctly #{wh.height}"
    equal ($img.attr 'src'), 'imgs/1.jpg', 'img element was returned'
  , ->
    ok false, 'failed'
  .always ->
    start()
  
asyncTest 'calcNaturalWH - ng', ->

  expect 1

  ($.calcNaturalWH 'nothinghere.jpg').then (wh) ->
    ok false, 'successed unexpectedly'
  , ->
    ok true, 'fails when img was 404'
  .always ->
    start()
  
asyncTest 'calcNaturalWH - try many at once', ->

  expect 40

  srcs = []
  srcs.push "imgs/#{i}.jpg" for i in [1..10]
  srcs.push "imgs/#{i}.jpg" for i in [1..10]

  deferreds = $.map srcs, (src) ->
    ($.calcNaturalWH src).then (wh) ->
      equal wh.width, 320, "#{src} width caliculated correctly #{wh.width}"
      equal wh.height, 320, "#{src} height caliculated correctly #{wh.height}"

  ($.when.apply @, deferreds).always -> start()
  
