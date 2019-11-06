
"use strict"

var BrowserMCU = function() {
  // --- for video mix ---
  const MAX_MEMBER_COUNT = 36;
  let remoteStreams = [];
  let remoteVideos = [];
  let mixStream = null;
  let videoContainer = null;
  
  const MIX_CAPTURE_FPS = 15;
  let canvasMix = null;
  let ctxMix = null;
  let animationId = null;
  let keepAnimation = false;

  let mixWidth = 320;
  let mixHeight = 240;
  //let remoteVideoWidthRate = 16; // 16:9
  //let remoteVideoHeightRate = 9; // 16:9
  let remoteVideoWidthRate = 4; // 4:3
  let remoteVideoHeightRate = 3; // 4:3
  let remoteVideoUnit = 20; // NOTE: seems no effect

  let frameRate = MIX_CAPTURE_FPS; // Frame per second
  let hideRemoteVideoFlag = false; // Hide Remote Video

  // -- for audio mix --
  //const _AUDIO_MODE_NONE = 0;
  //const _AUDIO_MODE_MINUS_ONE = 1;
  const _AUDIO_MODE_ALL = 2;
  const AuidoContect = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AuidoContect(); //new window.AudioContext();
  let audioMode = _AUDIO_MODE_ALL;
  let inputNodes = [];
  let minusOneOutputNodes = [];
  let minusOneStreams = [];
  let mixAllOutputNode = null;
  let audioMixAllStream = null;


  // --- init MCU ----
  this.setCanvas = function(canvas) {
    canvasMix = canvas;
    ctxMix = canvasMix.getContext('2d');
    ctxMix.fillStyle = 'rgb(128, 128, 255)';
    mixWidth = canvasMix.width;
    mixHeight = canvasMix.height;
  }

  this.setContainer = function(container) {
    videoContainer = container;
  }

  this.setAudioMode = function(mode) {
    audioMode = mode;
  }

  // --- init at once ---
  this.init = function(canvas, container, mode) {
    this.setCanvas(canvas);
    this.setContainer(container);
    this.setAudioMode(mode);
  }

  // -- set Frame Rate (FPS) --
  this.setFrameRate = function(rate) {
    frameRate = rate;
  }

  // NOTE: seems no effect
  this.setRemoteVideoUnit = function(unit) {
    remoteVideoUnit = unit;
  }

  this.hideRemoteVideo = function(hideFlag) {
    hideRemoteVideoFlag = hideFlag;
  }

  // --- change canvas sise ---
  this.updateCanvasSize = function() {
    if (canvasMix) {
      mixWidth = canvasMix.width;
      mixHeight = canvasMix.height;

      _calcGridHorzVert();
    }
  }

  // --- start/stop Mix ----
  this.startMix = function() {
    mixStream = canvasMix.captureStream(frameRate);
    if (audioMode === BrowserMCU.AUDIO_MODE_ALL) {
      mixAllOutputNode = audioContext.createMediaStreamDestination();
      audioMixAllStream = mixAllOutputNode.stream;
      mixStream.addTrack(audioMixAllStream.getAudioTracks()[0]);
    }

    animationId = window.requestAnimationFrame(_drawMixCanvas);
    keepAnimation = true;
    console.log('--start mix and capture stream--');
  }

  this.stopMix = function() {
    if (mixAllOutputNode) {
      // NG mixAllOutputNode.stop();
      audioMixAllStream = null;
      mixAllOutputNode = null;
    }

    if (mixStream) {
      _stopStream(mixStream);
      mixStream = null;
    }

    if (animationId) {
      window.cancelAnimationFrame(animationId);
      animationId = null;
    }
    keepAnimation = false;

    console.log('--stop mix and capture stream--');
  }

  this.isMixStarted = function() {
    if (mixStream) {
      if (! animationId) {
        console.warn('WARN: mcu state NOT certain');
      }

      return true;
    }
    else {
      if (animationId) {
        console.warn('WARN: mcu state NOT certain');
      }

      return false;
    }
  }

  function _stopStream(stream) {
    let tracks = stream.getTracks();
    if (! tracks) {
      console.warn('NO tracks');
      return;
    }

    for (let track of tracks) {
      track.stop();
    }
  }

  this.getMixStream = function() {
    return mixStream;
  }

  // ---- mix video ----
  function _clearMixCanvas() {
    ctxMix.fillRect(0, 0, mixWidth, mixHeight);
  }

  function _drawMixCanvas() {
    //console.log('--drawMixCanvas--');
    let i = 0;
    for(let key in remoteVideos) {
      let video = remoteVideos[key];
      _drawVideoGrid(video, i, horzCount, vertCount);
      i++;
    }

    if (keepAnimation) {
      window.requestAnimationFrame(_drawMixCanvas);
    }
  }

  function _drawVideoGrid(videoElement, index, horzCount, vertCount) {
    const destLeft = gridWidth * (index % horzCount); 
    const destTop = gridHeight * Math.floor(index / horzCount);

    _drawVideoGridWithClop(ctxMix, videoElement, destLeft, destTop, gridWidth, gridHeight);
  }

  function _drawVideoGridWithClop(ctx, video, destLeft, destTop, gridWidth, gridHeight) {
    const gridRatio = gridWidth / gridHeight;
 // === make 4:3 area ====
 let unit = 480; // (if same as Src Height, then 100% size)
 unit = video.videoHeight;

 const srcWidth = unit * gridRatio; // OK
 const srcHeight = unit; // OK
 const xCenter = video.videoWidth / 2;
 const yCenter =  video.videoHeight / 2;
 const srcLeft = xCenter - (srcWidth /2);
 const srcTop = yCenter - (srcHeight /2);
 ctx.drawImage(video, srcLeft, srcTop, srcWidth, srcHeight,
   destLeft, destTop, gridWidth, gridHeight
 );
  
  }

   // ---- matrix info ---
   let memberCount = 1;
   let horzCount = 1;
   let vertCount = 1;
   
   let gridWidth = null; 
   let gridHeight =null;
 
   
 

  // --- frexible vert --- horz/vert count flexible (2x1, 3x2, 4x3, 5x4)
 // --- frexible vert --- horz/vert count flexible (2x1, 3x2, 4x3, 5x4)

function _calcGridHorzVert() {
  memberCount = _getRemoteVideoCount();
  console.log("memeber cont ="+memberCount);
  
  canvasMix.width=gridWidth * memberCount;
  canvasMix.height=gridHeight;
  horzCount=memberCount

    return;
}

  // ------- handling remote video --------------
  function _getRemoteVideoCount() {
    return Object.keys(remoteVideos).length;
  }

  this.addRemoteVideo = function(stream) {
    //   // --- check for double add ---
  
      let remoteVideo = document.createElement('video');
      remoteVideo.id = 'remotevideo_' + stream.id;
      const videoId = "remotevideo_" + stream.id;
      let existRemoteVideo = document.getElementById(videoId); //'remotevideo_' + event.stream.id);
      if (existRemoteVideo) {
        console.warn('remote video ALREADY EXIST stream.id=' + stream.id);
        return;
      }
     
      remoteVideo.controls = true;
      
      let {width, height} = stream.getTracks()[0].getSettings();
      let settings = stream.getTracks()[0].getSettings();
      gridWidth=width;
      gridHeight=height;
      remoteVideo.srcObject = stream;
  
      videoContainer.appendChild(remoteVideo);
  
      remoteVideo.volume = 0;
      remoteVideo.play();
  
      remoteStreams[stream.id] = stream;
      remoteVideos[stream.id] = remoteVideo;
      _calcGridHorzVert();
      _clearMixCanvas();
    }
  

  this.removeRemoteVideo = function(stream) {
    const videoId = "remotevideo_" + stream.id;
    let remoteVideo = document.getElementById(videoId); //'remotevideo_' + event.stream.id);
    remoteVideo.pause();
    remoteVideo.srcObject = null;
    videoContainer.removeChild(remoteVideo);

    let video = remoteVideos[stream.id];
    if (video !== remoteVideo) {
      console.error('VIDEO element NOT MATCH');
    }
    // NG //console.log('Before Delete video len=' + remoteVideos.length);
    console.log('Before Delete video keys=' + Object.keys(remoteVideos).length);
    delete remoteVideos[stream.id];
    // NG //console.log('After Delete video len=' + remoteVideos.length);
    console.log('After Delete video keys=' + Object.keys(remoteVideos).length);

    // NG //console.log('Before Delete Stream len=' + remoteStreams.length);
    console.log('Before Delete Stream keys=' + Object.keys(remoteStreams).length);
    delete remoteStreams[stream.id];
    // NG //console.log('After Delete Stream len=' + remoteStreams.length);
    console.log('After Delete Stream keys=' + Object.keys(remoteStreams).length);

    _calcGridHorzVert();
    _clearMixCanvas();
  }

  this.removeAllRemoteVideo = function() {
    console.log('===== removeAllRemoteVideo ======');
    for(let key in remoteVideos) {
      let video = remoteVideos[key];
      video.pause();
      video.srcObject = null;
      videoContainer.removeChild(video);
    }
    remoteVideos = [];

    for(let key in remoteStreams) {
      let stream = remoteStreams[key];
      _stopStream(stream);
    }
    remoteStreams = [];

    _calcGridHorzVert();
    _clearMixCanvas();
  }
  // --- handling remote audio ---
  this.addRemoteAudio = function(stream) {
    console.log('addRemoteAudio()');

    if (audioMode === BrowserMCU.AUDIO_MODE_NONE) {
      // AUDIO_MODE_NONE
      console.log('BrowserMCU.AUDIO_MODE_NONE: ignore remote audio');
      return;
    }

    // --- check for double add ---
    let existRemoteNode = inputNodes[stream.id];
    if (existRemoteNode) {
      console.warn('remote audio node ALREADY EXIST stream.id=' + stream.id);
      return;
    }

    let remoteNode = audioContext.createMediaStreamSource(stream);
    inputNodes[stream.id] = remoteNode;

    if (audioMode === BrowserMCU.AUDIO_MODE_ALL) {
      console.log('BrowserMCU.AUDIO_MODE_ALL: mix all audo');
      remoteNode.connect(mixAllOutputNode);
    }
    else if (audioMode === BrowserMCU.AUDIO_MODE_MINUS_ONE) {
      console.warn('DO NOT use addRemoteAudio() on BrowserMCU.AUDIO_MODE_MINUS_ONE');
    }
    else if (audioMode === BrowserMCU.AUDIO_MODE_NONE) {
      // AUDIO_MODE_NONE
      console.log('BrowserMCU.AUDIO_MODE_NONE: ignore remote audio');
    }
    else {
      // WRONG audioMode
      console.error('BAD audioMode');
    }
  }


  // --- handling remote audio ---
  this.addRemoteAudio = function(stream) {
    console.log('addRemoteAudio()');

    if (audioMode === BrowserMCU.AUDIO_MODE_NONE) {
      // AUDIO_MODE_NONE
      console.log('BrowserMCU.AUDIO_MODE_NONE: ignore remote audio');
      return;
    }

    // --- check for double add ---
    let existRemoteNode = inputNodes[stream.id];
    if (existRemoteNode) {
      console.warn('remote audio node ALREADY EXIST stream.id=' + stream.id);
      return;
    }

    let remoteNode = audioContext.createMediaStreamSource(stream);
    inputNodes[stream.id] = remoteNode;

    if (audioMode === BrowserMCU.AUDIO_MODE_ALL) {
      console.log('BrowserMCU.AUDIO_MODE_ALL: mix all audo');
      remoteNode.connect(mixAllOutputNode);
    }
    else if (audioMode === BrowserMCU.AUDIO_MODE_MINUS_ONE) {
      console.warn('DO NOT use addRemoteAudio() on BrowserMCU.AUDIO_MODE_MINUS_ONE');
    }
    else if (audioMode === BrowserMCU.AUDIO_MODE_NONE) {
      // AUDIO_MODE_NONE
      console.log('BrowserMCU.AUDIO_MODE_NONE: ignore remote audio');
    }
    else {
      // WRONG audioMode
      console.error('BAD audioMode');
    }
  }

  this.removeRemoteAudio = function(stream) {
    let remoteNode = inputNodes[stream.id];
    if (remoteNode) {
      remoteNode.disconnect(mixAllOutputNode);
      delete inputNodes[stream.id];
    }
    else {
      console.warn('removeRemoteAudio() remoteStream NOT EXIST');
    }
  }

  this.removeAllRemoteAudio = function() {
    console.log('===== removeAllRemoteAudio ======');
    for(let key in inputNodes) {
      let remoteNode = inputNodes[key];
      remoteNode.disconnect(mixAllOutputNode);
    }
    inputNodes = [];
  }

  this.prepareMinusOneStream = function(peerId) {
    let stream = minusOneStreams[peerId];
    if (stream) {
      console.warn('minusOneStream ALREADY EXIST for peerId:' + peerId);
      return stream;
    }

    let newOutputNode = audioContext.createMediaStreamDestination();
    let newAudioMixStream = newOutputNode.stream;
    minusOneOutputNodes[peerId] = newOutputNode;
    minusOneStreams[peerId] = newAudioMixStream;
    for (let key in inputNodes) {
      if (key === peerId) {
        console.log('skip input(id=' + key + ') because same id=' + peerId);
      }
      else {
        console.log('connect input(id=' + key + ') to this output');
        let otherMicNode = inputNodes[key];
        otherMicNode.connect(newOutputNode);
      }
    }

    // -- add Video Track --
    if (mixStream) {
      newAudioMixStream.addTrack(mixStream.getVideoTracks()[0]);
    }
    else {
      console.warn('Video Track NOT READY YET');
    }

    return newAudioMixStream;
  }

  this.getMinusOneStream = function(peerId) {
    let stream = minusOneStreams[peerId];
    if (! stream) {
      console.warn('minusOneStream NOT EXIST for peerId:' + peerId);
    }
    return stream;
  }

  this.addRemoteAudioMinusOne = function(peerId, stream) {
    let audioTracks = stream.getAudioTracks();
    if (audioTracks && (audioTracks.length > 0))  {
      console.log('stream has audioStream. audio track count = ' + audioTracks.length);
      console.log(' stream.id=' + stream.id + ' , track.id=' + audioTracks[0].id);

      // --- prepare audio mic node ---
      let micNode = audioContext.createMediaStreamSource(stream);
      inputNodes[peerId] = micNode;

      // --- connect to other output ---
      for (let key in minusOneOutputNodes) {
        if (key === peerId) {
          console.log('skip output(id=' + key + ') because same id=' + peerId);
        }
        else {
          let otherOutputNode = minusOneOutputNodes[key];
          micNode.connect(otherOutputNode);
        }
      }
    }
    else {
      console.warn('NO Audio Tracks in stream');
    }
  }

  this.removeRemoteAudioMinusOne = function(peerId) {
    // -- remove from other outputs ----
    let thisMicNode = inputNodes[peerId];
    if (thisMicNode) {
      for (let key in minusOneOutputNodes) {
        if (key === peerId) {
          console.log('skip output(id=' + key + ') because same id=' + peerId);
        }
        else {
          let otherOutputNode = minusOneOutputNodes[key];
          thisMicNode.disconnect(otherOutputNode);
        }
      }

      thisMicNode = null;
      delete inputNodes[peerId];
    }
    else {
      console.warn('inputNode NOT EXIST for peerId:' + peerId);
    }

    // --- remove other mic/inputs ---
    let thisOutputNode = minusOneOutputNodes[peerId];
    if (thisOutputNode) {
      for (let key in inputNodes) {
        if (key === peerId) {
          console.log('skip disconnecting mic, because key=id (not connected)');
        }
        else {
          let micNode = inputNodes[key];
          micNode.disconnect(thisOutputNode);
        }
      }

      thisOutputNode = null;
      delete minusOneOutputNodes[peerId];
    }
    else {
      console.warn('minusOneOutputNode NOT EXIST for peerId:' + peerId);
    }

    let stream = minusOneStreams[peerId];
    if (stream) {
      stream = null;
      delete minusOneStreams[peerId];
    }
    else {
      console.warn('minusOneStream NOT EXIST for peerId:' + peerId);
    }
  }

  this.removeAllRemoteAudioMinusOne = function() {
    for (let key in minusOneStreams) {
      this.removeRemoteAudioMinusOne(key);
    }
  }
};

BrowserMCU.AUDIO_MODE_NONE = 0;
BrowserMCU.AUDIO_MODE_MINUS_ONE = 1;
BrowserMCU.AUDIO_MODE_ALL = 2;

