/*!
 * License for functions used from node-gitteh
 *
 * The MIT License
 *
 * Copyright (c) 2010 Sam Day
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Module dependencies
 */
var debug = require('debug')('DunkyDooball:helper')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../config/config')[env]
  , fs = require('fs')
  , path = require('path')
  , errors = require('./sterror')
  , logger = require('loggerjs')('Helper')
  , spawn = require('child_process').spawn

/**
 * Expose exports
 */
var Helper = exports = module.exports = {};

/**
 * Checks config and throws errors if anything is missing
 * I know its bad practice to throw errors, but this CANNOT
 * and SHOULD NOT run if we are missing any of these
 *
 * @api public
 */
Helper.checkConfig = function() {
  debug('Checking config')
  if (!config.companyID) {
    var e = errors.errorFromCode('EDMISCCID')
    logger.error(e)
    throw e
  }
  
  if (!config.pidPath) {
    var e = errors.errorFromCode('EDMISCPID')
    logger.error(e)
    throw e
  }
  
  if (!config.logsDir) {
    var e = errors.errorFromCode('EDMISCLDI')
    logger.error(e)
    throw e
  }
  
  if (!config.nodeUser) {
    var e = errors.errorFromCode('EDMISCNUR')
    logger.error(e)
    throw e
  }
}

/**
 * Normalizes an application name
 *
 * @param {String} name The application name
 * @api public
 */
Helper.normalizeAppName = function(name) {
  if (!name) return name
  return name.replace(/[^a-zA-Z0-9]/g, '')
}

/*!
 * Shell passthru environment
 * This was borrowed from node-gitteh which is licensed under the MIT license
 * It can be found at https://github.com/libgit2/node-gitteh
 * 
 * @api private
 */
Helper.passthru = function() {
  var args = Array.prototype.slice.call(arguments)
    , cb = args.splice(-1)[0]
    , cmd = args.splice(0, 1)[0]
    , opts = {};
  
  if (typeof(args.slice(-1)[0]) === 'object') {
    opts = args.splice(-1)[0]
  }
  var msgs = []
  var child = spawn(cmd, args, opts)
  child.stdout.on('data', function(d) {
    logger.info(d.toString())
    msgs.push(d.toString())
  })
  child.stderr.on('data', function(d) {
    logger.warn(d.toString())
    msgs.push(d.toString())
  })
  child.on('exit', function(err) {
    if (err) {
      if (typeof err !== 'object') {
        var code = err
        err = new Error('Process exited with non-zero')
        err.code = code
      }
      err.msgs = msgs
    }
    return cb(err)
  })
}

/**
 * Shell pass through that runs whatever command is passed with `/bin/sh -c`
 *
 * This was borrowed from node-gitteh which is licensed under the MIT license
 * It can be found at https://github.com/libgit2/node-gitteh
 *
 * @param {String} cmd
 * @param {Object} options
 * @param {Function} cb function(err)
 * @api public
 */
Helper.shpassthru = function() {
  debug('shpassthru')
  this.passthru.apply(null, ["/bin/sh", "-c"].concat(Array.prototype.slice.call(arguments)));
}

/**
 * Env pass through that runs whatever command is passed with `/usr/bin/env`
 *
 * This was borrowed from node-gitteh which is licensed under the MIT license
 * It can be found at https://github.com/libgit2/node-gitteh
 *
 * @param {String} cmd
 * @param {Object} options
 * @param {Function} cb function(err)
 * @api public
 */
Helper.envpassthru = function() {
  debug('envpassthru')
  this.passthru.apply(null, ["/usr/bin/env"].concat(Array.prototype.slice.call(arguments)));
}


/**
 * Clones the given `url` to the given `dir`
 * `dir` MUST be an absolute path
 *
 * @param {String} url The url to clone
 * @param {String} dir The ABSOLUTE path to clone to
 * @param {Function} cb function(err)
 * @api public
 */
Helper.cloneToPath = function(url, dir, cb) {
  debug('Cloning: ', url)
  this.envpassthru('git', 'clone', url, dir, cb)
}

/**
 * Pulls the master branch for the `origin` remote in the given dir
 *
 * @param {String} dir The ABSOLUTE path to the directory
 * @param {Function} cb function(err)
 * @api public
 */
Helper.pullAtPath = function(dir, cb) {
  debug('Pulling')
  this.envpassthru('git', 'pull', { cwd: dir }, cb)
}

/**
 * Runs `npm install` to install dependencies in the given `dir`
 *
 * @param {String} dir The ABSOLUTE path to the directory
 * @param {Function} cb function(err)
 * @api public
 */
Helper.installAtPath = function(dir, cb) {
  debug('Installing')
  this.envpassthru('npm', 'install', {cwd: dir}, cb)
}

/**
 * Simply logs
 * Redundant you may say??
 * Since the main server more than likely will be run as root (due to port),
 * And, since we are managed by launchd,
 * This allows our logs to be read and written to the `config.nodeUser`'s ~/Library/Logs directory
 * Without having to change any permissions
 *
 * Really though...this is just `console.log`
 *
 * @param {String} str The string to log ...
 * @api public
 */
Helper.log = function() {
  console.log.apply(this, Array.prototype.slice.call(arguments))
}

/**
 * Simply logs
 * Redundant you may say??
 * Since the main server more than likely will be run as root (due to port),
 * And, since we are managed by launchd,
 * This allows our logs to be read and written to the `config.nodeUser`'s ~/Library/Logs directory
 * Without having to change any permissions
 *
 * Really though...this is just `console.error`
 *
 * @param {String} str The string to log ...
 * @api public
 */
Helper.error = function() {
  console.error.apply(this, Array.prototype.slice.call(arguments))
}