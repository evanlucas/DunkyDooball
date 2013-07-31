/**
 * Module dependencies
 */
var debug = require('debug')('DunkyDooball:SocketClient')
  , logger = require('loggerjs')('SocketClient')
  , tcpconfig = require('./socketconfig')
  , net = require('net')
  , JsonSocket = require('json-socket')
  , events = require('events')
  , util = require('util')
  , fs = require('fs')

/*!
 * Internal Constructor
 *
 * @api public
 */
var SocketClient = module.exports = function() {
  debug('Constructing socket client')
  events.EventEmitter.call(this)
  this.socket = new JsonSocket(new net.Socket())
  this.action = null
  this.connected = false
  require('pkginfo')(module, 'version')
}

/*!
 * Inherit event emitter to expose our events
 * Done to make modularization much, much easier
 */
util.inherits(SocketClient, events.EventEmitter)

/**
 * Deploys the repo at `url` to `dir`
 *
 * @param {String} url The git clone url
 * @param {String} dir The directory to clone to
 * @api public
 */
SocketClient.prototype.deploy = function(url, dir) {
  this.sendMessage('deploy', {url: url, dir: dir})  
}

/**
 * Updates the repo at `dir`
 *
 * @param {String} dir The directory holding the git repo to `pull`
 * @api public
 */
SocketClient.prototype.pull = function(dir) {
  this.sendMessage('pull', {dir: dir})
}

/**
 * Installs the dependencies in `dir`
 *
 * @param {String} dir The directory holding the project
 * @api public
 */
SocketClient.prototype.install = function(dir) {
  this.sendMessage('install', {dir: dir})
}

/**
 * Sends a message to the socket server
 * Should be avoided if at all possible
 * And the predefined functions above should be used
 *
 * @param {String} action The action to perform
 * @param {Object} opts The options object
 * @api public
 */
SocketClient.prototype.sendMessage = function(action, opts) {
  var self = this
  debug('Sending Message')
  self.action = action
  if (!self.connected) {
    logger.error('Not connected')
    logger.error('')
    return
  }
  opts.action = action
  debug(action)
  self.socket.sendMessage(opts)
}

/**
 * Connect to server
 *
 * @api public
 */
SocketClient.prototype.connect = function() {
  var self = this
  self.socket.connect({path: tcpconfig.path})
  self.socket.on('connect', function() {
    self.connected = true
    self.emit('connect')
  })
  
  self.socket.on('error', function(err) {
    self.connected = false
    debug('error')
    logger.info(err)
    self.emit('error', err)
  })
  
  self.socket.on('close', function(hasError) {
    self.connected = false
    debug('closed')
    self.emit('close', hasError)
  })
  
  self.socket.on('message', function(m) {
    logger.info('Received message')
    logger.info(m)
    if (m.hasOwnProperty('status')) {
      self.emit('status', m)
    }
    
    switch (self.action) {
      case 'deploy':
        self.emit('deploy', m)
        break
      case 'pull':
        self.emit('pull', m)
        break
      case 'install':
        self.emit('install', m)
        break
      default:
        self.emit('invalidAction', m)
        break
    }
  })
  return this
}

/**
 * Disconnect from the socket server
 *
 * @api public
 */
SocketClient.prototype.disconnect = function() {
  var self = this
  debug('Closing socket')
  self.socket.close()
}