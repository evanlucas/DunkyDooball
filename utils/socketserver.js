/**
 * Module dependencies
 */
var debug = require('debug')('DunkyDooball:SocketServer')
  , logger = require('loggerjs')('SocketServer')
  , tcpconfig = require('./socketconfig')
  , net = require('net')
  , JsonSocket = require('json-socket')
  , fs = require('fs')
  , helper = require('../controllers/helper')

/*!
 * Expose exports
 */
var SocketServer = exports = module.exports = {};

/*!
 * Handle the deploy command to clone a git repo
 * Supports whatever `git clone` will support
 *
 * @param {Socket} socket The socket
 * @param {String} url The clone url
 * @param {String} dir The directory to clone to
 * @api private
 */
SocketServer.handleClone = function(socket, url, dir) {
  logger.info('Cloning')
  helper.cloneToPath(url, dir, function(err) {
    if (err) {
      logger.error('Error handling clone operation')
      logger.error(err)
      return socket.sendMessage({status: 'error', error: err})
    } else {
      return socket.sendMessage({status: 'success'})
    }
  })
}

/*!
 * Handle the pull command to update a git repo
 *
 * @param {Socket} socket The socket
 * @param {String} dir The directory to clone to
 * @api private
 */
SocketServer.handlePull = function(socket, dir) {
  logger.info('Pulling')
  helper.pullAtPath(dir, function(err) {
    if (err) {
      logger.error('Error handling pull operation')
      logger.error(err)
      return socket.sendMessage({status: 'error', error: err})
    } else {
      logger.info('Successfully handled pull')
      return socket.sendMessage({status: 'success'})
    }
  })
}

/*!
 * Handle the install command to install dependencies
 *
 * @param {Socket} socket The socket
 * @param {String} dir The directory to clone to
 * @api private
 */
SocketServer.handleInstall = function(socket, dir) {
  logger.info('Installing')
  helper.installAtPath(dir, function(err) {
    if (err) {
      logger.error('Error handling install operation')
      logger.error(err)
      return socket.sendMessage({status: 'error', error: err})
    } else {
      logger.info('Successfully handled install')
      return socket.sendMessage({status: 'success'})
    }
  })
}

SocketServer.handleLog = function() {
  var args = Array.prototype.slice.call(arguments)
    , socket = args.shift()
  
}
/**
 * Sets up the socket server
 *
 * @api public
 */
SocketServer.setup = function() {
  var self = this
  self.server = net.createServer()
  self.server.listen(tcpconfig.path)
  self.server.on('close', function(hasError) {
    debug('Server closed')
    logger.info(hasError)
    self.setup()
  })
  self.server.on('connection', function(socket) {
    debug('Connected')
    logger.info('Connected')
    socket = new JsonSocket(socket)
    socket.on('message', function(message) {
      debug('Received message')
      logger.info(message)
      if (!message.action) {
        logger.warn('Invalid message')
        socket.sendMessage({status: 'error', error: new Error('Invalid action')})
        return
      }
      var action = message.action
      
      if (action === 'deploy') {
        // must have url and dir
        var url = message.url
        var dir = message.dir
        return self.handleClone(socket, url, dir)
      } else if (action === 'pull') {
        // must have dir
        var dir = message.dir
        return self.handlePull(socket, dir)
      } else if (action === 'install') {
        // must have dir
        var dir = message.dir
        return self.handleInstall(socket, dir)
      }

    })
  })
  
  self.server.on('error', function(e) {
    logger.error(e)
    if (e.code === 'EADDRINUSE') {
      var c = new net.Socket()
      c.on('error', function(e) {
        if (e.code === 'ECONNREFUSED') {
          fs.unlink(tcpconfig.path)
          self.setup()
        }
      })
      c.connect({path: tcpconfig.path}, function() {
        logger.error('Server is actually running...something weird is going on')
        process.exit()
      })
    }
  })
  

}


/*!
 * Initializes the socket server since this will be run using
 * launchd and will be set to run OnDemand
 */
SocketServer.setup()


