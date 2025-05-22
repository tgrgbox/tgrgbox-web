const debug = require('debug')('tgrgbox:omeapi');
var express = require('express');
var router = express.Router();
var nodeUrl = require('node:url');
var nodePath = require('node:path');
var crypto = require('crypto');


module.exports = function(config) {
    const defaultStreamTime = 24 * 60 * 60 * 1000; //24 hours, in msec
    router.use(express.text( {type: '*/*'}));
    router.post('/', function(req, res, next) {
        //for rtmp, take the stream key and remap it to the stream name with new_url
        debug("Post headers are %O", req.headers);
        debug("Post body is %O", req.body);
        //verify the signature
        var hmac = crypto.createHmac('sha1', config.apiKey);
        hmac.update(req.body);
        //this replace crap is honestly how OME does it (it replaces the characters and ditches the padding)
        //https://github.com/AirenSoft/OvenMediaEngine/blob/master/src/projects/base/ovcrypto/base_64.cpp
        var bodyDigest = hmac.digest('base64').replaceAll('+', '-').replaceAll('/', '_').replaceAll(/=*$/g, '');
        debug('body Digest is %O', bodyDigest);
        var response = {};
        var headerDigest = req.headers['x-ome-signature'];
        if ( headerDigest === bodyDigest) {
            var apireq = JSON.parse(req.body);
            debug("Parsed body");
            if (apireq.request.direction == 'incoming') {
                //incoming requests are for RTMP and WebRTC.  Validate that the last last part
                //of the url is the stream key and replace it with the stream name 
                var url = new URL(apireq.request.url);
                var streamKey = nodePath.basename(url.pathname);
                var streamName = nodePath.dirname(url.pathname);
                console.log('streams is %O', config.streams);
                var stream = config.streams.find((stream) => stream.streamKey === streamKey);
                if (stream) {
                    response.allowed = true;
                    response.lifetime = defaultStreamTime;

                    url.pathname = nodePath.join(streamName, stream.stream);
                    response.new_url = url.href;
                } else {
                    response.allowed = false;
                    response.reason = 'Stream key ' + streamKey + ' was not found in config';
                    console.log('incoming stream rejected: ' + response.reason);
                }

            } else {
                //for outgoing requests, verify that the url contains the stream key as a query paramter
                var url = new URL(apireq.request.url);
                var streamSecret = url.searchParams.get('streamSecret');
                var response = {};
                if (streamSecret == config.streamSecret) {
                    response.allowed = true;
                //remove the stream key and redirect
                    url.searchParams.delete('streamSecret');
                    debug('searchParams are %O', url.searchParams);
                    response.new_url = url.href;
                    response.lifetime = defaultStreamTime;
                } else {
                    response.allowed = false;
                    response.reason = 'Stream key for playback didn\'t match';
                    console.log('outgoing stream rejected: ' + response.reason);
                }
            }
        } else {
            //signature mismatch
            response.allowed = false;
            response.reason = 'X-OME-Signature mismatch';
            console.log('API signature mismatch: ' + headerDigest + ' != ' + bodyDigest );
        }
        debug('API Response: %O', response);
        res.json(response);
    });
    return router;
}
