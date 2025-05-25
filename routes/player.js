const debug = require('debug')('tgrgbox:config');
var express = require('express');
var router = express.Router();


module.exports = function(config, broadcastMap) {
    var renderData = require('../utils/renderdata')(config);
    debug("Player config is %O", config);

    /* GET player. */
    router.get('/', function(req, res, next) {
        debug("Session data in router is %O", req.session);
        debug("Session id in router is %O", req.session.id);
        var data = { 'renderData': renderData(req.session).renderData,
                     'broadcastMap': broadcastMap };
        debug('player.js data is %O', data);
        res.render('player', data);
    });
    /*
    router.get('/:stream', function(req, res, next) {
        debug("Got stream name %O", req.params);
        var data = renderData(req.session, req.params.stream);
        if (!data) {
            res.status(404).send("Cannot find stream " + req.params.stream);
            return;
        }
        debug('player.js data is %O', data);
        res.render('player', data);
    });
    */
    return router;
}
