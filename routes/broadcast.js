const express = require('express');
const debug = require('debug')('tgrgbox:broadcast');

const router = express.Router();

module.exports = function(config, io) {


    debug('Broadcast config is %O', config.broadcasts);
    var broadcastMap = new Map();
    config.broadcasts.forEach((bc) => broadcastMap.set(bc.name, bc.streams[0]));

    function getBroadcastMap() {
        return broadcastMap;
    }

    // Handle GET requests
    router.get('/', (req, res) => {
        res.json(Object.fromEntries(broadcastMap.entries()));
    });

    // Handle POST requests
    router.post('/:broadcast/:stream', (req, res) => {
        //make sure the context user has access to the broadcast
        if (!config.admins.get(req.session.userid).broadcasts.includes(req.params.broadcast)) {
            res.status(403).send("You are not authorized to view this broadcast");
            return;
        }
        //TODO: error checking for stream exists
        broadcastMap.set(req.params.broadcast, req.params.stream);

        //send the updated map to all connected clients.
        debug('Broadcasting update to all clients: %O', broadcastMap);
        io.emit('broadcastMap', Object.fromEntries(broadcastMap.entries()));

        res.json({ [req.params.broadcast]: broadcastMap.get(req.params.broadcast)});
    });

    //set up a socket.io listener to transmit broadcast changes
    io.on('connection', (socket) => {
        //whenever a client connects, immediately send them the current broadcast map.
        debug('Socket connected for broadcast updates');
        socket.send('broadcastMap', Object.fromEntries(broadcastMap.entries()));
    });


    return { router: router,
             getBroadcastMap: getBroadcastMap
        };
}