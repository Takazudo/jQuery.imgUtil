# jQuery.imgUtil

image utilities collection.

## Components

### $.imgUtil.calcNaturalWH

$.imgUtil.calcNaturalWH caliculates img's natural width / height.  
Newer browsers have naturalWidth/naturalHeight feature. With these, we can get the img's original width/height. But these features are sometimes difficult to handle because it fails and returns zero before the img was not load-completed.  
$.imgUtil.calcNaturalWH preloads img as background task then returns the values you want.  
This also works on old browsers which do not have naturalWidth/naturalHeight feature using tricky way.

### $.fn.imgCoverRect / $.fn.refreshImgCoverRect

$.fn.imgCoverRect adjusts img style to cover the container.

### $.fn.imgContainRect / $.fn.refreshImgContainRect

$.fn.imgContainRect adjusts img style to be contained by the container.

## Demos

* [$.imgUtil.calcNaturalWH](http://takazudo.github.io/jQuery.imgUtil/demos/calcNaturalWH/)
* [$.fn.imgCoverRect](http://takazudo.github.io/jQuery.imgUtil/demos/imgCoverRect/)
* [$.fn.imgCoverRect - oninit/overrideImgPut](http://takazudo.github.io/jQuery.imgUtil/demos/imgCoverRect_oninit/)
* [$.fn.refreshImgCoverRect](http://takazudo.github.io/jQuery.imgUtil/demos/imgCoverRect_refresh/)
* [$.fn.imgContainRect](http://takazudo.github.io/jQuery.imgUtil/demos/imgContainRect/)
* [$.fn.imgContainRect - oninit/overrideImgPut](http://takazudo.github.io/jQuery.imgUtil/demos/imgContainRect_oninit/)
* [$.fn.refreshImgContainRect](http://takazudo.github.io/jQuery.imgUtil/demos/imgContainRect_refresh/)

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

then,

```bash
npm install
```
And, to build

```bash
grunt
```

to watch

```bash
grunt watch
```

[coffeescript]: http://coffeescript.org "CoffeeScript"
[grunt]: http://gruntjs.com "grunt"
