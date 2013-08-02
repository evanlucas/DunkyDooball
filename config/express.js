/**
 * Module dependencies
 */
var express = require('express')
  , debug = require('debug')('DunkyDooball:Express')
  , logger = require('loggerjs')('Express')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , mongoose = require('mongoose')
  , User = mongoose.model('User')
  , env = process.env.NODE_ENV || 'development'
  , config = require('./config')[env]

/*!
 * Module's exports
 */
module.exports = function(app, config) {
  
  if (config.enableUI) {
    passport.serializeUser(function(user, done) {
      done(null, user.id)
    })
    
    passport.deserializeUser(function(id, done) {
      User.findById(id, function(err, user) {
        done(err, user)
      })
    })
    
    passport.use(new LocalStrategy(function(email, password, done) {
      User.findOne({email: email}, function(err, user) {
        if (err) return done(err)
        if (!user) return done(null, false, { message: 'Unknown user '+email})
        if (!user.authenticate(password)) {
          return done(null, false, { message: 'Invalid credentials'})
        }
        done(null, user)
      })
    }))
  }
  
  app.set('showStackError', true);
  app.use(express.logger('dev'));
  
  if (config.enableUI) {
    app.use(express.static(app.config.root+'/public'))
    app.use(express.static(app.config.root+'/bower_components'))
    app.set('views', app.config.root+'/views')
    app.set('view engine', 'jade')
    app.set('view options', {doctype: 'html', pretty: true})
  }
  app.configure(function(){
    app.use(express.cookieParser());
    
    if (config.enableUI) app.use(express.session({secret: 'dunkydooball'}))
    
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    
    if (config.enableUI) {
      app.use(passport.initialize())
      app.use(passport.session())
      app.use(function(req, res, next) {
        res.locals.cssUrl = config.cssUrl
        res.locals.logoUrl = config.logoUrl
        res.locals.companyName = config.companyName
        next()
      })
    }
    app.use(app.router);
    
    app.use(function(req, res, next){
      res.send(404, {
          status: 'Error'
        , message: 'Resource not found'
      })
    });
  });
  
  return passport
}