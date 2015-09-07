
/* white translucent status bar for iOS web apps */
if(!navigator.standalone && (/iphone|ipod|ipad/gi).test(navigator.platform) && (/Safari/i).test(navigator.appVersion)){
    document.getElementById("status_bar").content = "black-translucent";
}


/* Assets */
var soundSource = 'assets/mp3/pao-mo.mp3';
var lyricSource = 'assets/lrc/pao-mo.lrc';
var coverSource = 'assets/cover/pao-mo.png';


/* Canvas */
var canvas  = document.querySelector('#canvas');
var canvas2 = document.querySelector('#canvas2');

var screenWidth  = window.innerWidth;
var screenHeight = window.innerHeight;
var canvasW = screenWidth * 2;
var canvasH = screenHeight * 2;

var ctx = canvas.getContext("2d");
var shaky;

//    var gradient = ctx.createLinearGradient(0,0,0,300);
//    gradient.addColorStop(1, '#0199d9');
//    gradient.addColorStop(0, '#c1f032');

var offset = -200; // OffsetY of the triangle (Negative value to move the triangle up)
var centerX = canvasW / 2; // Center of the triangle
var centerY = canvasH / 2 + offset;


/* Lyric */
var lrc;
var lrcStr;
var nextLine  = '';
var nextLine2 = '';
var nextLine3 = '';
var nextLine4 = '';
var prevLine  = '';
var prevLine2 = '';
var prevLine3 = '';
var prevLine4 = '';

var m;


/* Sound */
// create the audio context (webkit only for now)
if (! window.AudioContext) {
    if (! window.webkitAudioContext) {
        alert('no audiocontext found');
    }
    window.AudioContext = window.webkitAudioContext;
}

var context = new AudioContext();
var audioBuffer;
var sourceNode;
var splitter;
var array, array2;
var analyser, analyser2;
var average, average2;
var javascriptNode;
//var pauseTime = 0;
//var duration;

var startedAt;
var pausedAt;
var paused = false;


init();


function init() {

    // Set icon
    m = new Marka('#iconPlay');
    m.set('pause').color('#ffffff').size(50);

    // Resize the canvas;
    sizingCanvas();

    shaky = shaky.create(canvas2);

    loadLyric(lyricSource);

    // load and play the sound
    setupAudioNodes();
    loadSound(soundSource);
    process();

    //resumeCount();

    window.onresize = sizingCanvas;
}


function lrcHandler(line, extra){
    $('#lyric').html(line);

    var lineNum = extra.lineNum;

    nextLine  = lrc.txts[lineNum + 1];
    nextLine2 = lrc.txts[lineNum + 2];
    prevLine  = lrc.txts[lineNum - 1];

    $('#prevLyric').html(prevLine);
    $('#nextLyric').html(nextLine);
    $('#nextLyric2').html(nextLine2);
}



function sizingCanvas() {
    screenWidth  = window.innerWidth;
    screenHeight = window.innerHeight;

    // Retina ready
    canvasW = screenWidth * 2;
    canvasH = screenHeight * 2;
    $(canvas2).attr('width', canvasW).attr('height', canvasH).width(screenWidth).height(screenHeight);
    $(canvas).attr('width', canvasW).attr('height', canvasH).width(screenWidth).height(screenHeight);

    centerX = canvasW / 2;
    centerY = canvasH / 2 + offset;
}



function setupAudioNodes() {

    // setup a javascript node
    javascriptNode = context.createScriptProcessor(2048, 1, 1);
    // connect to destination, else it isn't called
    javascriptNode.connect(context.destination);


    // setup a analyzer
    analyser = context.createAnalyser();
    analyser.smoothingTimeConstant = 0.9;
    analyser.fftSize = 1024;

    analyser2 = context.createAnalyser();
    analyser2.smoothingTimeConstant = 0.7;
    analyser2.fftSize = 1024;

    // create a buffer source node
    sourceNode = context.createBufferSource();
    splitter = context.createChannelSplitter();

    // connect the source to the analyser and the splitter
    sourceNode.connect(splitter);

    // connect one of the outputs from the splitter to
    // the analyser
    splitter.connect(analyser,0,0);
    splitter.connect(analyser2,1,0);

    // connect the splitter to the javascriptnode
    // we use the javascript node to draw at a
    // specific interval.
    analyser.connect(javascriptNode);

    // and connect to destination
    sourceNode.connect(context.destination);
}

function play() {
    if (paused) {
        sourceNode = context.createBufferSource();
        sourceNode.connect(splitter);
        sourceNode.connect(context.destination);
    }

    sourceNode.buffer = audioBuffer;

    paused = false;

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

// load the specified sound
function loadSound(url) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    // When loaded decode the data
    request.onload = function() {
        initEvents();

        // decode the data
        context.decodeAudioData(request.response, onBufferLoad, onError);
    };
    request.send();
}

// log if an error occurs
function onError(e) {
    console.log(e);
}

function onBufferLoad(buffer) {
    audioBuffer = buffer;
    play();
}





function process() {
    // when the javascript node is called
    // we use information from the analyzer node
    // to draw the volume
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
        shaky.clear();

        //if(count > duration) {
        //    pauseCount();
        //    count = 0;
        //}

        drawTri();
        drawShakyTri();
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


var strokeStyle = '#fff';
var baseRadius = 150;
var basePointAX, basePointAY, basePointBX, basePointBY, basePointCX, basePointCY;

function drawShakyTri() {
    basePointAX = centerX;
    basePointAY = centerY - baseRadius;


    basePointBX = 0.5 * (2 * centerX + 1.732 * baseRadius); // x = 0.5 * ( 2 * a + Math.tan(Math.PI / 3) )
    basePointBY = 0.5 * (2 * centerY + baseRadius);

    basePointCX = 0.5 * (2 * centerX - 1.732 * baseRadius);
    basePointCY = basePointBY;


    shaky.context.strokeStyle = strokeStyle;
    shaky.strokeWidth = 2;

    var triOffset1 = array[array.length / 2] * 4;
    var triOffset1X = 0.866 * triOffset1; // Math.cos(Math.PI / 6) * l
    var triOffset1Y = 0.5 * triOffset1; // Math.sin(Math.PI / 6) * l

    var tri1PointAX = basePointAX;
    var tri1PointAY = basePointAY - triOffset1;
    var tri1PointBX = basePointBX + triOffset1X;
    var tri1PointBY = basePointBY + triOffset1Y;
    var tri1PointCX = basePointCX - triOffset1X;
    var tri1PointCY = tri1PointBY;

    shaky.beginPath();
    shaky.moveTo(tri1PointAX, tri1PointAY);
    shaky.lineTo(tri1PointBX, tri1PointBY);
    shaky.lineTo(tri1PointCX, tri1PointCY);
    shaky.lineTo(tri1PointAX, tri1PointAY);
    shaky.stroke();
}

function drawTri() {

    ctx.strokeStyle = strokeStyle;
    ctx.strokeWidth = 2;

    ctx.beginPath();
    ctx.moveTo(basePointAX, basePointAY);
    ctx.lineTo(basePointBX, basePointBY);
    ctx.lineTo(basePointCX, basePointCY);
    ctx.closePath();
    ctx.stroke();

    var triOffset1 = average * 3;
    var triOffset1X = 0.866 * triOffset1; // Math.cos(Math.PI / 6) * l
    var triOffset1Y = 0.5 * triOffset1; // Math.sin(Math.PI / 6) * l

    var tri1PointAX = basePointAX;
    var tri1PointAY = basePointAY - triOffset1;
    var tri1PointBX = basePointBX + triOffset1X;
    var tri1PointBY = basePointBY + triOffset1Y;
    var tri1PointCX = basePointCX - triOffset1X;
    var tri1PointCY = tri1PointBY;

    ctx.beginPath();
    ctx.moveTo(tri1PointAX, tri1PointAY);
    ctx.lineTo(tri1PointBX, tri1PointBY);
    ctx.lineTo(tri1PointCX, tri1PointCY);
    ctx.closePath();
    ctx.stroke();

    var triOffset2 = average2 * 2;
    var triOffset2X = 0.866 * triOffset2;
    var triOffset2Y = 0.5 * triOffset2;

    var tri2PointAX = basePointAX;
    var tri2PointAY = basePointAY - triOffset2;
    var tri2PointBX = basePointBX + triOffset2X;
    var tri2PointBY = basePointBY + triOffset2Y;
    var tri2PointCX = basePointCX - triOffset2X;
    var tri2PointCY = tri2PointBY;

    ctx.beginPath();
    ctx.moveTo(tri2PointAX, tri2PointAY);
    ctx.lineTo(tri2PointBX, tri2PointBY);
    ctx.lineTo(tri2PointCX, tri2PointCY);
    ctx.closePath();
    ctx.stroke();
}

//    function drawCircles() {
//        ctx.strokeStyle = gradient;
//
//        ctx.beginPath();
//        ctx.strokeWidth = 1;
//        ctx.arc(canvasW/2, canvasH/2, average, 0, 2 * Math.PI);
//        ctx.closePath();
//        ctx.stroke();
//
//        ctx.fillStyle = gradient;
//
//        ctx.beginPath();
//        ctx.strokeWidth = 1;
//        ctx.arc(canvasW/2, canvasH/2, average2, 0, 2 * Math.PI);
//        ctx.closePath();
//        ctx.stroke();
//    }

//    function pauseSound() {
//        pauseTime = count;
//        sourceNode.stop(0);
//        lrc.stop();
//        pauseCount();
//    }

//function resumeSound() {
//    // load the sound
//    setupAudioNodes();
//    loadSound(soundSource, pauseTime);
////        lrc.play(Math.round(pauseTime * 1000));
//    process();
//    resumeCount();
//}

function stop() {
    sourceNode.stop(0);
    lrc.stop();
    pausedAt = Date.now() - startedAt;
    paused = true;
}

//function getSoundDuration() {
//    return sourceNode.buffer.duration;
//}

//    function getCurrentTime() {
//        return sourceNode.context.currentTime;
//    }

//function pauseCount() {
//    window.clearInterval(interval);
//}
//
//function resumeCount() {
//    interval = window.setInterval(function(){
//        count += 0.01;
//        if(count >= duration) {
//            pauseCount();
//            count = 0;
//        }
//    }, 10);
//}

//function resetTriangle() {
//    var i = 0;
//    var inter = window.setInterval(function () {
//        i++;
//
//        ctx.clearRect(0, 0, 1000, canvasH);
//
//        ctx.beginPath();
//        ctx.lineWidth = 1;
//        ctx.strokeStyle = gradient;
//        ctx.moveTo(10, pathY[0] - i);
//        ctx.lineTo(100, pathY[1] - i);
//        ctx.lineTo(50, pathY[2] - i);
//        ctx.closePath();
//        ctx.stroke();
//
//        if (i >= canvasH) {
//            window.clearInterval(inter);
//        }
//    }, 100);
//}

function playLyric() {
    if (!pausedAt) {
        lrc.play(0, lrcStr);
      console.log('Played no pause');
    } else {
        lrc.play(pausedAt, lrcStr);
    }
}

function loadLyric(file) {
    $.ajax({
        url: file,
        complete: function(data, res) {
            if (res == 'success') {
                lrcStr = data.responseText;
                lrc = new Lrc(lrcStr, lrcHandler);
            } else {
                console.log(res);
            }
        }
    });
}


function initEvents() {
    $('.btn--control').click(function(e) {
        e.preventDefault();

        if ($(this).hasClass('pause')) {

            stop();
            $(this).removeClass('pause');

            m.set('triangle');
            m.rotate('right');
        } else {

            play();
            $(this).addClass('pause');

            m.set('pause');
            m.rotate('down');
        }
    });
}
