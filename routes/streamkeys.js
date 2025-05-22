const debug = require('debug')('tgrgbox:streamkeys');
var express = require('express');
var router = express.Router();

module.exports = function(config) {
    var renderData = require('../utils/renderdata')(config);
    debug('Player config is %O', config);

    router.get('/', function(req, res, next) {
        var data = renderData(req.session);
        debug('render data is %O', data);
        res.render('streamkeys', data);
    });
    return router;
}
