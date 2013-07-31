/*!
 *
 * The logic in this file originated from stagecoach
 * which can be found at http://github.com/punkave/stagecoach
 *
 * It is licensed under the MIT license
 *
 * Thanks to the devs at punkave
 */

/**
 * Module dependencies
 */
var env = process.env.NODE_ENV || 'development'
  , config = require('../config/config')[env]
  , fs = require('fs')
  , mongoose = require('mongoose')
  , App = mongoose.model('App')
  , debug = require('debug')('DunkyDooball:DunkyServer')
  , httpProxy = require('http-proxy')
  , logger = require('loggerjs')('DunkyServer')
  , options = {}
  , jade = require('jade')
  , path = require('path')

/**
 * Constructor
 *
 * @api public
 */
var DunkyServer = module.exports = function() {
  this.proxyServer = null;
  this.table = null;
  this.options = {};
  this.init();
}

/**
 * Sets up the environment and builds the initial routing table
 * 
 * Also, listens for a proxyError event in which it will render a static page
 * stating that the site is down for maintenance
 *
 * @api private
 */
DunkyServer.prototype.init = function() {
  var self = this;
  /*!
   * Make sure the pid folder exists
   */
  if (!fs.existsSync(config.pidPath)) {
    logger.info('pidPath does not exist');
    fs.mkdirSync(config.pidPath);
  }
  /*!
   * Go ahead and build the router
   */
  this.rebuildRouter(function(err, router) {
    if (err) {
      logger.error('Error building router')
      logger.error(err);
    } else {
      self.options.router = router;
      self.proxyServer = httpProxy.createServer(self.options).listen(config.proxySPort, config.bindIp);
      self.proxyServer.proxy.on('proxyError', function(err, req, res) {
        var host = req.headers.host || 'This site'
        logger.error('Error proxying request')
        logger.error(err)
        var filename = path.join(path.normalize(__dirname+'/..'), 'config', 'error.jade')
        var html = jade.renderFile(filename, {
            companyName: config.companyName
          , logoUrl: config.logoUrl
          , cssUrl: config.cssUrl
          , host: host
        })
        res.writeHead(200, { 'Content-Type': 'text/html'})
        res.write(html)
        res.end()
      })
      self.table = self.proxyServer.proxy.proxyTable;
      self.setup();
    }
  });
  
}

/**
 * Rebuilds the routing table
 *
 * Currently does NOT check for a domain already being used
 *
 * TODO:
 *    At least send some sort of notification in the event
 *    that this happens
 *
 * @param {Function} cb function(err, router)
 * @api private
 */
DunkyServer.prototype.rebuildRouter = function(cb) {
  var self = this;
  debug('Rebuilding router');
  var router = {};
  App
    .find({})
    .exec(function(err, servers) {
      if (err) return cb(err);
      for (var i=0; i<servers.length; i++) {
        var site = servers[i];
        var local = '127.0.0.1:'+site.port;
        site.domains.forEach(function(host) {
          debug('Virtualizing domain ['+host+']');
          router[host] = local;
        });
      }
      return cb(null, router);
  });
}

/**
 * Configures the proxy server to fallback to apache 
 * if no routes exist for the given request URI
 *
 * @api private
 */
DunkyServer.prototype.setup = function() {
  var self = this;
  if (!self.table) return setTimeout(self.setup(), 200);
  if (config.apachePort) {
    self.table.superGetProxyLocation = self.table.getProxyLocation;
    self.table.getProxyLocation = function(req) {
      var location = self.table.superGetProxyLocation(req);
      if (location) return location;
      return {
        host: '127.0.0.1',
        port: config.apachePort
      };
    };
  }
}

/**
 * Forces the routing table to be rebuilt regardless
 *
 * @api private
 */
DunkyServer.prototype.resetRouter = function() {
  debug('Resetting router');
  var self = this;
  self.rebuildRouter(function(err, router) {
    if (!router) {
      debug('Router not available...polling');
      setTimeout(self.resetRouter, 2000);
      return;  
    } else {
      var table = self.proxyServer.proxy.proxyTable;
      table.setRoutes(router);
      
      self.proxyServer.proxy.proxyTable.emit('routes', self.proxyServer.proxy.proxyTable.router);
    }
  });
}