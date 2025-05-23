const express = require('express');
const debug = require('debug')('tgrgbox:broadcast');

const router = express.Router();

module.exports = function(config) {


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
        //TODO: error checking for stream exists
        broadcastMap.set(req.params.broadcast, req.params.stream);
        res.json({ [req.params.broadcast]: broadcastMap.get(req.params.broadcast)});
    });

    return { router: router,
             getBroadcastMap: getBroadcastMap
        };
}