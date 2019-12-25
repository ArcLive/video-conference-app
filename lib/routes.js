var storage = require('./storage');
var multer = require('multer');
var fs = require('fs');
var upload = multer({dest: 'uploads/'});

module.exports = function (app) {

    /**
     * get: create a room
     */
    app.get('/create', function (req, res) {
        console.log('/create');

        var room = storage.create_room(storage.generate_room_id());
        res.cookie('uuid', room.owner);
        res.render('create', {
            base_url: process.env.BASE_URL,
            room_id: room.room_id
        });
    });

    /**
     * post: join room as owner
     */
    app.post('/:room_id(*I)', function (req, res) {
        var room = storage.find_room(req.params.room_id);
        if (!room) {
            console.log('<> Invalid room');
            return res.render('404');
        }

        var uuid = req.cookies.uuid;
        if (uuid != room.owner) {
            console.log('<> Invalid owner');
            return res.render('404');
        }

        room.room_name = req.param('room_name');

        res.render('studio', {
            is_owner: true,
            base_url: process.env.BASE_URL,
            room_name: room.room_name,
            room_id: room.room_id,
            uuid: uuid,
            janus_api_url: process.env.JANUS_API_URL,
            env: process.env.NODE_ENV,
            room_janus_id: room.room_janus_id
        });
    });

    /**
     * rejoin room as owner(saved cookie) or join room as a guest
     */
    app.get('/:room_id(*I)', function (req, res) {
        var room = storage.find_room(req.params.room_id);
        if (!room) {
            console.log('<> Invalid room');
            return res.render('404');
        }

        var uuid = req.cookies.uuid;
        if (uuid != room.owner || (uuid == room.owner && room.active(uuid))){
            console.log('<> New guest');
            uuid = room.create_user();
            res.cookie('uuid', uuid);
        }

        // res.render('studio', {
        res.render('studio', {
            is_owner: room.owner == uuid,
            base_url: process.env.BASE_URL,
            room_name: room.room_name,
            room_id: room.room_id,
            uuid: uuid,
            janus_api_url: process.env.JANUS_API_URL,
            env: process.env.NODE_ENV,
            room_janus_id: room.room_janus_id
        });
    });

    /**
     * rejoin room as owner(saved cookie) or join room as a guest
     */
    app.get('/:room_id(*I)/LIVE', function (req, res) {
        var room = storage.find_room(req.params.room_id);
        if (!room) {
            console.log('<> Invalid room');
            return res.render('404');
        }

        var uuid = req.cookies.uuid;
        if (uuid != room.owner || (uuid == room.owner && room.active(uuid))){
            console.log('<> New guest');
            uuid = room.create_live_user();
            res.cookie('uuid', uuid);
        }

        // res.render('studio', {
        res.render('live', {
            is_owner: room.owner == uuid,
            base_url: process.env.BASE_URL,
            room_name: room.room_name,
            room_id: room.room_id,
            uuid: uuid,
            janus_api_url: process.env.JANUS_API_URL,
            env: process.env.NODE_ENV,
            room_janus_id: room.room_janus_id
        });
    });

    /**
     * post background file upload
     */
    app.post('/upload/background', upload.single('file'), function(req, res) {
        fs.rename(req.file.path, `public/img/background/${req.file.originalname}`, function(err) {
            if (err) return res.send({status: err});
            return res.send({status: 1, html:
                `<div class="background-image">
                    <img src="/img/background/${req.file.originalname}" style="width: 100%; height: 100%;">
                    <div class="background-image-options">
                        <i class="material-icons background-add" style="color: white;">add_circle_outline</i>
                        <i class="material-icons background-remove" style="color: white;">remove_circle_outline</i>
                    </div>
                </div>`});
        });
    });

    /**
     * post logo file upload
     */
    app.post('/upload/logo', upload.single('file'), function(req, res) {
        fs.rename(req.file.path, `public/img/logo/${req.file.originalname}`, function(err) {
            if (err) return res.send({status: err});
            return res.send({status: 1, html:
                `<div class="logo-image">
                    <img src="/img/logo/${req.file.originalname}" style="width: 100%; height: 100%;">
                    <div class="logo-image-options">
                        <i class="material-icons logo-add" style="color: white;">add_circle_outline</i>
                        <i class="material-icons logo-remove" style="color: white;">remove_circle_outline</i>
                    </div>
                </div>`});
        });
    });

    /**
     * post present file upload
     */
    app.post('/upload/present', upload.single('file'), function(req, res) {
        fs.rename(req.file.path, `public/vid/present/${req.file.originalname}`, function(err) {
            if (err) return res.send({status: err});
            return res.send({status: 1, html:
                `<div class="present-video">
                    <video src="/vid/present/${req.file.originalname}" style="width: 100%; height: 100%;"></video>
                    <div class="present-video-options">
                        <i class="material-icons present-add" style="color: white;">add_circle_outline</i>
                        <i class="material-icons present-remove" style="color: white;">remove_circle_outline</i>
                    </div>
                </div>`});
        });
    });

    /**
     * get server status
     */
    app.get('/api/status', function(req, res) {
        res.render('status', {
            base_url: process.env.BASE_URL,
            rooms: storage.get_all_rooms()
        });
    });
}