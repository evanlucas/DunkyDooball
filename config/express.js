/**
 * Module dependencies
 */
var express = require('express')
  , debug = require('debug')('DunkyDooball:Express')
  , logger = require('loggerjs')('Express')

/*!
 * Module's exports
 */
module.exports = function(app, config) {
  app.set('showStackError', true);
  app.use(express.logger('dev'));
  
  app.configure(function(){
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
        
    app.use(app.router);
    
    app.use(function(req, res, next){
      res.send(404, {
          status: 'Error'
        , message: 'Resource not found'
      })
    });
  });
}