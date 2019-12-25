var webrtc = {
    janusApiUrl: _global.janus_api_url,
	janus: null,
	janusScreenShare: null,
	sfu: null,
	sfuScreenShare: null,
	localStream: null,
	mypvtid: null,
	streams: {},

    init: function() {
        Janus.init({debug: "all", callback: function() {
            // Make sure the browser supports WebRTC
			if(!Janus.isWebrtcSupported()) {
				alert("No WebRTC support... ");
				return;
            }
            
            // Create session
			webrtc.janus = new Janus({
                server: webrtc.janusApiUrl,
                success: function() {
                    // Attach to video room test plugin
                    webrtc.janus.attach({
                        plugin: "janus.plugin.videoroom",
                        opaqueId: _global.room_id,
							success: function(pluginHandle) {
								webrtc.sfu = pluginHandle;

								if (_global.is_owner) {
									var create = { "request": "create", "room": parseInt(_global.room_janus_id)};
									webrtc.sfu.send({"message": create});
									Janus.log("Room created! (" + _global.room_janus_id + ")");
								}

								Janus.log("Plugin attached! (" + webrtc.sfu.getPlugin() + ", id=" + webrtc.sfu.getId() + ")");
								Janus.log("  -- This is a publisher/manager");
								common.hideBusyLoad();
							},
							error: function(error) {
								Janus.error("  -- Error attaching plugin...", error);
								alert("Error attaching plugin... " + error);
								common.hideBusyLoad();
							},
							mediaState: function(medium, on) {
								Janus.log("Janus " + (on ? "started" : "stopped") + " receiving our " + medium);
							},
							webrtcState: function(on) {
								Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
							},
							onmessage: function(msg, jsep) {
								Janus.debug(" ::: Got a message (publisher) :::");
								Janus.debug(msg);
								var event = msg["videoroom"];
								Janus.debug("Event: " + event);
								if(event != undefined && event != null) {
									if(event === "joined") {
										// Publisher/manager created, negotiate WebRTC and attach to existing feeds, if any
										webrtc.mypvtid = msg["private_id"];
										Janus.log("Successfully joined room " + msg["room"] + " with ID " + _global.uuid);
										webrtc.publishOwnFeed(true);
										// Any new feed to attach to?
										if(msg["publishers"] !== undefined && msg["publishers"] !== null) {
											var list = msg["publishers"];
											Janus.debug("Got a list of available publishers/feeds:");
											Janus.debug(list);
											for(var f in list) {
												var id = list[f]["id"];
												var display = list[f]["display"];
												var audio = list[f]["audio_codec"];
												var video = list[f]["video_codec"];
												Janus.debug("  >> [" + id + "] " + display + " (audio: " + audio + ", video: " + video + ")");
												webrtc.newRemoteFeed(id, display, audio, video);
											}
										}
									} else if(event === "destroyed") {
										// The room has been destroyed
										Janus.warn("The room has been destroyed!");
										alert("The room has been destroyed", function() {
											window.location.reload();
										});
									} else if(event === "event") {
										// Any new feed to attach to?
										if(msg["publishers"] !== undefined && msg["publishers"] !== null) {
											var list = msg["publishers"];
											Janus.debug("Got a list of available publishers/feeds:");
											Janus.debug(list);
											for(var f in list) {
												var id = list[f]["id"];
												var display = list[f]["display"];
												var audio = list[f]["audio_codec"];
												var video = list[f]["video_codec"];
												Janus.debug("  >> [" + id + "] " + display + " (audio: " + audio + ", video: " + video + ")");
												webrtc.newRemoteFeed(id, display, audio, video);
											}
										} else if(msg["leaving"] !== undefined && msg["leaving"] !== null) {
										} else if(msg["unpublished"] !== undefined && msg["unpublished"] !== null) {
										} else if(msg["error"] !== undefined && msg["error"] !== null) {
											if(msg["error_code"] === 426) {
												// This is a "no such room" error: give a more meaningful description
												alert("no such room");
											} else {
												alert(msg["error"]);
											}
										}
									}
								}
								if(jsep !== undefined && jsep !== null) {
									Janus.debug("Handling SDP as well...");
									Janus.debug(jsep);
									webrtc.sfu.handleRemoteJsep({jsep: jsep});
									var audio = msg["audio_codec"];
									if(webrtc.localStream && webrtc.localStream.getAudioTracks() && webrtc.localStream.getAudioTracks().length > 0 && !audio) {
										alert("Our audio stream has been rejected, viewers won't hear us");
									}
									var video = msg["video_codec"];
									if(webrtc.localStream && webrtc.localStream.getVideoTracks() && webrtc.localStream.getVideoTracks().length > 0 && !video) {
										alert.warning("Our video stream has been rejected, viewers won't see us");
									}
								}
							},
							onlocalstream: function(stream) {
								common.hideBusyLoad();
								Janus.debug(" ::: Got a local stream :::");
								webrtc.localStream = stream;
								Janus.debug(stream);
								_global.is_connected = true;
								studio.addUserprev(_global.uuid, webrtc.localStream, true, 'cam');
								if(webrtc.sfu.webrtcStuff.pc.iceConnectionState !== "completed" && webrtc.sfu.webrtcStuff.pc.iceConnectionState !== "connected") {
									console.log("publishing");
								}
								var videoTracks = stream.getVideoTracks();
								if(videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {									
								} else {
								}
							},
							oncleanup: function() {
								Janus.log(" ::: Got a cleanup notification: we are unpublished now :::");
								webrtc.localStream = null;
							}
						});
					},
					error: function(error) {
						Janus.error(error);
						alert(error);
					},
					destroyed: function() {
						window.location.reload();
					}
				});
        }});
    },

    connect: function() {
        common.showBusyLoad(`Hi ${_global.display_name}, you are entering the room. Please enjoy with our Castr Studio.`);
		
		var register = { "request": "join", "room": parseInt(_global.room_janus_id), "ptype": "publisher", "display": _global.display_name, "id": parseInt(_global.uuid) };
		webrtc.sfu.send({"message": register});
	},

	newRemoteFeed: function(id, display, audio, video) {
		// A new feed has been published, create a new plugin handle and attach to it as a subscriber
		var remoteFeed = null;
		webrtc.janus.attach({
			plugin: "janus.plugin.videoroom",
			opaqueId: _global.room_id,
			success: function(pluginHandle) {
				remoteFeed = pluginHandle;
				Janus.log("Plugin attached! (" + remoteFeed.getPlugin() + ", id=" + remoteFeed.getId() + ")");
				Janus.log("  -- This is a subscriber");
				// We wait for the plugin to send us an offer
				var subscribe = { "request": "join", "room": parseInt(_global.room_janus_id), "ptype": "subscriber", "feed": id, "private_id": webrtc.mypvtid };
				if(Janus.webRTCAdapter.browserDetails.browser === "safari" && (video === "vp9" || (video === "vp8" && !Janus.safariVp8))) {
					if(video) video = video.toUpperCase();
					alert("Publisher is using " + video + ", but Safari doesn't support it: disabling video");
					subscribe["offer_video"] = false;
				}
				remoteFeed.videoCodec = video;
				remoteFeed.send({"message": subscribe});
			},
			error: function(error) {
				Janus.error("  -- Error attaching plugin...", error);
				alert("Error attaching plugin... " + error);
			},
			onmessage: function(msg, jsep) {
				Janus.debug(" ::: Got a message (subscriber) :::");
				Janus.debug(msg);
				var event = msg["videoroom"];
				Janus.debug("Event: " + event);
				if(msg["error"] !== undefined && msg["error"] !== null) {
					alert(msg["error"]);
				} else if(event != undefined && event != null) {
					if(event === "attached") {
						remoteFeed.rfid = msg["id"];
						remoteFeed.rfdisplay = msg["display"];
						Janus.log("Successfully attached to feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") in room " + msg["room"]);
					} else if(event === "event") {
						// Check if we got an event on a simulcast-related event from this publisher
					} else {
						// What has just happened?
					}
				}
				if(jsep !== undefined && jsep !== null) {
					Janus.debug("Handling SDP as well...");
					Janus.debug(jsep);
					// Answer and attach
					remoteFeed.createAnswer({
						jsep: jsep,
						// Add data:true here if you want to subscribe to datachannels as well
						// (obviously only works if the publisher offered them in the first place)
						media: { audioSend: false, videoSend: false },	// We want recvonly audio/video
						success: function(jsep) {
							Janus.debug("Got SDP!");
							Janus.debug(jsep);
							var body = { "request": "start", "room": parseInt(_global.room_janus_id) };
							remoteFeed.send({"message": body, "jsep": jsep});
						},
						error: function(error) {
							Janus.error("WebRTC error:", error);
							alert("WebRTC error... " + JSON.stringify(error));
						}
					});
				}
			},
			webrtcState: function(on) {
				Janus.log("Janus says this WebRTC PeerConnection (feed #" + remoteFeed.rfindex + ") is " + (on ? "up" : "down") + " now");
			},
			onremotestream: function(stream) {
				Janus.debug("Remote feed #" + remoteFeed.rfindex);
				studio.addUserprev(`${id}`, stream, false, 'cam');
				webrtc.streams[`${id}`] = stream;
				var videoTracks = stream.getVideoTracks();
				if(videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
				} else {
				}
			},
			oncleanup: function() {
				Janus.log(" ::: Got a cleanup notification (remote feed " + id + ") :::");
			}
		});
	},
	
	publishOwnFeed: function(useAudio) {
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
	},

	publishOwnFeedWithDeviceId: function(deviceId) {
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
	},

	publishOwnFeedWithScreenShare: function() {
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
	},

    restartPublish: function() {
        if (_global.is_connected) {
			webrtc.sfu.hangup();
			webrtc.publishOwnFeedWithDeviceId(devices.deviceSelections.videoinput.value);
			// webrtc.localStream.removeTrack(webrtc.localStream.getVideoTracks()[0]);
			// webrtc.localStream.addTrack(devices.localMediaStream.getVideoTracks()[0]);
        }
    },

    screenshare: function() {
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
    }
};

$(document).ready(function() {
    webrtc.init();
});