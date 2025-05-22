var debug = require('debug')('tgrgbox:renderdata');
var nodeUrl = require('node:url');
var nodePath = require('node:path');
const { url } = require('node:inspector');

const { inspect } = require('node:util');
inspect.defaultOptions.depth = 10;



module.exports = function(config) {
    function makeStreamUrl(url, app, stream, file) {
        //debug('makeStreamUrl(%O, %O, %O, %O)', url, app, stream, file);
        var path = file ? nodePath.join(app, stream, file) : nodePath.join(app, stream);
        //there may be a path at the end of url, so extract that and add it to the path
        var urlPath = new URL(url);
        if (urlPath.pathname) {
            path = nodePath.join(urlPath.pathname, path);
        }
        var streamUrl = new URL(path, url);
        //add the stream key
        streamUrl.searchParams.append('streamSecret', config.streamSecret);
        //debug('makeStreamURL returning %O', streamUrl);
        return streamUrl.href;
    }

    function makeRtmpUrl(url, app, streamkey) {
        return new URL(app, url).href;
    }

    function makeSrtUrl(url, app, streamkey) {
        //SRT urls are crazy:
        //
        //srt://host:port?streamid=[srt://host:port/app/stream]
        //
        //the part in the brackets is url encoded (with percents)

        var path = nodePath.join(app, streamkey);
        var streamid = new URL(path, url).href;
        var srtUrl = new URL(url);
        srtUrl.searchParams.append('streamid', encodeURI(streamid));
        return srtUrl.href;
    }

    function makeWhipUrl(url, app, streamkey) {
        //OME requires the real url /app/something (can be anything).  It also requires a query parameter direction=whip
        //The admission webhook doesn't seem to pass the bearer token to the hook (or it gets eaten by something),
        //so pass in the streamkey as the "something"

        //Test this with https://demo.ovenplayer.com/demo_input.html
        var path = nodePath.join(app, streamkey);
        var whipUrl = new URL(path, url);
        whipUrl.searchParams.append('direction', 'whip');
        return whipUrl.href;
    }

    function buildDataForStream(session) {
        debug('session in buildDataForStream is %O', session);
        //make a map of stream sources from the config.  This is the list of streams that can be viewed
        var streamSources = new Map(config.streams.map( (stream) => {
            var sources = Array.from(config.urls.values()).map( (url) => ({ 'label': url.name,
                'type': url.protocol,
                'file': makeStreamUrl(url.url, stream.app, stream.stream, url.file)}));
            return [ stream.stream, {
                'name': stream.name,
                'key': stream.stream,
                'title': stream.title,
                'sources': sources,
                'streamKey': stream.streamKey
            } ];
        }));
        //And this is the list of viewable broadcasts
        var broadcastSources = new Map(config.broadcasts.map( (broadcast) => {
            return [ broadcast.broadcast, {
                'name': broadcast.name,
                'key': broadcast.broadcast,
                'title': broadcast.title,
            } ];
        }));

        /*
        var source = sources.get(streamName);
        if (!source) {
            debug("Sending 404 for %O", streamName);
            return undefined;
        }
            */

        debug()
        var data = { 'renderData' : {
            'userid': session.userid,
            'username': session.user,
            'photoUrl': session.photoUrl,
            'siteName': config.siteName,
            'viewStreams': streamSources,
            'sendStreams' : config.streams.map( (stream) => ({
                'name': stream.name,
                'key': stream.stream,
                'title': stream.title,
                'streamKey': stream.streamKey,
                'rtmp' : makeRtmpUrl(config.ingest.rtmp, stream.app, stream.streamKey),
                'srt' : makeSrtUrl(config.ingest.srt, stream.app, stream.streamKey),
                'whip' : makeWhipUrl(config.ingest.whip, stream.app, stream.streamKey)
            })),
            'broadcasts' : broadcastSources,
            'admins' : config.admins,
        } };
        debug('player.js renderData is %O', data);  
        //debug('player.js renderData is %O', inspect(data, { depth: 10 }));  

        return data;
    }
    return buildDataForStream;
}

