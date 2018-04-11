// PACKAGES //
var path = require('path');
var fs = require('fs');
var express = require('express');
var logger = require('morgan');
var mongoose = require('mongoose');
var serverConfig = require('./config.js');
var bodyParser = require('body-parser');
var passport = require('passport');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var busboy = require('connect-busboy');
var busboyBodyParser = require('busboy-body-parser');

var passportOptions = require('./passport/config');


// IMPORTS //
var apiRoutes = require('./routes/api');
var authRoutes = require('./routes/authentication');

// CREATE APP //
var app = express();
mongoose.connect(serverConfig.database);

app.use(function(req, res, next){
  res.setHeader('Access-Control-Allow-Origin', serverConfig.cors_url);
  res.setHeader('Access-Control-Allow-Mehtods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  if ('OPTIONS' == req.method) {
        res.sendStatus(200);
  } else {
    next();
  }

})


app.use('/app', express.static(path.resolve(__dirname, '../client/app')));
app.use('/libs', express.static(path.resolve(__dirname, '../client/libs')));
app.use('/tmp', express.static(path.join(__dirname, '/routes/tmp')));
app.use('/fonts', express.static(path.resolve(__dirname, '../client/fonts')));



// MIDDLEWARE //
app.use(express.static(path.join(__dirname, '../client')));
app.use(express.static(path.join(__dirname, '../../node_modules')));

app.use(busboy());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(busboyBodyParser());
app.use(logger('dev'));
app.use(session({
    secret: "random",
    resave: false,
	saveUninitialized: false
}))
passport.use(passportOptions.authStrategy);
passport.serializeUser(passportOptions.authSerializer);
passport.deserializeUser(passportOptions.authDeserializer);

app.use(passport.initialize());
app.use(passport.session());

// ROUTES //
app.use('/api', apiRoutes);
app.use('/auth', authRoutes);

// ERROR HANDLER //
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
});

module.exports = app;
