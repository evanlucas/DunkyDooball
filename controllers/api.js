/**
 * Module dependencies
 */
var debug = require('debug')('DunkyDooball:API')
  , logger = require('loggerjs')('API')
  , mongoose = require('mongoose')
  , App = mongoose.model('App')
  , User = mongoose.model('User')
  , apps = require('./applications')
  , path = require('path')
  , environment = process.env.NODE_ENV || 'development'
  , config = require('../config/config')[environment]
  , ctl = require('launchctl')



/*!
 * Expose our exports
 */
var API = exports = module.exports = {}

/*!
 * Simply returns an object with the given error message
 *
 * @param {String} msg The error message
 * @param {String|Object} err The error object/string
 * @api private
 */
var error = function(msg, err) {
  var o = {}
  o.message = msg;
  if (err) o.error = err
  o.status = 'error'
  return o
}

/*!
 * Simply returns an object with the given success message
 *
 * @param {String} msg The message
 * @api private
 */
var success = function(msg) {
  var o = {}
  if (msg) o.msg = msg
  o.status = 'success'
  return o
}

/**
 * Allows us to reference the http server
 *
 * @param {Object} s The http server
 * @api public
 */
API.setServer = function(s) {
  this.server = s
  logger.info('Grabbing server')
}

/**
 * Allows us to call on the socket for privilege separation
 *
 * @param {SocketClient Object} client The git client
 * @api public
 */
API.setSocketClient = function(client) {
  apps.setSocketClient(client)
}

/*!
 * Grabs the app we are currently attempting to work with via express param
 *
 * @param {Request Object} req The request object
 * @param {Result Object} res The result object
 * @param {Function} next(err) Next callback
 * @param {String} label The app name or label
 * @api private
 */
API.appName = function(req, res, next, label) {
  apps.findOne(label, function(err, app) {
    if (err) {
      logger.error(err)
      return res.send(200, error('Unable to find app', err))
    } else {
      if (!app) {
        return next(new Error('Invalid app'))
      }
      app = app.toJSON()
      try {
        var c = ctl.listSync(app.label)
        app.config = c
      }
      catch (e) {
        if (e) {
          logger.error('Error finding job in launchd')
          return next(e)
        }
      }
      req.app = app
      return next()
    }
  })
}

/*!
 * HTTP handler for listing all apps
 *
 * @api private
 */
API.listAll = function(req, res) {
  debug('listAll')
  apps.listAll(function(err, result) {
    if (err) {
      logger.error(err)
      return res.send(200, error('Error listing apps', err))
    } else {
      return res.send(200, {
          status: 'success'
        , data: result
      })
    }
  })
}

/*!
 * HTTP handler for listing a single app
 *
 * @api private
 */
API.list = function(req, res) {
  return res.send(200, {
      status: 'success'
    , data: req.app
  })
}

/*!
 * HTTP handler for starting an app
 *
 * @api private
 */
API.start = function(req, res) {
  var app = req.app
  apps.start(app.label, function(err) {
    if (err) {
      return res.send(200, error('Unable to start app', err))
    } else {
      API.server.resetRouter()
      return res.send(200, success('Successfully started app'))
    }
  })
}

/*!
 * HTTP handler for stopping an app
 *
 * @api private
 */
API.stop = function(req, res) {
  var app = req.app
  apps.stop(app.label, function(err) {
    if (err) {
      return res.send(200, error('Unable to stop app', err))
    } else {
      API.server.resetRouter()
      return res.send(200, success('Successfully stopped app'))
    }    
  })
}

/*!
 * HTTP handler for creating a new app
 *
 * @api private
 */
API.create = function(req, res) {
  // requires url, dir, and env
  var body = req.body;
  if (!body.url) {
    return res.send(200, error('Git URL required'))
  }
  if (!body.dir) {
    return res.send(200, error('Directory to clone to is required'))
  }
  logger.info(body)
  var url = body.url
  var dir = body.dir
  var env = body.env
  if (!body.env) {
    env = 'development'
  }
  apps.create(url, dir, env, function(err) {
    if (err) {
      return res.send(200, error('Error creating app', err))
    } else {
      return res.send(200, success('Successfully created app'))
    }
  })
}

/*!
 * HTTP handler for pulling the latest commit from the master branch
 *
 * @api private
 */
API.pull = function(req, res) {
  // requires name/label
  var app = req.app
  apps.pull(app.label, function(err) {
    if (err) {
      return res.send(200, error('Error updating app', err))
    } else {
      return res.send(200, success('Successfully updated app'))
    }
  })
}

/*!
 * HTTP handler for installing an app's dependencies
 *
 * @api private
 */
API.install = function(req, res) {
  var app = req.app
  apps.install(app.label, function(err) {
    if (err) {
      return res.send(200, error('Error installing app dependencies', err))
    } else {
      return res.send(200, success('Successfully installed app dependencies'))
    }    
  })
}

/*!
 * HTTP handler for removing an app from the database
 * (DOES NOT REMOVE THE ACTUAL FILES)
 *
 * @api private
 */
API.remove = function(req, res) {
  var app = req.app
  apps.remove(app.label, function(err) {
    if (err) {
      return res.send(200, error('Error removing app', err))
    } else {
      API.server.resetRouter()
      return res.send(200, success('Successfully removed app'))
    }
  })
}


/*!
 * HTTP handler for updating an app's information in the db
 *
 * @api private
 */
API.update = function(req, res) {
  var body = req.body
  if (!body.env) {
    return res.send(200, error('Invalid app environment'))
  }
  var app = req.app
  apps.update(app.label, body.env, function(err) {
    if (err) {
      logger.error(err)
      return res.send(200, error('Error updating app', err))
    }
    logger.info('Successfully updated app')
    return res.send(200, success('Successfully updated app'))
  })
}