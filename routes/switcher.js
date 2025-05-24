const express = require('express');
const debug = require('debug')('tgrgbox:switcher');

const router = express.Router();

module.exports = function(config) {
    var renderData = require('../utils/renderdata')(config);

    // Handle GET requests
    router.get('/:broadcast', (req, res) => {
        var broadcast = req.params.broadcast;
        var userid = req.session.userid;
        debug(req.session)
        debug(userid);
        debug('Got config.admins %O', config.admins);
        if (config.admins.get(userid).broadcasts.includes(broadcast)) {
            var rData = renderData(req.session);
            debug('Got rData %O', rData.renderData.broadcasts);
            debug('Sources are ' + JSON.stringify(rData.renderData.viewStreams.get('mike').thumbnailSources));
            var data = { 'broadcast': rData.renderData.broadcasts.get(req.params.broadcast),
                         'renderData': rData.renderData
             };
            debug('switcher.js data is %O', data);
            res.render('switcher', data);
        } else {
            res.status(403).send("You are not authorized to view this broadcast");
        }
    });
    return router;
}