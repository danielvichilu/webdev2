let canvasMix = document.getElementById('canvas_mix');
let remoteContainer = document.getElementById('video_container');
let mixVideo = document.getElementById('mix_video');
// --- prefix -----
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia || navigator.msGetUserMedia;
RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;

let localstreamm = canvasMix.captureStream(25);

///recordVideo
// var recordedChunks = [];
//   setInterval(
// function recording (){
// console.log(localstreamm);
// var options = { mimeType: "video/mp4" };
// mediaRecorder = new MediaRecorder(localstreamm);

// mediaRecorder.ondataavailable = handleDataAvailable;
// mediaRecorder.start();

// function handleDataAvailable(event) {
//   console.log("data-available");
//   if (event.data.size > 0) {
//     recordedChunks.push(event.data);
//     console.log(recordedChunks);
//     download();
//   } else {
//     // ...
//   }
// }
// function download() {
//   var blob = new Blob(recordedChunks, {
//     type: "video/webm"
//   });
//   var url = URL.createObjectURL(blob);
//   var a = document.createElement("a");
//   document.body.appendChild(a);
//   a.style = "display: none";
//   a.href = url;
//   a.download = "test.avi";
//   a.click();
//   window.URL.revokeObjectURL(url);
// }

// // demo: to download after 9sec
// setTimeout(event => {
//   console.log("stopping");
//   mediaRecorder.stop();
  
// }, 2000)
// }, 3000);

setLocalStream(localstreamm);
// --- setup peer manage functions ---
setSendJsonFunc(sendJson);
setDisconnectFunc(disconnect);
setBandwidth(512, 64);  // kps
//setBandwidth(1024, 128);  // kps
let mcu = new BrowserMCU();

//let isMixStarted = false;
function initMcu() {
  // --- init at once ---
  mcu.init(canvasMix, remoteContainer, BrowserMCU.AUDIO_MODE_ALL);
  // --- set frame rate --
  mcu.setFrameRate(25);

}

// -------- websocket ----
let wsProtocol = 'ws://';
let protocol = window.location.protocol;

if (protocol === 'https:') {
  wsProtocol = 'wss://';
}
let wsUrl = wsProtocol +  window.location.hostname + ':' + window.location.port + '/';
let ws = new WebSocket(wsUrl);
ws.onopen = function (evt) {
  console.log('ws open()');
};
ws.onerror = function (err) {
  console.error('ws onerror() ERR:', err);
};
ws.onmessage = function (evt) {
  const message = JSON.parse(evt.data);
  {
  handleMessage(message);
  }
};
ws.onclose = function(evt) {
  console.log('Socket is closed. Reconnect will be attempted in 1 second.', evt.reason);
  setTimeout(function() {
  let wsProtocol = 'ws://';
let protocol = window.location.protocol;

if (protocol === 'https:') {
  wsProtocol = 'wss://';
}
    let wsUrl = wsProtocol +  window.location.hostname + ':' + window.location.port + '/';
    let ws = new WebSocket(wsUrl);
    ws.onopen = function (evt) {
      console.log('ws open()');
    };
    ws.onerror = function (err) {
      console.error('ws onerror() ERR:', err);
    };
    ws.onmessage = function (evt) {
      const message = JSON.parse(evt.data);
      {
      handleMessage(message);
      }
    };
    setSendJsonFunc(sendJson);
setDisconnectFunc(disconnect);
setBandwidth(512, 64);  // kps
//setBandwidth(1024, 128);  // kps
let mcu = new BrowserMCU();

//let isMixStarted = false;
function initMcu() {
  // --- init at once ---
  mcu.init(canvasMix, remoteContainer, BrowserMCU.AUDIO_MODE_ALL);
  // --- set frame rate --
  mcu.setFrameRate(25);

}

    function sendJson(id, json) {

        // --- websocket --
        json.to = id;
        const message = JSON.stringify(json);
       
         ws.send(message);
      }
      
      function broadcastJson(json) {
        // --- websocket --
        const message = JSON.stringify(json);
       
        ws.send(message);
        
      }
      
      // start PeerConnection
      function connect() {
        call();
        // updateButtons();
      }
      
      function call() {
        console.log('calling ..');
        broadcastJson({type: "call"});
      }
      
      // close PeerConnection
      function disconnect() {
      
        broadcastJson({type: "bye"});
      
        // ---- close all peers ---
        closeAllConnections();
        removeAllRemoteVideo();
      
        // updateButtons();
      }
      initMcu();

  }, 500);
}

// /////----webSocketInternet----////
// online()
//      window.addEventListener('offline', online);
//      window.addEventListener('online',  online);
  
// function online(){
//   if (navigator.onLine) {
// let wi = new WebSocket('wss://appdevweb.herokuapp.com/');
// wi.onopen = function(evt) {
//   console.log('wi open()');
// };
// wi.onerror = function(err) {
//   console.error('wi onerror() ERR:', err);
// };
// wi.onmessage = function(evt) {
//   const message = JSON.parse(evt.data);
//   handleMessage(message);

//   setSendJsonFunc(sendJson);
//   function sendJson(id, json) {

// //////--- websocket --/////
// json.to = id;
// const message = JSON.stringify(json);
 
// wi.send(message); 
// }

// function broadcastJson(json) {
// // --- websocket --
// const message = JSON.stringify(json);

// wi.send(message); 
// }
// };

// } else {
//   console.log('wi closed');
// }
// }


function handleMessage(message) {
  const from = message.from;

  switch (message.type) {
    case 'call':
      console.log('ignore call');
      break;
    case 'response': // --- start offer ----
      makeOffer(from);
      break;
    case 'callme': // --- request from MCU --
      console.log('got callme from MCU:' + from);
      if (isConnected(from)) {
        return;
      }

      if (!getLocalStream()) {
        console.warn('localstream NOT READY, so ignore');
        return;
      }

      // --- start offer ----
      makeOffer(from);
      break;
    case 'offer':
      console.warn('got offer, but MUST NOT got it');
      return;
    case 'answer': // --- got answer ---
      console.log('Received answer ...');
      //if (from !== peerPartnerId) {
      if (!isConnected(from)) {
        console.warn('Anser from Wrong partner:' + from); // + ',  MUST BE:' + peerPartnerId);
        return;
      }

      const answer = new RTCSessionDescription(message);
      setAnswer(from, answer);
      break;
    case 'candidate': // --- got ICE candidate ---
      console.log('Received ICE candidate ...');
      if (!isConnected(from)) {
        console.warn('ICE candidate from Wrong partner:' + from); // + ',  MUST BE:' + peerPartnerId);
        return;
      }

      let candidate = new RTCIceCandidate(message.ice);
      console.log(candidate);
      addIceCandidate(from, candidate);
      break;
    case 'bye':
      console.log('-- remote peer disconnecting ---');
      if (!isConnected(from)) {
        console.warn('bye from Wrong partner:' + from); // + ',  MUST BE:' + peerPartnerId);
        return;
      }

      disconnectPeer(from);
      // updateButtons();
      break;
    case 'client_disconnect':
      console.log('-- remote peer disconnected --');
      if (isConnected(from)) {

        disconnectPeer(from);
        // updateButtons();
      }
      break;
  }

  function disconnectPeer(id) {
    let peerConnection = getConnection(id);

    if (peerConnection) {
      if ('getRemoteStreams' in peerConnection) {
        // -- not supported in Safari TP --
        let streams = peerConnection.getRemoteStreams();
        for (let key in streams) {
          let stream = streams[key]
        }
      } else if ('getReceivers' in peerConnection) {
        // -- for Safari TP ---
        let receivers = peerConnection.getReceivers();
        for (let key in receivers) {
          let receiver = receivers[key];
          switch (receiver.track.kind) {
            case 'video':
              removeRemoteVideoByTrackId(receiver.track.id);
              break;
            case 'audio':
              console.warn('skip audio track');
              break;
          }
        }
      } else {
        console.error('NO WAY to get remote stream');
      }

      removeConnection(id);
      peerConnection = null;
    }
  }
}


// function onChange() {
//   navigator.mediaDevices.ondevicechange = function () {
//     updateCameraList();
//   }
// }

let DEVICES = [];

// function updateCameraList() {
  navigator.mediaDevices.enumerateDevices()
    .then(function (devices) {
      let arrayLength = devices.length;
      for (let i = 0; i < arrayLength; i++) {
        let tempDevice = devices[i];
        if (tempDevice.kind === 'videoinput' && !DEVICES.includes(tempDevice.deviceId)) {
          DEVICES.push(tempDevice.deviceId);
          let constraints = {video: {deviceId: {exact: tempDevice.deviceId}}};

          navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
              startMix();
              mcu.addRemoteVideo(stream);
            })
        }
      }
    })
// }

function startMix() {
  if (!mcu.isMixStarted()) {
    mcu.startMix();
    mixVideo.srcObject = mcu.getMixStream();
    mixVideo.play();

    mixVideo.volume = 0;
  }
}

// -----  signaling ----
function sendJson(id, json) {

  // --- websocket --
  json.to = id;
  const message = JSON.stringify(json);
  ws.send(message);
  // wi.send(message);
}

function broadcastJson(json) {
  // --- websocket --
  const message = JSON.stringify(json);
  ws.send(message);
  // wi.send(message);
}

// start PeerConnection
function connect() {
  call();
  // updateButtons();
}

function call() {
  console.log('calling ..');
  broadcastJson({type: "call"});
}

// close PeerConnection
function disconnect() {

  broadcastJson({type: "bye"});

  // ---- close all peers ---
  closeAllConnections();
  removeAllRemoteVideo();

  // updateButtons();
}

// ========== initilaise onload ========
initMcu();
console.log('=== ready ===');
