var randomstring = require('randomstring');
var _ = require('underscore');
var uid = require('gen-uid');

class Room {
    constructor(room_id, max_users_count) {
        this.room_id = room_id;
        this.max_users_count = max_users_count;
        this.owner = `${Math.floor(Math.random() * Math.floor(999999999))}`;
        this.users = [{uuid: this.owner, display_name: 'Owner'}];
        this.room_name = 'Hello';
        this.sockets = {};
        this.scene = null;
        this.messages = [];
        this.assets = {};
        this.room_janus_id = `${Math.floor(Math.random() * Math.floor(999999999))}`;
    }

    get_room_id() {
        return this.room_id;
    }

    create_user() {
        var uuid = `${Math.floor(Math.random() * Math.floor(999999999))}`;
        this.users.push({uuid: uuid, display_name: 'Guest'});
        return uuid;
    }

    create_live_user() {
        var uuid = `${Math.floor(Math.random() * Math.floor(999999999))}`;
        this.users.push({uuid: uuid, display_name: 'Live', live: 1});
        return uuid;
    }

    find_user(uuid) {
        return _.findWhere(this.users, {uuid});
    }

    verify_user(uuid) {
        return _.findWhere(this.users, {uuid}) != undefined;
    }

    destroy_user(uuid) {
        var index = _.findIndex(this.users, function(user) { return user.uuid == uuid; });
        if (index >= 0) this.users.splice(index, 1);
    }

    active(uuid) {
        console.log(uuid, _.findWhere(this.users, {uuid}));
        return _.findWhere(this.users, {uuid}).status;
    }
}

module.exports = {
    rooms: [],

    generate_room_id: function() {
        var room_id = `${randomstring.generate(12)}I`;
        while(_.findWhere(this.rooms, {room_id: room_id}) !== undefined) room_id = `${randomstring.generate(12)}I`;
        return room_id;
    },

    create_room: function(room_id) {
        var room = new Room(room_id, 4);
        this.rooms.push(room);
        return room;
    },

    find_room: function(room_id) {
        return _.findWhere(this.rooms, {room_id});
    },

    destroy_room: function(room_id) {
        var index = _.findIndex(this.rooms, function(room) { return room.room_id == room_id; });
        if (index >= 0) this.rooms.splice(index, 1);
    },

    validate: function(room_id, uuid) {
        var room = this.find_room(room_id);
        if (!room || !room.verify_user(uuid)) return false;
        return true;
    },

    get_all_rooms: function() {
        return _.map(this.rooms, (room) => {
            return {
                room_id: room.room_id,
                users: _.map(room.users, (u) => {
                    return {uuid: u.uuid, display_name: u.display_name, status: u.status};
                })
            };
        });
    },
};