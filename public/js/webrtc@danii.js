var webrtc = {
    coreUrl: 'https://s594.kotpusk.ru/webrtcCore.js',

    init: function() {
        var self = this;
        var script = document.createElement('script');
        script.onload = function () {
            // Another user joined to the room
            WebRTC.userJoined((err, userId, boardId, audio, video, stream) => {
                /*
                // Create separate video for each user in room
                var videoId = 'videoPublisher-' + boardId + '-' + userId;
                var videoContainer = $('#' + videoId).get(0);
                if (!videoContainer) {
                    $('<video></video>').attr('autoplay', true)
                                        .attr('poster', './no-video.png')
                                        .attr('id', videoId)
                                        .appendTo('.videos');
                    videoContainer = $('#' + videoId).get(0);
                }
                */
                var videoContainer = $('#present').get(0);
                videoContainer.srcObject = stream;
                videoContainer.play();
                $('#present').show();
            });

            // Another user left the room
            WebRTC.userLeft((err, userId, boardId, audio, video, stream) => {
                //var videoId = 'videoPublisher-' + boardId + '-' + userId;
                //var videoContainer = $('#' + videoId).remove();
                var videoContainer = $('#present').remove();
            });

            // Toggle media
            WebRTC.mediaToggled((err, userId, boardId, audio, video) => {
                //var videoId = '#videoPublisher-' + boardId + '-' + userId;
                var videoId = '#present';
                var tracks = $(videoId).get(0).srcObject.getTracks();
                for (let i in tracks) {
                    if (tracks[i].kind == 'audio') {
                        tracks[i].enabled = !!audio;
                    }
                    if (tracks[i].kind == 'video') {
                        tracks[i].enabled = !!video;
                    }
                }
            });

            WebRTC.isConnected((err, userId, boardId, audio, video, stream) => {
                // Do something when somebody is connected to room
            });

            WebRTC.boardDestroyed((err, userId, boardId, audio, video) => {
                // Do something when call is finished
            });

            WebRTC.boardDestroyed((err, userId, boardId, audio, video) => {
                // Do something when call is finished
            });

            // Connection is ready, can continue
            WebRTC.isReady(() => {
                // Do something when connection is established
                common.hideBusyLoad();
                // $('#busy_indicator').hide();
                // $('#busy_indicator_message').hide();
            });
        };
        script.src = self.coreUrl;
        document.head.appendChild(script);
    },

    connect: function() {
        var self = this;
        common.showBusyLoad(`Hi ${_global.display_name}, you are entering the room. Please enjoy with our Castr Studio.`);

        self.boardId = _global.room_id;
        self.userId = parseInt(_global.uuid);
        let video = true;
        let audio = true;

        if (_global.is_owner) {
            WebRTC.startCall(self.userId, self.boardId, audio, video, (err, userId, boardId, audio, video, stream) => {
                if (err) {
                    return false;
                }
                //$('#present').get(0).srcObject = stream;
                //$('#present').show();
                common.hideBusyLoad();
                // $('#busy_indicator').hide();
                // $('#busy_indicator_message').hide();
            });
        } else {
            WebRTC.joinCall(self.userId, self.boardId, audio, video, (err, userId, boardId, audio, video, stream) => {
                if (err) {
                    return false;
                }
                //$('#present').get(0).srcObject = stream;
                //$('#present').show();
                common.hideBusyLoad();
                // $('#busy_indicator').hide();
                // $('#busy_indicator_message').hide();
            });
        }
        /*
		var register = { "request": "join", "room": parseInt(_global.room_janus_id), "ptype": "publisher", "display": _global.display_name, "id": parseInt(_global.uuid) };
		webrtc.sfu.send({"message": register});
        */
	},

	publishOwnFeed: function(useAudio) {
        /*
		webrtc.sfu.createOffer({
			media: { audioRecv: false, videoRecv: false, audioSend: useAudio, videoSend: true },
			success: function(jsep) {
				Janus.debug("Got publisher SDP!");
				Janus.debug(jsep);
				var publish = { "request": "configure", "audio": useAudio, "video": true };
				webrtc.sfu.send({"message": publish, "jsep": jsep});
			},
			error: function(error) {
				Janus.error("WebRTC error:", error);
				if (useAudio) {
					publishOwnFeed(false);
				} else {
					alert("WebRTC error... " + JSON.stringify(error));
				}
			}
		});
        */
	},

	publishOwnFeedWithDeviceId: function(deviceId) {
        /*
		webrtc.sfu.createOffer({
			media: {audioRecv: false, videoRecv: false, audioSend: true, videoSend: true, video: {
				deviceId: deviceId
			}},
			success: function(jsep) {
				Janus.debug("Got publisher SDP!");
				Janus.debug(jsep);
				var publish = { "request": "configure", "audio": true, "video": true };
				webrtc.sfu.send({"message": publish, "jsep": jsep});
			},
			error: function(error) {
				Janus.error("WebRTC error:", error);
			}
		});
        */
	},

	publishOwnFeedWithScreenShare: function() {
        /*
		webrtc.sfuScreenShare.createOffer({
			media: {audioRecv: false, videoRecv: false, audioSend: false, videoSend: true, video: 'screen'},
			success: function(jsep) {
				Janus.debug("Got publisher SDP!");
				Janus.debug(jsep);
				var publish = { "request": "configure", "audio": false, "video": true };
				webrtc.sfuScreenShare.send({"message": publish, "jsep": jsep});
			},
			error: function(error) {
				Janus.error("WebRTC error:", error);
			}
		});
        */
	},

    restartPublish: function() {
        /*
        if (_global.is_connected) {
			webrtc.sfu.hangup();
			webrtc.publishOwnFeedWithDeviceId(devices.deviceSelections.videoinput.value);
			// webrtc.localStream.removeTrack(webrtc.localStream.getVideoTracks()[0]);
			// webrtc.localStream.addTrack(devices.localMediaStream.getVideoTracks()[0]);
        }
        */
    },

    screenshare: function() {
        /*
        if (_global.is_connected) {
            if (webrtc.janusScreenShare) {
				webrtc.janusScreenShare.destroy();
				webrtc.janusScreenShare = null;
            }

            // Create session
			webrtc.janusScreenShare = new Janus({
				server: webrtc.janusApiUrl,
                success: function() {
                    // Attach to video room test plugin
                    webrtc.janusScreenShare.attach({
                        plugin: "janus.plugin.videoroom",
                        opaqueId: _global.room_id,
						success: function(pluginHandle) {
							var register = { "request": "join", "room": parseInt(_global.room_janus_id), "ptype": "publisher", "display": _global.display_name, "id": parseInt(`${_global.uuid}0000`) };
							webrtc.sfuScreenShare = pluginHandle;
							webrtc.sfuScreenShare.send({"message": register});
						},
						onmessage: function(msg, jsep) {
							var event = msg["videoroom"];
							if(event != undefined && event != null) {
								if(event === "joined") {
									webrtc.publishOwnFeedWithScreenShare();
								}
							}
							if(jsep !== undefined && jsep !== null) {
								Janus.debug("Handling SDP as well...");
								Janus.debug(jsep);
								webrtc.sfuScreenShare.handleRemoteJsep({jsep: jsep});
								// var audio = msg["audio_codec"];
								// if(webrtc.localStream && webrtc.localStream.getAudioTracks() && webrtc.localStream.getAudioTracks().length > 0 && !audio) {
								// 	alert("Our audio stream has been rejected, viewers won't hear us");
								// }
								// var video = msg["video_codec"];
								// if(webrtc.localStream && webrtc.localStream.getVideoTracks() && webrtc.localStream.getVideoTracks().length > 0 && !video) {
								// 	alert.warning("Our video stream has been rejected, viewers won't see us");
								// }
							}
						}
					});
				}
			});
		}
        */
    }
};

$(document).ready(function() {
    webrtc.init();
});
