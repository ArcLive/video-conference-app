var devices = {
    deviceSelections: {
        audioinput: null,
        audiooutput: null,
        videoinput: null
    },

    localMediaStream: null,
    localScreenShareStream: null,

    init: function() {
        devices.deviceSelections.audioinput = document.querySelector('select#audioinput');
        devices.deviceSelections.audiooutput = document.querySelector('select#audiooutput');
        devices.deviceSelections.videoinput = document.querySelector('select#videoinput');

        if (devices.hasGetUserMedia()) {
            devices.initLocalMediaStream();
            // devices.initLocalScreenShareStream();

            // Build the list of available media devices.
            devices.updateDeviceSelectionOptions();

            // Whenever a media device is added or removed, update the list.
            navigator.mediaDevices.ondevicechange = devices.updateDeviceSelectionOptions;

            // Apply the selected audio input media device.
            document.querySelector('#applydevices').onclick = function(event) {
                // var audio = document.querySelector('audio#audioinputpreview');
                // applyAudioInputDeviceSelection(deviceSelections.audioinput.value, audio);

                devices.applyVideoInputDeviceSelection();
            };
        }
    },

    /**
     * Get the list of available media devices of the given kind.
     * @param {Array<MediaDeviceInfo>} deviceInfos
     * @param {string} kind - One of 'audioinput', 'audiooutput', 'videoinput'
     * @returns {Array<MediaDeviceInfo>} - Only those media devices of the given kind
     */
    getDevicesOfKind: function(deviceInfos, kind) {
        return deviceInfos.filter(function(deviceInfo) {
            return deviceInfo.kind === kind;
        });
    },

    /**
     * Apply the selected audio input device.
     * @param {string} deviceId
     * @param {HTMLAudioElement} audio
     * @returns {Promise<void>}
     */
    applyAudioInputDeviceSelection: function(deviceId, audio) {
        // return Video.createLocalAudioTrack({
            // deviceId: deviceId
        // }).then(function(localTrack) {
            // localTrack.attach(audio);
        // });
    },

    /**
     * Apply the selected audio output device.
     * @param {string} deviceId
     * @param {HTMLAudioElement} audio
     */
    applyAudioOutputDeviceSelection: function(deviceId, audio) {
        audio.setSinkId(deviceId);
    },

    /**
     * Apply the selected video input device.
     * @param {string} deviceId
     * @param {HTMLVideoElement} video
     * @returns {Promise<void>}
     */
    applyVideoInputDeviceSelection: function() {
        navigator.mediaDevices.getUserMedia({
            video: {
                deviceId: devices.deviceSelections.videoinput.value
            },
            audio: false
        })
        .then(function (stream) {
            devices.localMediaStream.removeTrack(devices.localMediaStream.getVideoTracks()[0]);
            devices.localMediaStream.addTrack(stream.getVideoTracks()[0]);
            studio.changeDevices();
        });

        // return Video.createLocalVideoTrack({
        //     deviceId: deviceId,
        //     height: 240,
        //     width: 320
        // }).then(function(localTrack) {
        //     localTrack.attach(video);
        //     localTrack.attach(document.querySelector('.user.mine video'));
        //     localTrack.attach(document.querySelector(`div#userscene-${_communicator.uuid} video`));
    
        //     activeRoom.localParticipant.tracks.forEach((track) => {
        //         if (track.kind == 'video') {
        //         activeRoom.localParticipant.removeTracks([track]);        
        //         }
        //     });
        
        //     activeRoom.localParticipant.addTracks([localTrack]);
        // });
    },

    /**
     * Get the list of available media devices.
     * @returns {Promise<DeviceSelectionOptions>}
     * @typedef {object} DeviceSelectionOptions
     * @property {Array<MediaDeviceInfo>} audioinput
     * @property {Array<MediaDeviceInfo>} audiooutput
     * @property {Array<MediaDeviceInfo>} videoinput
     */
    getDeviceSelectionOptions: function() {
        return navigator.mediaDevices.enumerateDevices().then(function(deviceInfos) {
            var kinds = [ 'audioinput', 'audiooutput', 'videoinput' ];
            return kinds.reduce(function(deviceSelectionOptions, kind) {
                deviceSelectionOptions[kind] = devices.getDevicesOfKind(deviceInfos, kind);
                return deviceSelectionOptions;
            }, {});
        });
    },

    /**
     * Build the list of available media devices.
     */
    updateDeviceSelectionOptions: function() {
        devices.getDeviceSelectionOptions().then(function (deviceSelectionOptions) {
            ['audioinput', 'audiooutput', 'videoinput'].forEach(function(kind) {
                var kindDeviceInfos = deviceSelectionOptions[kind];
                var select = devices.deviceSelections[kind];
        
                [].slice.call(select.children).forEach(function(option) {
                    option.remove();
                });
        
                kindDeviceInfos.forEach(function(kindDeviceInfo) {
                    var deviceId = kindDeviceInfo.deviceId;
                    var label = kindDeviceInfo.label;
                    var option = document.createElement('option');
                    option.value = deviceId;
                    option.appendChild(document.createTextNode(label));
                    select.appendChild(option);
                });
            });
        });
    },

    hasGetUserMedia: function() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    },

    initLocalMediaStream: function() {
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })
        .then(function (stream) {
            devices.localMediaStream = stream;

            studio.previewMedia();
        });
    },
    
    initLocalScreenShareStream: function() {
        return devices.getUserScreen()
            .then(stream => {
                this.localScreenShareStream = stream;
                return new Promise((resolve) => {
                    resolve();
                });
            })
            .catch(error => {
                this.localScreenShareStream = null;
                return new Promise((reject) => {
                    reject();
                });
            });
    },

    isFirefox: function() {
        var mediaSourceSupport = !!navigator.mediaDevices.getSupportedConstraints().mediaSource;
        var matchData = navigator.userAgent.match(/Firefox\/(\d+)/);
        var firefoxVersion = 0;
        if (matchData && matchData[1]) {
            firefoxVersion = parseInt(matchData[1], 10);
        }
        return mediaSourceSupport && firefoxVersion >= 52;
    },
      
    isChrome: function() {
        return 'chrome' in window;
    },
      
    canScreenShare: function() {
        return devices.isChrome() || devices.isFirefox();
    },
    
    getUserScreen: function() {
        if (!devices.canScreenShare()) {
            return;
        }
        if (devices.isChrome()) {
            return navigator.mediaDevices.getDisplayMedia({
                audio: true,
                video: true
            });
        } else if (devices.isFirefox()) {
            return navigator.mediaDevices.getUserMedia({
                video: {
                    mediaSource: 'screen'
                }
            });
        }
    }
};

$(document).ready(function() {
    devices.init();
});