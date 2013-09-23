/**
 * Module dependencies
 */
var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , config = require('./config/config')[env]
  , debug = require('debug')('DunkyDooball:Server')
  , logger = require('loggerjs')('Server')
  , express = require('express')
  , fs = require('fs')
  , path = require('path')
  , helper = require('./controllers/helper')

/*!
 * Make sure we are root (if we're using port <= 1024)
 */
if (config.proxySPort <= 1024) {
  if (!process.getuid() == 0) {
    logger.error('Must be run as root')
    process.exit(1)
  }
}

/*!
 * Verify that the config has valid parameters for the given environment/context in which we have been run
 *
 * MAKE SURE IT IS VALID....IT WILL THROW AN ERROR
 */
helper.checkConfig()

/*!
 * Connect to the database
 */
mongoose.connect(config.db)

/*!
 * Initialize and register our schema
 */
fs.readdirSync(path.join(__dirname, 'models')).forEach(function(f) {
  if (path.extname(f) === '.js') {
    require(path.join(__dirname, 'models', f))
  }
})

/*!
 * Start the proxy server
 */
var proxyServer = new (require('./controllers/proxyserver'))

/*!
 * Connect to our socket client
 * Fail and exit if we catch an error or the server closes
 * 
 * TODO:
 *    Find a way to check a couple of times prior to exiting
 *    since the socket server is managed by launchd also
 *
 * It is setup this way so that when we clone, or pull, or install
 * depends, we are not doing so as root, but as the user who actually
 * runs the applications. This is done for privilege separation
 *
 *
 */
var socketclient = new (require('./utils/socketclient'))


socketclient
  .connect()
  .on('connect', function() {
    /*!
     * We connected, initialize express
     */
    var app = express()

    app.config = config
    
    
    /**
     * Create separate http server for the sake of socket.io
     */
    var server = require('http').createServer(app);
    
    /**
     * Start listening for socket messages
     */
    var io = require('socket.io').listen(server);
    
    /*!
     * Require our configuration
     */
    var exp = require('./config/express')(app, config, io)
    
    var passport = exp.passport
      , socks = exp.socks
    /*!
     * Setup routes and API
     */
    require('./config/router')(app, proxyServer, socketclient, passport)
      
    var port = config.adminPort
    
    /*!
     * Start listening
     */  
    server.listen(port)
    
    new (require('./config/sockets'))(socks, io)
    
    logger.info('['+env+'] - Listening on port ['+port+']')
  })
  .on('error', function(e) {
    logger.info('SocketClient caught an error')
    logger.error(e)
    process.exit(1)
  })
  .on('close', function(hasError) {
    logger.info('SocketClient was closed')
    if (hasError) {
      logger.warn('SocketClient closed due to an error')
      process.exit(1)
    } else {
      logger.info('SocketClient closed in a clean manner')
      process.exit()
    }
  })