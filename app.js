var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var debug = require('debug')('tgrgbox:app');
const { Server } = require('socket.io');
const { createServer } = require('http');

var app = express();
const server = createServer(app);
const io = new Server(server);

//load the config file(s)
var serverConfig = require('config');

var config = require('./utils/config')(serverConfig, path.join(__dirname, "data"));

var broadcast = require('./routes/broadcast')(config, io);
var sessionmgmt = require('./utils/sessionmgmt');
var indexRouter = require('./routes/index');
var logoutRouter = require('./routes/logout');
var playerRouter = require('./routes/player')(config, broadcast.getBroadcastMap());
var streamkeysRouter = require('./routes/streamkeys')(config);
var omeapi = require('./routes/omeapi')(config);
var switcher = require('./routes/switcher')(config);



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('combined'));
//app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//serve the ovenplayer files
app.use('/public/ovenplayer', express.static(path.join(__dirname, 'node_modules', 'ovenplayer', 'dist')));
app.use('/public/hls.js', express.static(path.join(__dirname, 'node_modules', 'hls.js', 'dist')));
//and bootstrap
app.use('/public/bootstrap', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));
//and the websocket library (socket.io)
app.use('/public/socket.io', express.static(path.join(__dirname, 'node_modules', 'socket.io', 'client-dist')));

var fileStoreConfig = {
    'ttl' : 60 * 60 * 24, //sessions live for 24 hours
};
//If production, should we encrypt the sessions?
var fileStore = new FileStore({
    fileStoreConfig
});
var sess = {
    secret: config.cookieSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {},
    store: fileStore
};
//use secure cookies in production but not for dev
if (config.isProduction) {
    console.log('Using production cookies');
    //required if we're behind a reverse proxy for cookies
    app.set('trust proxy', 1);
    sess.cookie.secure = true;
}
app.use(session(sess));
//this needs the session to be set up already
var loginRouter = require('./routes/login')(app, sessionmgmt, config);

app.get('/', sessionmgmt.isAuthenticated, indexRouter);
app.use('/player', sessionmgmt.isAuthenticated, playerRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/streamkeys', sessionmgmt.isAuthenticated, streamkeysRouter);
app.use('/api/ome', omeapi);
app.use('/api/broadcast', broadcast.router);
app.use('/switcher', sessionmgmt.isAuthenticated, switcher);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = !config.isProduction ? err : {};

    // render the error page
    res.status(err.status || 500);
    debug('Error: %O', res.locals);
    res.render('error');
});

module.exports = app;

server.listen(config.port, '0.0.0.0', () => {
    console.log(`Example app listening on port ${config.port}`);
});
