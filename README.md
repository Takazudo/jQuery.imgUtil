# jQuery.imgUtil

image utilities collection.

## Components

### $.imgUtil.calcNaturalWH

$.imgUtil.calcNaturalWH caliculates img's natural width / height.  
Newer browsers have naturalWidth/naturalHeight feature. With these, we can get the img's original width/height. But these features are sometimes difficult to handle because it fails and returns zero before the img was not load-completed.  
$.imgUtil.calcNaturalWH preloads img as background task then returns the values you want.  
This also works on old browsers which do not have naturalWidth/naturalHeight feature using tricky way.

### $.imgUtil.calcRectFitImgWH

$.imgUtil.calcRectFitImgWH returns rect fit width/height of thrown img.

### $.fn.imgCoverRect

$.fn.imgCoverRect adjusts img style to fill the container.

## Demos

* [$.imgUtil.calcNaturalWH](http://takazudo.github.io/jQuery.imgUtil/demos/1/)
* [$.imgUtil.calcRectFitImgWH](http://takazudo.github.io/jQuery.imgUtil/demos/2/)
* [$.fn.imgCoverRect](http://takazudo.github.io/jQuery.imgUtil/demos/3/)
* [$.fn.imgCoverRect - oninit option](http://takazudo.github.io/jQuery.imgUtil/demos/4/)

## Usage

see demos

## Depends

* jQuery 1.9.1 (>=1.7.0)
* [jQuery.ImgLoader](https://github.com/Takazudo/jQuery.ImgLoader)

## Browsers

IE6+ and other new browsers.  

## License

Copyright (c) 2013 "Takazudo" Takeshi Takatsudo  
Licensed under the MIT license.

## Build

Use

 * [CoffeeScript][coffeescript]
 * [grunt][grunt]

[coffeescript]: http://coffeescript.org "CoffeeScript"
[grunt]: http://gruntjs.com "grunt"
