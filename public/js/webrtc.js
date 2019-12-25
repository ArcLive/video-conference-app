/*eslint-disable no-var*/
window.WebrtcRoom = (function() {
  var webrtcRoomApiBase = 'wss://s594.kotpusk.ru:8890'

  var webrtcPeerConns = {}
  var webrtcPeerWebsocketConns = {}

  function WebrtcRoom(roomId, rtcIdentity) {
    if (!roomId) {
      throw new Error('no room id specified')
    }

    this.localPeer
    this.roomId = roomId
    this.publishing = false
    this.connected = false
    this.rtcIdentity = rtcIdentity

    this._cbs = {}
    this.activePeers = {}
    this.websocketConn

    this._registerEventCb = function(eventName, callback) {
      if (!this._cbs[eventName])
        this._cbs[eventName] = []

      this._cbs[eventName].push(callback)
    }

    this._invokeEventCallbacks = function(eventName, ...data) {
      var listeners = this._cbs[eventName] || []
      listeners.forEach(cb => {
        cb(...data)
      })
    }
  }

  WebrtcRoom.prototype.connect = function() {
    var self = this

    var socket = window.io(webrtcRoomApiBase)
    this.websocketConn = socket

    socket.on('error', (err) => {
      onError(err)
      self._invokeEventCallbacks('error', err)
    })

    socket.on('_error', (err) => {
      err = typeof err === 'string' ? new Error(err) : err
      self._invokeEventCallbacks('error', err)
    })

    socket.on('connect', () => {
      console.log('event system connected')
      this.connected = true
      /*
      setTimeout(() => {
        var connOptions = {
          identity: self.rtcIdentity
        }

        socket.emit('subscribe', self.roomId, connOptions)
      }, 1000);
      */
    })

    socket.on('/v1/ready', () => {
      socket.emit('/v1/login', self.roomId, {identity: self.rtcIdentity});
    })

    socket.on('/v1/stream/start', data => {
      this.localPeer = data.publisherId
      self._invokeEventCallbacks('roomSubscribed', localPeer)
    })

    //socket.on('participantAdded', peer => {
    socket.on('/v1/stream/publishers', data => {
      var oldPeerList = JSON.parse(JSON.stringify(self.activePeers));
      for (let i in data.publishers) {
          var peer = data.publishers[i]
          if (self.activePeers[peer.id]) {
              delete oldPeerList[peer.id]
              continue;
          }

          self._invokeEventCallbacks('participantAdded', peer)
          self.activePeers[peer.id] = peer
          pullWebrtcStream(peer.stream, (remoteMediaStream) => {
            self._invokeEventCallbacks('participantTrackAdded', peer, remoteMediaStream)
          }, this.mediaServerAddress)
      }
      for (let i in oldPeerList) {
          var peer = oldPeerList[i]
          flushPeerConn(peer)
          delete self.activePeers[peer.id]
          self._invokeEventCallbacks('participantRemoved', peer)
      }
    })
    /*
    socket.on('localParticipantAdded', peer => {
      if (!self.activePeers[peer.id])
        self._invokeEventCallbacks('localParticipantAdded', peer)
    })
    socket.on('participantRemoved', peer => {
      flushPeerConn(peer)
      delete self.activePeers[peer.id]
      self._invokeEventCallbacks('participantRemoved', peer)
    })
    */
    //socket.on('ended', () => {
    socket.on('/v1/stream/finish', () => {
      self._invokeEventCallbacks('ended')
    })
  }

  WebrtcRoom.prototype.onConnected = function(callback) {
    this._registerEventCb('roomSubscribed', callback)
  }

  WebrtcRoom.prototype.onParticipantList = function(callback) {
    this._registerEventCb('participantList', callback)
  }

  WebrtcRoom.prototype.onParticipantAdded = function(callback) {
    this._registerEventCb('participantAdded', callback)
  }

  WebrtcRoom.prototype.onLocalParticipantAdded = function(callback) {
    this._registerEventCb('localParticipantAdded', callback)
  }

  WebrtcRoom.prototype.onParticipantTrackAdded = function(callback) {
    this._registerEventCb('participantTrackAdded', callback)
  }

  WebrtcRoom.prototype.onParticipantRemoved = function(callback) {
    this._registerEventCb('participantRemoved', callback)
  }

  WebrtcRoom.prototype.onRoomEnded = function(callback) {
    this._registerEventCb('ended', callback)
  }

  WebrtcRoom.prototype.onError = function(callback) {
    this._registerEventCb('error', callback)
  }

  WebrtcRoom.prototype.close = function() {
    if (this.websocketConn)
      this.websocketConn.close()

    Object.values(this.activePeers).forEach(flushPeerConn)
  }

  WebrtcRoom.prototype.startPublishing = function(localWebcamMediaStream) {
    if (!localWebcamMediaStream) {
      console.error('no webcam media stream provided')
      return
    }

    this.publishing = true
    if (!this.localPeer) return

    publishWebrtcStream(this.localPeer.stream, localWebcamMediaStream, this.mediaServerAddress)
  }

  WebrtcRoom.prototype.stopPublishing = function() {
    this.publishing = false
    flushPeerConn(this.localPeer)
  }

  function flushPeerConn(peer) {
    if (!peer) return
    if (webrtcPeerConns[peer.stream]) {
      console.log('closing webrtc peer conn', peer)
      webrtcPeerConns[peer.stream].close()
    }

    if (webrtcPeerWebsocketConns[peer.stream]) {
      console.log('closing peer websocket conn', peer)
      webrtcPeerWebsocketConns[peer.stream].close()
    }
  }

  function pullWebrtcStream(streamPath, mediaCallback, mediaServerAddress) {
    var websocket;
    var peerConnection;

    openWebSocketConnection({
      protocol: 'ws',
      server: mediaServerAddress,
      port: '8080',
      stream: streamPath
    });

    console.log('streamPath', streamPath)
    console.log('mediaServerAddress', mediaServerAddress)

    function sendWebSocketMessage(data) {
      websocket.send(JSON.stringify(data));
    }

    function onWebSocketMessage(event) {
      var message = JSON.parse(event.data);
      switch (message.type) {
        case "offer":
          var description = new window.RTCSessionDescription(message);
          peerConnection.setRemoteDescription(description)
            .then(function() {
              return peerConnection.createAnswer();
            })
            .then(function(answer) {
              return peerConnection.setLocalDescription(answer);
            })
            .then(function() {
              sendWebSocketMessage(peerConnection.localDescription);
            });
          break;
        case "candidate":
          var candidate = new window.RTCIceCandidate(message.candidate);
          peerConnection.addIceCandidate(candidate);
          break;
      }
    }

    function openWebSocketConnection(options) {
      var url =
        options.protocol + "://" +
        options.server + ":" +
        options.port + "/" +
        options.stream + "/webrtc";
      websocket = new WebSocket(url);
      websocket.onopen = initPeerConnection;
      websocket.onmessage = onWebSocketMessage;

      webrtcPeerWebsocketConns[streamPath] = websocket
    }

    function initPeerConnection() {
      peerConnection = new window.RTCPeerConnection(null);
      peerConnection.stream_id = "remote1";
      peerConnection.onicecandidate = gotIceCandidate;
      peerConnection.ontrack = gotRemoteTrack;

      webrtcPeerConns[streamPath] = peerConnection
    }

    function gotIceCandidate(event) {
      var candidate = event.candidate;
      if (candidate) {
        sendWebSocketMessage({
          type: 'candidate',
          stream_id: "local1",
          label: candidate.sdpMLineIndex,
          id: candidate.sdpMid,
          candidate: candidate
        });
      }
    }

    function gotRemoteTrack(event) {
      if (event.track.kind === "video") {
        mediaCallback(event.streams[0])
      }
    }
  }

  function publishWebrtcStream(streamPath, localMediaStream, mediaServerAddress) {
    var websocket;
    var peerConnection;

    openWebSocketConnection({
      protocol: "ws",
      server: mediaServerAddress,
      port: "8080",
      stream: streamPath
    });

    function sendWebSocketMessage(data) {
      websocket.send(JSON.stringify(data));
    }

    function onWebSocketMessage(event) {
      var message = JSON.parse(event.data);
      switch (message.type) {
        case "answer":
          var description = new window.RTCSessionDescription(message);
          peerConnection.setRemoteDescription(description);
          break;
        case "candidate":
          var candidate = new window.RTCIceCandidate(message.candidate);
          peerConnection.addIceCandidate(candidate);
          break;
      }
    }

    function openWebSocketConnection(options) {
      var url =
        options.protocol + "://" +
        options.server + ":" +
        options.port + "/" +
        options.stream + "/webrtc/publish";
      websocket = new WebSocket(url);
      websocket.onopen = initPeerConnection;
      websocket.onmessage = onWebSocketMessage;

      webrtcPeerWebsocketConns[streamPath] = websocket
    }

    function addPeerStream() {
      peerConnection.addStream(localMediaStream);

      peerConnection.createOffer({
        "offerToReceiveAudio": true,
        "offerToReceiveVideo": true
      }).then(function(description) {
        return peerConnection.setLocalDescription(description);
      }).then(function() {
        sendWebSocketMessage(peerConnection.localDescription)
      })
    }

    function initPeerConnection() {
      peerConnection = new window.RTCPeerConnection(null);
      peerConnection.stream_id = "local1";
      peerConnection.onicecandidate = gotIceCandidate;

      webrtcPeerConns[streamPath] = peerConnection
      addPeerStream()
    }

    function gotIceCandidate(event) {
      var candidate = event.candidate;
      if (candidate) {
        sendWebSocketMessage({
          type: 'candidate',
          stream_id: "local1",
          label: candidate.sdpMLineIndex,
          id: candidate.sdpMid,
          candidate: candidate
        });
      }
    }
  }

  function onError(err) {
    console.log('socket err', err)
  }

  return WebrtcRoom
}())
