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
  , async = require('async')


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
      if (req.query.ui) {
        return res.send(200, {
            status: 'success'
          , data: result
          , user: {
              role: req.user.role
          }
        })
      } else {
        return res.send(200, {
            status: 'success'
          , data: result
        })
      }
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

API.getAppsUI = function(req, res) {
  var sort = {}
    , skip = 0
    , limit = 10
    , cols = ['name', 'port', 'env', 'domains', 'status', 'actions']
    , output = {};

  if (req.param('iSortCol_0')) {
    var iSortingCols = Number(req.param('iSortingCols'))
    for (var i=0; i<iSortingCols; i++) {
      if (req.param('bSortable_'+req.param('iSortCol_'+i)) == 'true') {
        var direction = req.param('sSortDir_'+i).toLowerCase()
        direction = (direction === 'desc') ? 1 : -1
        sort[cols[Number(req.param('iSortCol_'+i))]] = direction
      }
    }
  }

  if (req.param('iDisplayStart')) skip = req.param('iDisplayStart')
  if (req.param('iDisplayLength')) limit = req.param('iDisplayLength')

  App
    .find({})
    .skip(skip)
    .limit(limit)
    .sort(sort)
    .exec(function(err, apps) {
      if (err) {
        logger.error('Error finding apps for DataTables:', err)
        return res.send(500)
      }
      App.count().exec(function(err, count) {
        if (err) {
          logger.error('Error counting apps for DataTables:', err)
          return res.send(500)
        }
        output.iTotalRecords = count
        output.iTotalDisplayRecords = apps.length
        var aaData = []

        apps.forEach(function(app) {
          // name, port, env, domains, status, actions
          try {
            var c = ctl.listSync(app.label)
            app.config = c
          }
          catch (e) {}
          var row = []
          row.push(app.name)
          row.push(app.port)
          row.push(envForApp(app))
          row.push(domainsForApp(app))
          row.push(statusForApp(app))
          row.push(actionButtonsForApp(app))
          aaData.push(row)
        })
        output.aaData = aaData
        output.sEcho = Number(req.param('sEcho'))
        logger.info('aaData:', aaData)
        return res.send(200, output)
      })
    })
}

function envForApp(app) {
  var e = app.env
    , output = ''
  switch(e) {
    case 'development':
      output = '<span class="label label-success">Development</span>'
      break
    case 'test':
      output = '<span class="label label-success">Test</span>'
      break
    case 'production':
      output = '<span class="label label-success">Production</span>'
      break
  }
  return output
}

function domainsForApp(app) {
  var domains = app.domains
    , output = ''
  domains.forEach(function(d) {
    output += '<a href="http://'+d+'">'+d+'</a><br/>'
  })
  if (output === '') return '<em>No domains specified</em>'
  return output
}

function statusForApp(app) {
  if (app.config && app.config.PID) {
    return '<span class="label label-info">Running</span>'
  }
  return '<span class="label label-danger">Not Running</span>'
}

function actionButtonsForApp(app) {
  var output = ''
  if (app.config && app.config.PID) {
    // Stop button
    output += '<a href="#" class="btn btn-danger btn-stop" data-label="'+app.label+'" data-name="'+app.name+'" rel="tooltip" title="Stop App" data-position="top" data-toggle="tooltip" data-trigger="hover"><i class="icon-stop"></i></a>'
  } else {
    // Start button
    output += '<a href="#" class="btn btn-primary btn-start" data-label="'+app.label+'" data-name="'+app.name+'" rel="tooltip" title="Start App" data-position="top" data-toggle="tooltip" data-trigger="hover"><i class="icon-play"></i></a>'
  }
  
  // Install button
  output += '<a href="#" class="btn btn-success btn-install" data-label="'+app.label+'" data-name="'+app.name+'" rel="tooltip" title="Install Dependencies" data-position="top" data-toggle="tooltip" data-trigger="hover"><i class="icon-terminal"></i></a>'
  
  // Update button
  output += '<a href="#" class="btn btn-warning btn-update" data-label="'+app.label+'" data-name="'+app.name+'" rel="tooltip" title="Update App / Pull Changes" data-position="top" data-toggle="tooltip" data-trigger="hover"><i class="icon-github-alt"></i></a>'
  
  // Remove button
  output += '<a href="#" class="btn btn-danger btn-remove" data-label="'+app.label+'" data-name="'+app.name+'" rel="tooltip" title="Remove App" data-position="top" data-toggle="tooltip" data-trigger="hover"><i class="icon-trash"></i></a>'
  
  return output
}