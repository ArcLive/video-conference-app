var storage = require('./storage');
var _ = require('underscore');

module.exports = function(io) {
    io.on('connection', client => {
        console.log('socket: client connected');

        /**
         * client data
         */
        var room_id;
        var uuid;
        var is_owner = false;

        /**
         * inline: call Fn in case of v condition
         */
        var validFn = (v, fn) => { v ? fn() : ''; }

        /**
         * user connects to the server
         * all
         */
        client.on('join', (data) => {
            console.log(data);
            if (!data.room_id || !data.uuid || !storage.validate(data.room_id, data.uuid)) return false;

            room_id = data.room_id;
            uuid = data.uuid;

            /**
             * update user data
             */
            var room = storage.find_room(room_id);
            var user = room.find_user(uuid);

            is_owner = room.owner == data.uuid;

            user.client = client;
            user.status = true;

            /**
             * send owner about joined guests
             */
            validFn(is_owner, () => {
                client.emit('update_users', {
                    users: 
                        _.map(room.users,
                            (u) => {return {uuid: u.uuid, display_name: u.display_name, status: u.status}}
                        )
                });
            });

            /**
             * alert owner, new guest has joined
             */
            validFn(!is_owner, () => {
                var owner = room.find_user(room.owner);
                validFn(owner.client, () => {
                    owner.client.emit('join_user', {uuid, live: user.live});
                });
            });

            console.log(`socket: join-> ${uuid}`);
        });

        /**
         * set display name
         * all
         */
        client.on('set_display_name', (data) => {
            if (!data.display_name || !storage.validate(room_id, uuid)) return false;
            
            /**
             * update user's display name in storage
             */
            var room = storage.find_room(room_id);
            var user = room.find_user(uuid);
            user.display_name = data.display_name;

            /**
             * alert owner, users has created or changed someone's display name
             */
            validFn(!is_owner, () => {
                var owner = room.find_user(room.owner);
                validFn(owner.client, () => {
                    owner.client.emit('update_display_name', { uuid, display_name: user.display_name});
                });
            });

            console.log(`socket: set_display_name-> ${uuid} ${user.display_name}`);
        });

        /**
         * update assets
         * owner
         */
        client.on('update_assets', (data) => {
            if (!storage.validate(room_id, uuid) || !is_owner) return false;

            var room = storage.find_room(room_id);
            room.assets[data.key] = data.value;
            /**
             * alert users, owner has destroyed the room
             */
            var obj = {}; obj[data.key] = data.value;
            _.map(room.users, (u) => {
                validFn(u.client, () => {
                    u.client.emit('update_assets', obj);
                });
            });

            console.log(`socket: update_assets-> ${room_id}`);
        });

        /**
         * get scene data
         * user
         */
        client.on('get_scene', () =>{
            if (!storage.validate(room_id, uuid)) return false;

            var room = storage.find_room(room_id);
            
            client.emit('update_scene', room.scene);

            console.log(`socket: get_scene-> ${room_id}`);
        });

        /**
         * get assets data
         * user
         */
        client.on('get_assets', () =>{
            if (!storage.validate(room_id, uuid)) return false;

            var room = storage.find_room(room_id);
            
            client.emit('update_assets', room.assets);

            console.log(`socket: get_assets-> ${room_id}`);
        });

        /**
         * get messages
         * user
         */
        client.on('get_messages', () =>{
            if (!storage.validate(room_id, uuid)) return false;

            var room = storage.find_room(room_id);
            
            client.emit('new_messages', room.messages);

            console.log(`socket: get_assets-> ${room_id}`);
        });

        /**
         * new message
         * user
         */
        client.on('new_message', (data) => {
            if (!storage.validate(room_id, uuid)) return false;

            var room = storage.find_room(room_id);
            room.messages.push(data);
            
            _.map(room.users, (u) => {
                validFn(u.client, () => {
                    u.client.emit('new_messages', [data]);
                });
            });

            console.log(`socket: new_message-> ${room_id}`);
        });

        /**
         * destroy room
         * owner
         */
        client.on('destroy_room', () => {
            if (!storage.validate(room_id, uuid) || !is_owner) return false;

            var room = storage.find_room(room_id);
            /**
             * alert all users, owner has destroyed the room
             */
            _.map(room.users, (u) => {
                validFn(u.client, () => {
                    u.client.emit('destroy_room');
                });
            });

            storage.destroy_room(room_id);

            console.log(`socket: destroy_room-> ${room_id}`);
        });

        /**
         * update scene
         * owner
         */
        client.on('update_scene', (data) => {
            if (!storage.validate(room_id, uuid) || !is_owner) return false;

            var room = storage.find_room(room_id);

            room.scene = data;

            /**
             * alert users, owner has changed scene
             */
            _.map(_.filter(room.users, (u) => {return u.uuid != uuid;}), (u) => {
                validFn(u.client, () => {
                    u.client.emit('update_scene', data);
                });
            });

            console.log(`socket: update_scene-> ${room_id}`);
        });

        /**
         * update devices; start/stop camera, mute/unmute mic
         * all
         */
        client.on('update_devices', (data) => {
            if (!storage.validate(room_id, uuid)) return false;

            var room = storage.find_room(room_id);
            /**
             * alert users, user has start camera
             */
            // _.map(_.filter(room.users, (u) => {return u.uuid != uuid;}), (u) => {
            _.map(_.filter(room.users, (u) => {return true;}), (u) => {
                validFn(u.client, () => {
                    u.client.emit('update_devices', _.extend(data, {uuid}));
                });
            });

            console.log(`socket: update_devices-> ${uuid} ${data.kind} ${data.status}`);
        });

        /**
         * kick user
         * owner
         */
        client.on('kick_user', (data) =>{
            if (!data.uuid || !storage.validate(room_id, uuid) || !is_owner) return false;

            var room = storage.find_room(room_id);
            /**
             * alert user, owner kicks you
             */
            var user = _.findWhere(room.users, {uuid: data.uuid});
            validFn(user && user.client, () => {
                user.client.emit('kicked');
            });
        });

        /**
         * disconnect
         * all
         */
        client.on('disconnect', () => {
            console.log(`room_id: ${room_id} uuid: ${uuid}`);

            if (!storage.validate(room_id, uuid)) return false;

            /**
             * update user status
             */
            var room = storage.find_room(room_id);
            var user = room.find_user(uuid);
            user.status = false;

            /**
             * alert users except left user, user has left
             */
            validFn(!is_owner, () => {
                room.destroy_user(uuid);

                var owner = room.find_user(room.owner);
                validFn(owner.client, () => {
                    owner.client.emit('left_user', {uuid});
                });
            });

            console.log(`socket: user offline-> ${uuid}`);
        });
    });
}