var studio = {
    setupScreenEl: null,
    mainScreenEl: null,

    sceneContainerEl: null,
    sceneWrapperEl: null,
    sceneBackgroundEl: null,
    sceneContentEl: null,
    sceneAssetsEl: null,
    ratio: 1,

    banner_item_template: null,

    init: function() {
        studio.setupScreenEl = $('.setup-screen');
        studio.mainScreenEl = $('.main-screen');

        studio.sceneContainerEl = $('#scene-container');
        studio.sceneWrapperEl = $('#scene-wrapper');

        studio.sceneBackgroundEl = $('#scene-background');
        studio.sceneContentEl = $('#scene-content');
        studio.sceneAssetsEl = $('#scene-assets');

        studio.initSidebar();
        studio.initBanner();
        studio.initControl();
        studio.initChat();
        studio.initBrands();
        studio.initUserPreview();

        $('#display-name').on('input', function() {
            $('#preview_display_name').html($(this).val());
        });

        // $('.side-panel-container').mCustomScrollbar({
        //     theme: "minimal-dark"
        // });
        $(window).resize(function() {
            studio.refresh();
        });

        setTimeout(function() {
            $('#display-name').val('LIVE');
            studio.enterStudio();

            $('#scene-wrapper').css('width', '100%');
            $('#scene-wrapper').css('height', '100%');
            $('#scene-wrapper').css('z-index', '2');
            var element = $('#scene-wrapper').detach();
            $('body').prepend(element);
        }, 3000);

        setTimeout(function() {
            $('#main_busy_indicator').hide();
        }, 4000);
    },

    initSidebar: function() {
        $('.side-bar-item').on('click', function() {
            $('.side-bar-item').removeClass('selected');
            $(this).addClass('selected');
            $('.side-panel').hide();
            $(`.side-panel.${$(this).data('target')}`).show();
            if ($(this).hasClass('chat')) {
                $('.message-count').hide();
                $('.message-count').html('0');
                $('.message-list').scrollTop($('.message-list')[0].scrollHeight);
            }
        });
    },

    initBanner: function() {
        studio.banner_item_template = $('.banner-item-template');
        $('.banner-item-template').hide();

        //add new banner
        $('.add-banner-title').on('click', function() {
            $('.add-banner').addClass('editing');
            $('#banner-input').val('');
            M.textareaAutoResize($('#banner-input'));
        });
        $('.add-banner .banner-add').on('click', function() {
            $('.add-banner').removeClass('editing');
            var item = studio.banner_item_template.clone().show().attr('class', 'banner-item');
            item.find('p').html($('#banner-input').val());
            $('.banner-list').append(item);
        });
        $('.add-banner .banner-cancel').on('click', function() {
            $('.add-banner').removeClass('editing');
        });
        $('#banner-input').bind('keypress', function(e) {
            if ((e.keyCode || e.which) == 13) {
                $('.banner-add').click();
            }
        });

        //edit existing banner
        $('body').on('click', '.banner-item-option-edit', function() {
            $(this).closest('.banner-item').addClass('editing');
            $(this).closest('.banner-item').find('.banner-update-content').val($(this).closest('.banner-item').find('p').html());
            M.textareaAutoResize($(this).closest('.banner-item').find('.banner-update-content'));
        });
        $('body').on('click', '.banner-item .banner-update', function() {
            $(this).closest('.banner-item').removeClass('editing');
            $(this).closest('.banner-item').find('p').html($(this).closest('.banner-item').find('.banner-update-content').val());
        });
        $('body').on('click', '.banner-item .banner-cancel', function() {
            $(this).closest('.banner-item').removeClass('editing');
        });
        $('body').on('keypress', '.banner-update-content', function(e) {
            if ((e.keyCode || e.which) == 13) {
                $(this).closest('.banner-item').find('.banner-update').click();
            }
        });

        //delete existing banner
        $('body').on('click', '.banner-item-option-delete', function() {
            $(this).closest('.banner-item').remove();
        });

        //add banner to scene
        $('body').on('click', '.banner-item-option-add', function() {
            $('.banner-item').removeClass('added');
            $(this).closest('.banner-item').addClass('added');
            comm.updateAssets('banner', $(this).closest('.banner-item').find('p').html());
        });

        //remove banner from scene
        $('body').on('click', '.banner-item-option-remove', function() {
            $(this).closest('.banner-item').removeClass('added');
            comm.updateAssets('banner', '');
        });
    },

    initControl: function() {
        $('.control-video').click(function() {
            $(this).find('button.start').toggleClass('hide');
            $(this).find('button.stop').toggleClass('hide');
            $(this).toggleClass('stop');
            if ($(this).hasClass('stop')) {
                comm.updateDevices('video', false);
                // _communicator.stopTrack('video');
            } else {
                comm.updateDevices('video', true);
                // _communicator.startTrack('video');
            }
        });

        $('.control-audio').click(function() {
            $(this).find('button.mute').toggleClass('hide');
            $(this).find('button.unmute').toggleClass('hide');
            $(this).toggleClass('mute');
            if ($(this).hasClass('mute')) {
                comm.updateDevices('audio', false);
                // _communicator.stopTrack('audio');
            } else {
                comm.updateDevices('audio', true);
                // _communicator.startTrack('audio');
            }
        });

        $('.layout-option').click(function() {
            $('.layout-option').removeClass('selected');
            $(this).addClass('selected');
            studio.changeScene();
        });

        $('.control-leave').click(function() {
            comm.destroyRoom();
        });

        $('.control-clear').click(function() {
            $('.userprev').removeClass('added');
            studio.changeScene();
        });

        $('.control-screenshare').click(function() {
            webrtc.screenshare();
        });
    },

    initUserPreview: function() {
        $('body').on('click', '.userprev .kick-user', function() {
            comm.kickUser($(this).closest('.userprev').data('uuid'));
        });

        $('body').on('click', '.userprev .add-scene', function() {
            $(this).closest('.userprev').addClass('added');
            studio.changeScene();
        });
        $('body').on('click', '.userprev .remove-scene', function() {
            $(this).closest('.userprev').removeClass('added');
            studio.changeScene();
        });
    },

    initChat: function() {
        $('.chat-send').on('click', function() {
            if ($('#chat-input').val() == '' || $('#chat-input').val() == '\n') {
                $('#chat-input').val('');
                M.textareaAutoResize($('#chat-input'));
                return;
            }
            comm.newMessage($('#chat-input').val());
            $('#chat-input').val('');
            M.textareaAutoResize($('#chat-input'));
        });
        $('#chat-input').on('keypress', function(e) {
            if ((e.keyCode || e.which) == 13) {
                $('.chat-send').click();
            }
        });
    },

    initBrands: function() {
        $('.color-picker').minicolors({
            control: 'hue',
            change: function(value) {
                if( !value ) return;
                comm.updateAssets($(this).data("key"), value);
            }
        });

        $('input.show_names').on('change', function() {
            if ($(this).is(":checked")) {
                comm.updateAssets('show_names', 1);
            } else {
                comm.updateAssets('show_names', 0);
            }
        });

        $('#background-file').on('change', function() {
            var fd = new FormData($('#background-file-form')[0]);
            $.ajax({
                url: '/upload/background',
                type: 'post',
                data: fd,
                contentType: false,
                processData: false,
                success: function(response){
                    if(response.status) {
                        $(response.html).insertBefore('.background-image-add');
                    } else {
                        alert('Upload Error, Sorry');
                    }
                },
            });
        });

        $('#logo-file').on('change', function() {
            var fd = new FormData($('#logo-file-form')[0]);
            $.ajax({
                url: '/upload/logo',
                type: 'post',
                data: fd,
                contentType: false,
                processData: false,
                success: function(response){
                    if(response.status) {
                        $(response.html).insertBefore('.logo-image-add');
                    } else {
                        alert('Upload Error, Sorry');
                    }
                },
            });
        });

        $('#logo-file').on('change', function() {
            var fd = new FormData($('#logo-file-form')[0]);
            $.ajax({
                url: '/upload/logo',
                type: 'post',
                data: fd,
                contentType: false,
                processData: false,
                success: function(response){
                    if(response.status) {
                        $(response.html).insertBefore('.logo-image-add');
                    } else {
                        alert('Upload Error, Sorry');
                    }
                },
            });
        });

        $('#present-file').on('change', function() {
            if(typeof this.files[0] !== 'undefined') {
                if (this.files[0].size > 3 * 1024 * 1024) {
                    alert("File size exceeds 3MB");
                    return;
                }
            }
            var fd = new FormData($('#present-file-form')[0]);
            $.ajax({
                url: '/upload/present',
                type: 'post',
                data: fd,
                contentType: false,
                processData: false,
                success: function(response){
                    if(response.status) {
                        $(response.html).insertBefore('.present-video-add');
                    } else {
                        alert('Upload Error, Sorry');
                    }
                },
            });
        });

        $('body').on('click', '.background-image', function() {
            if ($(this).hasClass('background-image-add')) return;
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected');
                comm.updateAssets('background', '/img/background/black.png');
            } else {
                $('.background-image').removeClass('selected');
                $(this).addClass('selected');
                comm.updateAssets('background', $(this).find('img').attr('src'));
            }
        });

        $('body').on('click', '.logo-image', function() {
            if ($(this).hasClass('logo-image-add')) return;
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected');
                comm.updateAssets('logo', '');
            } else {
                $('.logo-image').removeClass('selected');
                $(this).addClass('selected');
                comm.updateAssets('logo', $(this).find('img').attr('src'));
            }
        });

        $('body').on('click', '.present-video', function() {
            if ($(this).hasClass('present-video-add')) return;
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected');
                comm.updateAssets('present', '');
            } else {
                $('.present-video').removeClass('selected');
                $(this).addClass('selected');
                comm.updateAssets('present', $(this).find('video').attr('src'));
            }
        });
    },

    enterStudio: function() {
        _global.display_name = $('#display-name').val();

        if (!_global.display_name) {
            alert('You should input display name!');
            return;
        }

        studio.setupScreenEl.toggleClass('hide');
        studio.mainScreenEl.toggleClass('hide');

        if (_global.isOwner) {
            _.findWhere(_global.users, {uuid: _global.uuid}).display_name = display_name;
        }

        webrtc.connect();
        studio.refresh();

        console.log('ZZZ');
        studio.changeScene();
        // _communicator.connect();

        comm.setDisplayName(_global.display_name);
    },

    refresh: function() {
        if (window.innerWidth < 960) {
            $('.toolbar').css('height', '120px');
            studio.sceneContainerEl.parent().css('height', 'calc(100% - 240px)');
        } else {
            $('.toolbar').css('height', '60px');
            studio.sceneContainerEl.parent().css('height', 'calc(100% - 210px)');
        }

        if (parseInt(studio.sceneWrapperEl.css('height')) < parseInt(studio.sceneContainerEl.css('height'))) {
            studio.sceneWrapperEl.css('height', `${parseInt(studio.sceneContainerEl.css('height'))}px`);
        }
        studio.sceneWrapperEl.css('width', `${parseInt(studio.sceneWrapperEl.css('height')) * 1.7}px`);
        if (parseInt(studio.sceneWrapperEl.css('width')) > parseInt(studio.sceneContainerEl.css('width'))) {
            studio.sceneWrapperEl.css('width', `${parseInt(studio.sceneContainerEl.css('width'))}px`);
            studio.sceneWrapperEl.css('height', `${parseInt(studio.sceneContainerEl.css('width')) / 1.7}px`);
        }
    },

    changeScene: function() {
        var uuids = [];
        $('.userprev.added').each(function(i, user){
            uuids.push({
                uuid: $(user).data('uuid'),
                display_name: $(user).find('.name').html(),
                type: $(user).data('type')
            });
        });
	    // Added by Daniil Makeev:
	    // Add screenshots to uuids list
        $('.userscreenprevs.added').each(function(i, user){
            uuids.push({
                uuid: $(user).data('uuid'),
                display_name: $(user).find('.name').html(),
                type: $(user).data('type')
            });
        });
	// end of fix

        var option = $('.layout-option.selected').data('option');

        comm.updateScene(uuids, option);
        studio.updateScene(uuids, option);
    },

    updateScene: function(uuids, option) {
        studio.sceneContentEl.empty();

        if (!uuids.length) return;

        var _userprevs = [];
        var _userscreenprevs = [];

        _userprevs = _.filter(uuids, (u) => { return u.type == 'cam'});
        _userscreenprevs = _.filter(uuids, (u) => { return u.type == 'screen'});

        // if (option == 1 || _userprevs.length == 1) {
        // Update by Daniil Makeev
        // Layout doesn't work if only one participant with screenshot exists
        if (option == 1 || (_userprevs.length + _userscreenprevs.length) == 1) {
        // end of fix
            _userprevs = _userprevs.slice(0, 1);
            option = 1;
        } else if ((option == 1 && _userprevs.length > 1 && _userprevs.length < 4) || (option == 2 && _userprevs.length < 4)) {
            option = 2;
        } else if ((option == 1 && _userprevs.length > 1 && _userprevs.length == 4) || (option == 2 && _userprevs.length == 4)) {
            option = 3;
        } else if (option == 3) {
            option = 4;
        } else if (option == 4) {
            option = 5;
        } else if (option == 5) {
            option = 6;
        }

        studio.sceneContentEl.attr('class', `flexoption-${option}`);

        if (option < 5) {
            for (var i = 0; i< _userprevs.length; i++) {
                studio.sceneContentEl.append($(`<div class="userscene" id="userscene-${_userprevs[i].uuid}" data-uuid="${_userprevs[i].uuid}"></div>`));
            }
        } else if (option == 5) {
            studio.sceneContentEl.append($(`<div class="userscene" id="userscene-${_userprevs[0].uuid}" data-uuid="${_userprevs[0].uuid}"></div>`));
            var side = $('<div class="side"></div>');
            for (var i = 1; i< _userprevs.length; i++) {
                side.append($(`<div class="userscene" id="userscene-${_userprevs[i].uuid}" data-uuid="${_userprevs[i].uuid}"></div>`));
            }
            // Update by Daniil Makeev
            // Layout doesn't work if only one participant with screenshot exists
            for (var i = 0; i< _userscreenprevs.length; i++) {
                side.append($(`<div class="userscene" id="userscene-${_userprevs[i].uuid}-screen" data-uuid="${_userprevs[i].uuid}-screen"></div>`));
            }
            // end of fix
            studio.sceneContentEl.append(side);
        } else if (option == 6) {
            studio.sceneContentEl.append($(`<div class="userscene" id="userscene-${_userscreenprevs[0].uuid}" data-uuid="${_userscreenprevs[0].uuid}"></div>`));
        }

        $('.userscene').each(function(i, userscene) {
            var display_name = _.findWhere(uuids, {uuid: $(userscene).data('uuid')}).display_name;
            $(userscene).append(`<div class="display-name"><p class="name white-text f600">${display_name}</p></div>`);

            studio.loadStream(userscene);
        });
    },

    loadStream: function(userscene) {
        var uuid = $(userscene).data('uuid');

        //console.log(uuid);
        if (uuid == _global.uuid) { //mine
            var video = $('<video autoplay></video>');
            video.muted = "muted";
            video[0].srcObject = new MediaStream(webrtc.localStream.getVideoTracks());
            $(userscene).append(video);
        } else if (uuid == `${_global.uuid}-screen`) {
            var video = $('<video autoplay></video>');
            video.muted = "muted";
            // video[0].srcObject = new MediaStream(devices.localScreenShareStream.getVideoTracks());
            //video[0].srcObject = devices.localScreenShareStream;
            video[0].srcObject = new MediaStream(webrtc.localScreenStream.getVideoTracks());
            $(userscene).append(video);
        } else {
            if (webrtc.streams[uuid]) {
                var video = $('<video autoplay></video>');
                video[0].srcObject = webrtc.streams[uuid];
                $(userscene).append(video);
            } else { //before load 500ms x 10 times loading
                $(userscene).data('count',
                    $(userscene).data('count') != undefined ?
                        parseInt($(userscene).data('count')) + 1 :
                        0
                );
                if (parseInt($(userscene).data('count')) <= 10) {
                    setTimeout(() => {
                        studio.loadStream(userscene);
                    }, 500);
                }
            }
        }
    },

    get: function (el, className) {
        return $(el).find(className);
    },

    updateAssets: function(assets) {
        for (let prop in assets) {
            if (prop == 'banner') {
                if (assets[prop] != '') {
                    studio.sceneAssetsEl.show();
                    studio.get(studio.sceneAssetsEl, '.banner').hide();
                    studio.get(studio.sceneAssetsEl, '.banner.asset-banner').show();
                    studio.get(studio.sceneAssetsEl, '.banner.asset-banner p').html(assets[prop]);
                } else {
                    studio.sceneAssetsEl.hide();
                    studio.get(studio.sceneAssetsEl, '.banner').hide();
                }
            }
            if (prop == 'bg_color') {
                $('#scene-assets').css('background-color', assets[prop]);
            }
            if (prop == 'text_color') {
                $('.asset-banner p').css('color', assets[prop]);
            }
            if (prop == 'show_names') {
                if (assets[prop]) $('#scene-wrapper').removeClass('hide_names');
                else $('#scene-wrapper').addClass('hide_names');
            }
            if (prop == 'background') {
                $('#scene-background').attr('src', assets[prop]);
            }
            if (prop == 'logo') {
                if (assets[prop] != '') {
                    $('#logo').show();
                    $('#logo').attr('src', assets[prop]);
                } else {
                    $('#logo').hide();
                }
            }
            if (prop == 'present') {
                if (assets[prop] != '') {
                    $('#present').show();
                    $('#present').attr('src', assets[prop]);
                    $('#present').on('loadstart', function (event) {
                        $(this).addClass('loading');
                    });
                    $('#present').on('canplay', function (event) {
                        $(this).removeClass('loading');
                        this.play();
                    });
                } else {
                    $('#present').attr("src", "");
                    $('#present').hide();
                }
            }
        }
    },

    joinUser: function(uuid) {
        // $(`#userprev-${uuid}`).show();
        console.log(123434333333333333333);
        studio.changeScene();
    },

    removeUser: function(uuid) {
        $(`#userprev-${uuid}`).remove();
        studio.changeScene();
    },

    updateDevices: function(uuid, kind, status) {
        const addClass = (el, cl) => { !el.hasClass(cl) ? el.addClass(cl) : ''; }
        const removeClass = (el, cl) => { el.hasClass(cl) ? el.removeClass(cl): ''; }

        if (kind == 'video')
            !status ? addClass($(`#preview-${uuid}`), 'stop') : removeClass($(`#preview-${uuid}`), 'stop');
        else
            !status ? addClass($(`#preview-${uuid}`), 'mute') : removeClass($(`#preview-${uuid}`), 'mute');

        if (kind == 'video') {
            !status ? addClass($(`#userscene-${uuid}`), 'stop') : removeClass($(`#userscene-${uuid}`), 'stop');
        }
    },

    newMessages: function(messages) {
        var item = null;
        messages.forEach(message => {
            if (message.uuid == _global.uuid) {
                var message_item_sent_template = $('.message-item-sent-template');
                item = message_item_sent_template.clone().attr('class', 'message-item-sent');
                item.find('.message-item-content').html(message.content);
                $('.message-list').append(item.show());
            } else {
                var message_item_receive_template = $('.message-item-receive-template');
                item = message_item_receive_template.clone().attr('class', 'message-item-receive');
                item.find('.message-item-content').html(message.content);
                item.find('.message-item-author').html(message.display_name);
                $('.message-list').append(item.show());
            }
        });
        if (item) {
            $('.message-list').animate({scrollTop: $('.message-list')[0].scrollHeight}, 500);
        }
        if (!$('.side-bar-item.chat').hasClass('selected')) {
            var count = parseInt($('.message-count').html()) + data.length;
            $('.message-count').html(`${count < 9 ? count : '9+'}`);
            $('.message-count').show();
        } else {
            $('.message-count').hide();
        }
    },

    updateDisplayName: function(uuid, display_name) {
        $(`#userprev-${uuid} .name`).html(display_name);
    },

    updateUsers: function() {
        console.log(1222222222222222222222222222);
        _.each(_global.users, (u) => {
            $(`#userprev-${u.uuid} .name`).html(u.display_name);
        });
    },

    changeDevices: function() {
        $('#video-preview')[0].srcObject = new MediaStream(devices.localMediaStream.getVideoTracks());
        if ($(`#userprev-${_global.uuid}`).find('video').length) {
            $(`#userprev-${_global.uuid}`).find('video')[0].srcObject = new MediaStream(devices.localMediaStream.getVideoTracks());
        }
        if ($(`#userscene-${_global.uuid}`).find('video').length) {
            $(`#userscene-${_global.uuid}`).find('video')[0].srcObject = new MediaStream(devices.localMediaStream.getVideoTracks());
        }
        webrtc.restartPublish();
    },

    previewMedia: function() {
        var audioVolume = $('#audio-volume');
        var audioStatus = $('#audio-status');
        audioVolume.css('height', '0%');
        audioStatus.html('Checking...');

        var stream = devices.localMediaStream;

        $('#video-preview')[0].srcObject = new MediaStream(stream.getVideoTracks());
        // $('#video-preview')[0].muted = "muted";

        audioStatus.html('Mic. is working');
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;

        microphone.connect(analyser);
        analyser.connect(javascriptNode);
        javascriptNode.connect(audioContext.destination);
        javascriptNode.onaudioprocess = function () {
            var array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            var values = 0;

            var length = array.length;
            for (var i = 0; i < length; i++) {
                values += (array[i]);
            }

            var average = Math.round(values / length);
            audioVolume.css('height', `${Math.min(average, 96)}`);
        }

        $('.control-audio').click(function() {
            if ($(this).hasClass('mute')) stream.getAudioTracks()[0].enabled = false;
            else stream.getAudioTracks()[0].enabled = true;
        });

        common.hideBusyLoad();
    },

    removeUserprev: function(identity) {
        if (!_global.is_owner) return;
        $(`div#userprev-${identity}`).remove();
    },

    updateUserscene: function(identity, stream) {
        var node = $(`div#userscene-${identity}`);
        if (node.length && stream) {
            node.find('video')[0].srcObject = stream;
        }
    },

    addUserprev: function(identity, stream, mine, type) {
        if (!_global.is_owner && !mine) return;
        var node = $(`div#userprev-${identity}`);
        if (!node.length) {
            //userprev
            node = $(`
                <div id="userprev-${identity}"
                    class="userprev ${mine ? 'mine' : ''}"
                    data-uuid="${identity}"
                    data-type="${type}">
                </div>`);

            //display name
            var user = _.findWhere(_global.users, {uuid: identity});
            node.append($(`
                <div class="display-name">
                    <p class="name truncate grey-text text-darken-2 f600">
                        ${mine ? _global.display_name : ((user && user.display_name) ? user.display_name : 'Guest')} ${type == 'screen' ? "'s Screen" : ""}
                    </p>
                </div>`));

            //device status
            node.append($(`
                <div class="device-status">
                    <i class="material-icons mic-off">mic_off</i><i class="material-icons mic-on">mic</i>
                    <i class="material-icons videocam-off">videocam_off</i><i class="material-icons videocam-on">videocam</i>
                </div>`));

            if (_global.is_owner) {
                node.append($(`
                    <div class="option">
                        <a class="btn-floating btn-small waves-effect waves-light blue add-scene"><i class="material-icons">add</i></a>
                        <a class="btn-floating btn-small waves-effect waves-light red remove-scene"><i class="material-icons">remove</i></a>
                        ${!mine ? '<a class="btn-floating btn-small waves-effect waves-light red kick-user"><i class="material-icons">delete</i></a>}' : ''}
                    </div>`));
            }

            //video element
            node.append($(`<video autoplay></video>`));
        }
        if (stream) {
            node.find('video')[0].srcObject = new MediaStream(stream.getVideoTracks());
        }
        if (type == 'cam') {
            $('#userprevs').append(node);
        } else {
            $('#userscreenprevs').append(node);
        }
    }
};

$(document).ready(function() {
    studio.init();
});
