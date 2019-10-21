
  let canvasMix = document.getElementById('canvas_mix');
  let remoteContainer = document.getElementById('remote_container');
  let stateSpan = document.getElementById('state_span');
  // MOVED: let Connections = [];

  let mcu = new BrowserMCU();
  function initMcu() {
      mcu.setCanvas(canvasMix);
      mcu.setContainer(remoteContainer);
      mcu.setAudioMode(BrowserMCU.AUDIO_MODE_MINUS_ONE);
  }

  // --- setup peer manage functions ---
 
  //setBandwidth(1024, 128);  // kps

  // --- prefix -----
  //navigator.getUserMedia  = navigator.getUserMedia    || navigator.webkitGetUserMedia ||
  //                          navigator.mozGetUserMedia || navigator.msGetUserMedia;
  RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
  RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;

  function connectionUser(){
   
     // -------- websocket ----  
  let wsProtocol = 'ws://';
  let protocol = window.location.protocol;
  if  (protocol === 'https:') {
    wsProtocol = 'wss://';
  }
  let wsUrl = wsProtocol +  window.location.hostname + ':' + window.location.port + '/';
    let ws = new WebSocket(wsUrl);
  ws.onopen = function(evt) {
    console.log('ws open()');
  };
  ws.onerror = function(err) {
    console.error('ws onerror() ERR:', err);
  };
  ws.onmessage = function(evt) {
    const message = JSON.parse(evt.data);
    handleMessage(message);
  };
  setMCU(mcu);
  setUpdateUIFunc(updateButtons);
  setSendJsonFunc(sendJson);
  setBandwidth(512, 64);  // kps
  function sendJson(id, json) {
    // -- socket.io --
    //socket.json.send(json);

    // --- websocket --
    json.to = id;
    const message = JSON.stringify(json);
    ws.send(message);  
  }

  function broadcastJson(json) {
    // -- socket.io --
    //socket.json.send(json);

    // --- websocket --
    const message = JSON.stringify(json);
    ws.send(message);
  }

  
  // start PeerConnection
  function connect() {
      
    callMe(); // MUST BE REQUEST CALL

    updateButtons();
  }

  function callMe() {
    console.log('calling ..');
    broadcastJson({type: "callme"});
  }
  setTimeout(function() {
    connect();
  }, 500);

  }

 
  function handleMessage(message) {
    const fromId = message.from;

    if (message.type === 'call') {
      if (isConnected(fromId)) {
        console.warn('ALREADY connecte, so ignore call');
        return;
      }

      sendJson(fromId, { type: 'response'} );
    }
    else if (message.type === 'response') {
      console.warn('got response, BUT MUST NOT recevie response.');
      return;

      //// --- start offer ----
      //peerPartnerId = fromId;
      //makeOffer();
    }
    else if (message.type === 'offer') {
      // -- got offer ---
      console.log('Received offer ...');
      //if (from !== peerPartnerId) {
      //  console.warn('Offer from Wrong partner:' + from + ',  MUST BE:' + peerPartnerId);
      //  return;
      //}

      const offer = new RTCSessionDescription(message);
      setOffer(fromId, offer);
    }
    else if (message.type === 'answer') {
      console.warn('got answer, BUT MUST NOT recevie answer.');
      return;

      //
      //// --- got answer ---
      //console.log('Received answer ...');
      //if (from !== peerPartnerId) {
      //  console.warn('Anser from Wrong partner:' + from + ',  MUST BE:' + peerPartnerId);
      //  return;
      //}
      //
      //const answer = new RTCSessionDescription(message);
      //setAnswer(answer);
      //
    }
    else if (message.type === 'candidate') {
      // --- got ICE candidate ---
      console.log('Received ICE candidate ...');
      //
      //if (from !== peerPartnerId) {
      //  console.warn('ICE candidate from Wrong partner:' + from + ',  MUST BE:' + peerPartnerId);
      //  return;
      //}
      //
      if (! isConnected(fromId)) {
        console.error('NOT Connected to id:' + fromId);
        return;
      }

      let candidate = new RTCIceCandidate(message.ice);
      console.log(candidate);
      addIceCandidate(fromId, candidate);
    }
    else if (message.type === 'bye') {
      console.log('-- remote peer disconnecting. id:' + fromId);
      if (! isConnected(fromId)) {
        console.warn('NOT Connected to id:' + fromId);
        return;
      }

      disconnectOne(fromId);
    }
    else if (message.type === 'client_disconnect') {
      console.log('-- remote peer disconnected. id:' + fromId);
      if (! isConnected(fromId)) {
        console.warn('NOT Connected to id:' + fromId);
        return;
      }

      disconnectOne(fromId);
    }
  };

  // ---------------------- media handling ----------------------- 
  function stopLocalStream(stream) {
    let tracks = stream.getTracks();
    if (! tracks) {
      console.warn('NO tracks');
      return;
    }
    
    for (let track of tracks) {
      track.stop();
    }
  }

  function playVideo(element, stream) {
    if ('srcObject' in element) {
      element.srcObject = stream;
    }
    else {
      element.src = window.URL.createObjectURL(stream);
    }
    element.play();
    element.volume = 0;
  }

  function pauseVideo(element) {
    element.pause();
    if ('srcObject' in element) {
      element.srcObject = null;
    }
    else {
      if (element.src && (element.src !== '') ) {
        window.URL.revokeObjectURL(element.src);
      }
      element.src = '';
    }
  }

  // -----  signaling ----
  
  // close PeerConnection
  function disconnectAll() {
    let wsProtocol = 'ws://';
  let protocol = window.location.protocol;
  if  (protocol === 'https:') {
    wsProtocol = 'wss://';
  }
  let wsUrl = wsProtocol +  window.location.hostname + ':' + window.location.port + '/';
    let ws = new WebSocket(wsUrl);
  ws.onopen = function(evt) {
    console.log('ws open()');
  };
  ws.onerror = function(err) {
    console.error('ws onerror() ERR:', err);
  };
  ws.onmessage = function(evt) {
    const message = JSON.parse(evt.data);
    handleMessage(message);
  };
  setMCU(mcu);
  
  setUpdateUIFunc(updateButtons);
  setSendJsonFunc(sendJson);
  setBandwidth(512, 64);  // kps
  function sendJson(id, json) {
    // -- socket.io --
    //socket.json.send(json);

    // --- websocket --
    json.to = id;
    const message = JSON.stringify(json);
    ws.send(message);  
  }

  function broadcastJson(json) {
    // -- socket.io --
    //socket.json.send(json);

    // --- websocket --
    const message = JSON.stringify(json);
    ws.send(message);
  }

   setTimeout(function(){
    broadcastJson({type: "bye"})
    // ---- close all peers ---
    closeAllConnections();

    // --- remove all videos ---
    mcu.removeAllRemoteVideo();

    // --- remove all audio ---
    mcu.removeAllRemoteAudioMinusOne();

    // -- stop mix ---
    console.log('--- stop mix ----');
    mcu.stopMix();

    updateButtons();
    setDisconnectOneFunc(disconnectOne);
    function disconnectOne(peerid) {
        // -- remove Video --
        let stream = getRemoteStream(peerid);
        mcu.removeRemoteVideo(stream);
    
        // -- remove audio ---
        mcu.removeRemoteAudioMinusOne(peerid)
    
        // -- remove peer ---
        removeConnection(peerid);
    
        // --- stop mix --
        if (getConnectionCount() === 0) {
          console.log('--- stop mix ----');
          mcu.stopMix();
        }
    
        updateButtons();
      }
      
    },1000);
    
    function showState(state) {
      stateSpan.innerText = state;
    }
    
  }

  

  
  function updateButtons() {
    if (getConnectionCount() > 0) {
      disableElement('connect_button');
      enableElement('disconnect_button');
    }
    else {
      enableElement('connect_button');
      disableElement('disconnect_button');
    }
  }

  function enableElement(id) {
    let element = document.getElementById(id);
    if (element) {
      element.removeAttribute('disabled');
    }
  }

  function disableElement(id) {
    let element = document.getElementById(id);
    if (element) {
      element.setAttribute('disabled', '1');
    }    
  }


  // ========== initilaise onload ========
  initMcu();
  // NOT start yet //mcu.startMix();

  //setSendJsonFunc(sendJson);

  // ---- auto connect ---
  //if (isAutoConnect()) {
  //}

  // --- control GUI ---
  updateButtons();

  console.log('=== ready ==='); 
