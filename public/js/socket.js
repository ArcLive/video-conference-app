var comm = {
    base_url: '',
    socket: null,

    init: function() {
        comm.socket = io(_global.base_url);
        comm.socket.on('connect', function() {
            comm.socket.emit('join', { room_id: _global.room_id, uuid: _global.uuid });

            comm.socket.on('update_assets', function(data) {
                console.log(1111, data);
                studio.updateAssets(data);
            });

            comm.socket.on('join_user', function(data) {
                _global.users.push({uuid: data.uuid});
                studio.joinUser(data.uuid);
            });

            comm.socket.on('left_user', function(data) {
                _global.users.splice(_.findIndex(_global.users, (u) => {return u.uuid == data.uuid;}), 1);
                studio.removeUser(data.uuid);
            });

            comm.socket.on('update_devices', function(data) {
                studio.updateDevices(data.uuid, data.kind, data.status);
            });

            comm.socket.on('new_messages', function(data) {
                studio.newMessages(data);
            });

            comm.socket.on('update_scene', function(data) {
                if (data) studio.updateScene(data.uuids, data.option);
            });

            comm.socket.on('update_users', function(data) {
                _global.users = data.users;
                studio.updateUsers();
            });

            comm.socket.on('update_display_name', (data) => {
                var user = _.findWhere(_global.users, {uuid: data.uuid});
                if (user) {
                    user.display_name = data.display_name;
                    studio.updateDisplayName(data.uuid, data.display_name);
                }
            });

            comm.socket.on('destroy_room', () => { location.href="/"; });
            comm.socket.on('kicked', () => { location.href="/"; });
        });
    },

    setupScreen: function() {
        if (!_global.is_owner) {
            comm.socket.emit('get_scene');
            comm.socket.emit('get_assets');
            comm.socket.emit('get_messages');
        }
    },

    setDisplayName: function(display_name) {
        comm.socket.emit('set_display_name', {display_name});
    },

    updateScene: function(uuids, option) {
        comm.socket.emit('update_scene', {uuids, option});
    },

    updateDevices: function(kind, status) {
        comm.socket.emit('update_devices', {kind, status});
    },

    kickUser: function(uuid) {
        comm.socket.emit('kick_user', {uuid});
    },

    updateAssets: function(key, value) {
        comm.socket.emit('update_assets', {key, value});
    },

    newMessage: function(message) {
        comm.socket.emit('new_message', {
            uuid: _global.uuid,
            display_name: _global.display_name,
            content: message
        });
    },

    destroyRoom: function() {
        comm.socket.emit('destroy_room');
    }
};

$(document).ready(function() {
    comm.init();
});
