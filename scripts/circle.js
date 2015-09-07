/**
 * Created by angus on 5/21/15.
 */


/* 有中文说明的参数是可以修改的 */

/* Assets */
/* ath is relative to root */
var soundSource = 'assets/mp3/god-save-the-queen.mp3';    // MP3文件路径
var lyricSource = 'assets/lrc/god-save-the-queen.lrc';  // LRC歌词文件路径
var coverSource = 'assets/cover/god-save-the-queen.png';  // 封面文件路径

var infoTitle  = 'God Save the Queen'; //歌曲名字
var infoArtist = 'Sex Pistols'; //歌手名字
var infoAlbum  = 'Never Mind the Bollocks'; //专辑名


 /* white translucent status bar for iOS web apps */
if(!navigator.standalone && (/iphone|ipod|ipad/gi).test(navigator.platform) && (/Safari/i).test(navigator.appVersion)){
    document.getElementById("status_bar").content = "black-translucent";
}

//document.ontouchmove = function(e){
//  e.preventDefault();
//};

/* Canvas */
var canvas  = document.querySelector('#canvas');
var canvas2 = document.querySelector('#canvas2');

var screenWidth  = window.innerWidth;
var screenHeight = window.innerHeight;
var canvasW = screenWidth * 2;
var canvasH = screenHeight * 2;

var ctx    = canvas.getContext("2d");
var ctxTop = canvas2.getContext('2d');


/* 控制3个白色圈 */

var fillStyle  = 'rgba(255, 255, 255, 0.9)'; // 第1个圈(最內部)上的小点的颜色.下面两个变量依次分别为第2,3个圈小点颜色
var fillStyle2 = 'rgba(255, 255, 255, 0.6)';
var fillStyle3 = 'rgba(255, 255, 255, 0.35)';

var cyOffset = -100; // 3个圈的圆心在纵向位置的偏移,负数向上移,正数向下移.例如从-100调整到-150,则3个圈向上移动 50px

var cx = canvasW / 2;
var cy = canvasH / 2 + cyOffset;

var circleRadius1 = 100; // 第1个圈半径大小
var dotsNum1      = 14;  // 第1个圈上小点的数量(单位:个)
var dotRadius1    = 5;   // 每个小点的半径

// 以下两组参数意义同上一组

var circleRadius2 = 180;
var dotsNum2      = 20;
var dotRadius2    = 3;

var circleRadius3 = 280;
var dotsNum3      = 26;
var dotRadius3    = dotRadius2; // 小点半径同第2圈的小点半径,可修改为其它值(阿拉伯数字或其它变量名,如 2 或 dotRadius1)

var bounceRate1 = 5; // 圈上小点运动的激烈程度,数字绝对值越大运动越小,该数值不能为0 (可以为负数)
var bounceRate2 = 3;
var bounceRate3 = 2;


/* 控制随机点 */

var randomDotFill = '#09bb07'; // 随机点颜色,亦可使用rgb()或rgba().例如rgb(250, 250, 250) 或 rgba(255, 255, 255, 0.5)

var sizeMin = 8;
var sizeMax = 20;

var amountMin = 10; // 随机点数量最小值
var amountMax = 14; // 随机点数量最大值(下面4组参数意义同,后缀 Min 指最小值,后缀 Max 指最大值)

var orbitMin = 90;  // 轨道大小,即随机点距离圆心的距离
var orbitMax = 400;

var speedMin = 0.1; // 随机点速度
var speedMax = 1;

var angleMin = 0;   // 随机点出现的初始位置,0 ~ 360表示在360度范围内都会出现随机点
var angleMax = 360;

var angleOffsetMin = -0.005; // 随机点速度补正,负数表示朝逆时针方向移动
var angleOffsetMax = 0.005;


/* 控制播放/暂停按钮 */

var playBtnColor = '#ffffff'; // 按钮颜色,使用6位HEX色值
var playBtnSize  = 35; // 按钮大小


/* 控制声音解析 */

var audioSmoothing  = 0.8; // 解析左声道频率的柔和指数,取值 0 ~ 1.0 之间.数值越低,动画的剧烈程度会越高
var audioSmoothing2 = 0.8; // 右声道


//var currentLyricTop = $('.lyric-wrapper').innerHeight() / 2 - 40;
var currentLyricTop = '50% - 1rem';

/* Sound */
if (! window.AudioContext) {
    if (! window.webkitAudioContext) {
        alert('no audiocontext found');
    }
    window.AudioContext = window.webkitAudioContext;
}

var context = new AudioContext();
var splitter;
var array, array2;
var analyser, analyser2;
var average, average2;
var javascriptNode;
var buffer;
var sourceNode;
var startedAt;
var pausedAt;
var paused;

var tick    = 0;
var tickAcc = 0;

// Random dots;
var amount;
var sizes  = [];
var orbits = [];
var speeds = [];
var angles = [];
var angleOffsets = [];

var m;

/* Lyric */
var lrc;
var lrcStr;

init();

function init() {
  m = new Marka('#iconPlay');
  m.set('pause').color(playBtnColor).size(playBtnSize);

  setArtist();

  var cover = new Image();

  cover.onload = function(){
    randomDotFill = getAverageColor(document.querySelector('.cover-wrapper img'));
    console.log(randomDotFill);
  };
  cover.src = coverSource;

  sizingCanvas();
  setupAudioNodes();
  load(soundSource);
  loadLyric(lyricSource);
  process();



  window.onresize = sizingCanvas;
}

function load(url) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.onload = function() {

        initRandomDots();

        context.decodeAudioData(request.response, onBufferLoad, onBufferError);
    };
    request.send();
}

function play() {

    if (paused) {
        sourceNode = context.createBufferSource();
        sourceNode.connect(splitter);
        sourceNode.connect(context.destination);
    }

    sourceNode.buffer = buffer;
    paused = false;
    tickAcc = 0.01;

    if (pausedAt) {
        startedAt = Date.now() - pausedAt;
        sourceNode.start(0, pausedAt / 1000);
    }
    else {
        startedAt = Date.now();
        sourceNode.start(0);
    }

  playLyric();
}

function setupAudioNodes() {

    javascriptNode = context.createScriptProcessor(2048, 1, 1);
    javascriptNode.connect(context.destination);

    // setup a analyzer
    analyser = context.createAnalyser();
    analyser.smoothingTimeConstant = audioSmoothing;
    analyser.fftSize = 128;

    analyser2 = context.createAnalyser();
    analyser2.smoothingTimeConstant = audioSmoothing2;
    analyser2.fftSize = 128;

    // create a buffer source node
    sourceNode = context.createBufferSource();
    splitter = context.createChannelSplitter();

    // connect the source to the analyser and the splitter
    sourceNode.connect(splitter);

    // connect one of the outputs from the splitter to analyser
    splitter.connect(analyser,0,0);
    splitter.connect(analyser2,1,0);

    analyser.connect(javascriptNode);

    // and connect to destination
    sourceNode.connect(context.destination);
}


function process() {
    javascriptNode.onaudioprocess = function() {

        // get the average for the first channel
        array =  new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        average = getAverageVolume(array);

        // get the average for the second channel
        array2 =  new Uint8Array(analyser2.frequencyBinCount);
        analyser2.getByteFrequencyData(array2);
        average2 = getAverageVolume(array2);

        // Clear canvas
        ctx.clearRect(0, 0, canvasW, canvasH);
        ctxTop.clearRect(0, 0, canvasW, canvasH);

        tick = tick + 0.001 + tickAcc;

        drawCircles();
        drawRandomDots(amount);
    };
}


function getAverageVolume(array) {
    var values = 0;
    var average;

    var length = array.length;

    // get all the frequency amplitudes
    for (var i = 0; i < length; i++) {
        values += array[i];
    }

    average = values / length;
    return average;
}

function playLyric() {
  if (!pausedAt) {
    lrc.play(0, lrcStr);
    console.log('Played no pause');
  } else {
    lrc.play(pausedAt, lrcStr);
  }
}

function stopLyric() {
  lrc.stop();
}

function loadLyric(file) {
  $.ajax({
    url: file,
    complete: function(data, res) {
      if (res == 'success') {
        lrcStr = data.responseText;
        lrc = new Lrc(lrcStr, lrcHandler);
        playLyric();
      } else {
        console.log(res);
      }
    }
  });
}

function lrcHandler(line, extra){

  var currentNum = extra.lineNum;
  var totalNum   = lrc.txts.length;

  $('.lyric--next, .lyric--prev').remove();

  for (var j = 0; j < currentNum; j++) {
    lyric = document.createElement('div');
    $(lyric).addClass('lyric lyric--prev').insertBefore('.lyric--current').html(lrc.txts[j]);
    $(lyric).css('top', 'calc(' + currentLyricTop + ' - ' + eval((currentNum - j) * 30) + 'px)');
  }

  $('.lyric--current').html(line).css('top', 'calc(' + currentLyricTop + ')');

  for (var i = currentNum + 1; i < totalNum; i++) {
    lyric = document.createElement('div');
    $(lyric).addClass('lyric lyric--next').appendTo('.lyrics').html(lrc.txts[i]);
    $(lyric).css('top', 'calc(' + currentLyricTop + ' + ' + eval((i - currentNum) * 30) + 'px)');
  }

}


function drawCircles() {

    // Drawing the 1st circle
    for (i = 0; i < dotsNum1; i++) {

        if (i%2 == 1) {
            index = i
        } else {
            index = array.length - 1 -i;
        }

        //amendR = average;
        amendR = Math.ceil(array[index] / bounceRate1) + average;

        c = getCoordinate(i, circleRadius1 + amendR, dotsNum1, tick);

        x = c.x;
        y = c.y;

        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.arc(x, y, dotRadius1, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
    }

    // Drawing the 2nd circle
    for (i = 0; i < dotsNum2; i++) {

        if (i%2 == 1) {
            index = i
        } else {
            index = array2.length - 1 -i;
        }

        //amendR = average2;
        amendR = Math.ceil(array2[index] / bounceRate2) + average2;

        c = getCoordinate(i, circleRadius2 + amendR, dotsNum2, -tick);

        x = c.x;
        y = c.y;

        ctx.fillStyle = fillStyle2;
        ctx.beginPath();
        ctx.arc(x, y, dotRadius2, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
    }

    // Drawing the 3rd circle
    for (i = 0; i < dotsNum3; i++) {

        if (i%2 == 1) {
            index = i
        } else {
            index = array2.length - 1 -i;
        }

        //amendR = average2;
        amendR = Math.ceil(array2[index] / bounceRate3) + average2;

        c = getCoordinate(i, circleRadius3 + amendR, dotsNum3, tick);

        x = c.x;
        y = c.y;

        ctx.fillStyle = fillStyle3;
        ctx.beginPath();
        ctx.arc(x, y, dotRadius3, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
    }
}

function initRandomDots() {
    amount = getRandomInt(amountMin, amountMax); // amount of the green balls

    for (i = 0; i < amount; i++) {
        sizes[i]  = getRandomInt(sizeMin, sizeMax);
        orbits[i] = getRandomInt(orbitMin, orbitMax);
        speeds[i] = getRandomArbitrary(speedMin, speedMax);
        angles[i] = getRandomInt(angleMin, angleMax);
        angleOffsets[i] = getRandomArbitrary(angleOffsetMax, angleOffsetMin);
    }
}


function drawDot(x, y, radius) {
    ctxTop.fillStyle = randomDotFill;
    ctxTop.beginPath();
    ctxTop.arc(x, y, radius, 0, 2 * Math.PI);
    ctxTop.closePath();
    ctxTop.fill();
}

var tmpOrbits = [];

function drawRandomDots() {
    for (i = 0; i < amount; i++) {

        var speed = speeds[i];
        var size = sizes[i];
        var orbit;
        var angle  = angles[i];

        if (!tmpOrbits[i]) {
            tmpOrbits[i] = 1;
        }

        if (tmpOrbits[i] < orbits[i]) {
            orbit = tmpOrbits[i];
            tmpOrbits[i] += 10;
        } else {
            orbit = orbits[i];
        }

        angle += Math.acos(1 - Math.pow(speed/orbit, 2) / 2) + angleOffsets[i] + tickAcc / 2;
        angles[i] = angle;

        // calculate the new ball.x / ball.y
        var x = cx + orbit * Math.cos(angle);
        var y = cy + orbit * Math.sin(angle);

        drawDot(x, y, size);
    }
}

function getCoordinate(i, r, num, angleOffset) {
    if (!angleOffset) {
        angleOffset = 0;
    }

    var coordinate = {};
    var angle = i * Math.acos(1 - Math.pow(2 * Math.PI / num, 2) / 2) + angleOffset;

    var x = cx + r * Math.cos(angle);
    var y = cy + r * Math.sin(angle);

    coordinate.x = x;
    coordinate.y = y;

    return coordinate;
}

function stop() {
  sourceNode.stop(0);
  pausedAt = Date.now() - startedAt;
  paused = true;
  tickAcc = 0;

  stopLyric();
}

function onBufferLoad(b) {
    buffer = b;
    play();
}

function onBufferError(e) {
    console.log('onBufferError', e);
}

function sizingCanvas() {
    screenWidth  = window.innerWidth;
    screenHeight = window.innerHeight;

    // Retina ready
    canvasW = screenWidth * 2;
    canvasH = screenHeight * 2;
    $(canvas2).attr('width', canvasW).attr('height', canvasH).width(screenWidth).height(screenHeight);
    $(canvas).attr('width', canvasW).attr('height', canvasH).width(screenWidth).height(screenHeight);

    cx = canvasW / 2;
    cy = canvasH / 2 + cyOffset;

    $('.cover-wrapper').attr('style', 'top: ' + (cy - 130) / 2 + 'px'); // todo change the magic number 130
}

function tangent(deg) {
    var rad = deg * Math.PI / 180;
    return Math.tan(rad);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function getAverageColor(imgEl) {

  var blockSize = 5, // only visit every 5 pixels
    defaultRGB = {r:0,g:0,b:0}, // for non-supporting envs
    canvas = document.createElement('canvas'),
    context = canvas.getContext && canvas.getContext('2d'),
    data, width, height,
    i = -4,
    length,
    rgb = {r:0,g:0,b:0},
    count = 0;

  if (!context) {
    return defaultRGB;
  }

  height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
  width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;

  context.drawImage(imgEl, 0, 0);

  try {
    data = context.getImageData(0, 0, width, height);
  } catch(e) {
    /* security error, img on diff domain */
    return defaultRGB;
  }

  length = data.data.length;

  while ( (i += blockSize * 4) < length ) {
    ++count;
    rgb.r += data.data[i];
    rgb.g += data.data[i+1];
    rgb.b += data.data[i+2];
  }

  // ~~ used to floor values
  rgb.r = ~~(rgb.r/count);
  rgb.g = ~~(rgb.g/count);
  rgb.b = ~~(rgb.b/count);

  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  return rgbToHex(rgb.r, rgb.g, rgb.b);

}

function setArtist() {
    $('#cover').attr({
        'src': coverSource,
        'alt': infoAlbum
    });

    $('#touch-icon').attr('href', coverSource);
    $('#favicon').attr('href', coverSource);

    title = infoTitle + '-' + infoArtist;

    $('title').text(title);
    $('#app-title').attr('content', title);

    $('.nav__title').html(infoTitle);
}

$('.btn--control').click(function(e) {
    e.preventDefault();

    if (paused) {
        play();
        m.set('pause');
        m.rotate('down');
    } else {
        stop();
        m.set('triangle');
        m.rotate('right');

    }
});

var canvasHammer = new Hammer(document.querySelector('.canvas--top'));
canvasHammer.on('doubletap', function(){
  $('.lyric-wrapper').addClass('show');
});

//$('.canvas').click(function(e) {
//  $('.lyric-wrapper').addClass('show');
//});

var timeToDisappear = 5;
var count = 0;

var s = setInterval(function() {
  count++;
}, 1000);

var lyricHammer = new Hammer(document.querySelector('.lyric-wrapper'));
lyricHammer.on('doubletap', function(){
  $('.lyric-wrapper').removeClass('show');
});

$('.lyrics').on("touchmove touchstart", function(){
  $('.lyric-wrapper').addClass('scrollable');
  $('.lyric--current').css('color',randomDotFill);
  count = 0;
}).on('touchend', function(){
  setInterval(function(){
    if (count >= timeToDisappear) {
      $('.lyric-wrapper').removeClass('scrollable');
      $('.lyric--current').css('color','');
      document.querySelector('#lyric').scrollIntoView();
    }
  }, 500);
});

