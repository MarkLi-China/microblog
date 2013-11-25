
/**
 * Module dependencies.
 */

var express = require('express');
var partials = require('express-partials');
var routes = require('./routes');
// var user = require('./routes/user');
var http = require('http');
var path = require('path');
var MongoStore = require('connect-mongo')(express);
var settings = require('./settings');
var flash = require('connect-flash');
//log
var fs = require('fs');
var accessLogfile = fs.createWriteStream('access.log', {flags: 'a'});
var errorLogfile = fs.createWriteStream('error.log', {flags: 'a'}); 

// use cluster
var app = module.exports = express();
// use access.log
app.use(express.logger({stream: accessLogfile}));
// use ejs layout after Express 3.0, 
app.use(partials());
app.use(flash());

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser(settings.cookieSecret));
app.use(express.session({
    store: new MongoStore({
        db: settings.db
    })
}));
app.use(function (req, res, next) {
    var err = req.flash('error');
    res.locals.error = err.length ? err : null;
    // res.locals.error = req.flash('error');
    var succ = req.flash('success');
    res.locals.success = succ;
    // res.locals.success = req.flash('success');
    var user = req.session.user;
    res.locals.user = user;
    // res.locals.user = req.session.user;
    next();
});
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.set('env', 'production');

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

// production only
if ('production' == app.get('env')) {
    app.use(function(err, req, res, next){
        var meta = '[' + new Date() + '] ' + req.url + '\n';
        errorLogfile.write(meta + err.stack + '\n');
        next();
    });
}

if (!module.parent) {
    http.createServer(app).listen(app.get('port'), function(){
        console.log('Express server listening on port ' + app.get('port'));
    });
}

routes(app);
