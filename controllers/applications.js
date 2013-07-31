/**
 * Module dependencies
 */
var ctl = require('launchctl')
  , debug = require('debug')('DunkyDooball:Apps')
  , environment = process.env.NODE_ENV || 'development'
  , config = require('../config/config')[environment]
  , fs = require('fs')
  , path = require('path')
  , mongoose = require('mongoose')
  , App = mongoose.model('App')
  , touch = require('touch')
  , Plist = require('./stplist')
  , async = require('async')
  , errors = require('./sterror')
  , logger = require('loggerjs')('Apps')
  , plist = new Plist()
  , _ = require('underscore')

/**
 * Expose `exports`
 */
var Apps = exports = module.exports = {}

/**
 * Set our socket client, so we can connect to the server
 * This is done for privilege separation
 *
 * @param {Object} client A GitClient object
 * @api public
 */
Apps.setSocketClient = function(client) {
  debug('setSocketClient')
  this.socketClient = client;
}

/**
 * Our Node Environments
 */
Apps.envs = function() {
  return ['development', 'test', 'production']
}

/**
 * Verifies the `package.json`
 *
 * @param {Object} pkg The `package.json` Object
 * @api private
 * @returns {Error|null}
 */
Apps.verifyPackage = function(pkg) {
  if (!pkg.hasOwnProperty('name')) {
    var e = errors.errorFromCode('EDMISPNAM')
    e.state = "verifyPackage"
    return e
  }
  
  if (!pkg.hasOwnProperty('author')) {
    var e = errors.errorFromCode('EDMISPAUT')
    e.state = "verifyPackage"
    return e
  }
  
  if (!pkg.hasOwnProperty('main')) {
    var e = errors.errorFromCode('EDMISPMAI')
    e.state = "verifyPackage"
    return e
  }
  
  if (!pkg.hasOwnProperty('version')) {
    var e = errors.errorFromCode('EDMISPVER')
    e.state = "verifyPackage"
    return e
  }
  return null
}

/**
 * Verifies the `config/config.js`
 *
 * @param {Object} conf The `config.js` object
 * @api private
 * @returns {Error|null}
 */
Apps.verifyConfig = function(conf) {
  if (!conf.hasOwnProperty('port')) {
    var e = errors.errorFromCode('EDMISPORT')
    e.state = "verifyConfig"
    return e
  }
  if (!conf.hasOwnProperty('hostname')) {
    var e = errors.errorFromCode('EDMISDOMS')
    e.state = "verifyConfig"
    return e
  }
  if (!conf.hasOwnProperty('emails')) {
    var e = errors.errorFromCode('EDMISEMAI')
    e.state = "verifyConfig"
    return e
  }
  return null
}

/**
 * Populates an `App` object with required info from
 * the `package.json` and `config.js`
 *
 * @param {App Object} app An app object or null for a new app
 * @param {String} dir The absolute path to file
 * @param {String} env The NODE_ENV to run the app under
 * @param {Function} cb function(err, app)
 * @api private
 */
Apps.populateApp = function(app, dir, env, cb) {
  debug('populateApp')
  var self = this
  /*!
   * If app == null, this is a new app
   */
  if (!app) app = new App()
  
  /*!
   * If env does not exist, or is not one of envs, default to development
   */
  if (!env || (self.envs().indexOf(env) === -1)) {
    env = 'development'
  }
  
  /*!
   * Verify that `dir` exists
   */
  if (!fs.existsSync(dir)) {
    var e = errors.errorFromCode('EPATNOEX')
    e.state = "populateApp"
    logger.error(e)
    return cb(e)
  }
  
  var pkgPath = path.join(dir, 'package.json')
  var confPath = path.join(dir, 'config', 'config.js')
  
  /*!
   * Verify that `pkgPath` exists
   */
  if (!fs.existsSync(pkgPath)) {
    var e = errors.errorFromCode('EDMISPKGJ')
    e.state = "populateApp"
    logger.error(e)
    return cb(e)
  }
  
  /*!
   * Verify that `confPath` exists
   */
  if (!fs.existsSync(confPath)) {
    var e = errors.errorFromCode('EDMISCONF')
    e.state = "populateApp"
    logger.error(e)
    return cb(e)
  }
  
  /*!
   * Require package and config to populate/update app settings
   */
  var pkg = require(pkgPath)
  var conf = require(confPath)[env]
  
  
  app.path = dir
  app.env = env
  
  var v = self.verifyPackage(pkg)
  if (v instanceof Error) {
    return cb(v)
  }
  
  app.pkgVersion = pkg.version
  app.name = pkg.name
  app.author = pkg.author
  app.scriptName = pkg.main
  
  var v2 = self.verifyConfig(conf)
  if (v2 instanceof Error) {
    return cb(v2)
  }
  
  app.port = conf.port
  var domains
  if (Array.isArray(conf.hostname)) {
    domains = conf.hostname
  } else {
    domains = [conf.hostname]
  }
  app.domains = domains
  var emails
  if (Array.isArray(conf.emails)) {
    emails = conf.emails
  } else {
    emails = [conf.emails]
  }
  app.emails = emails
  app.label = plist.getReverseDNS(app.name)
  app.pidFile = plist.getPIDPath(app.name)
  return cb(null, app)
}

/**
 * Does a full blown update for an app and changes the environment
 * Stops the job, unloads it, repopulates it based on the new env,
 * Saves it, writes the new plist, loads the app, and then starts it
 *
 * @param {String} name The app name/label
 * @param {String} env The env
 * @param {Function} cb function(err)
 * @api public
 */
Apps.update = function(name, env, cb) {
  debug('update')
  var self = this
  if (!name || name == "") {
    var e = errors.errorFromCode('EDINVARGS')
    logger.error('Invalid app name')
    logger.error(e)
    e.state = "update"
    return cb && cb(e)
  }
  
  if (!env) {
    env = 'development'
  }
  
  self.findOne(name, function(err, app) {
    if (err) return cb(err)
    var plistpath = plist.getPlistPath(app.name)
    async.series([
      function(c) {
        // stop
        self.stop(name, function(err) {
          if (err) logger.error(err)
          return c(null)
        })
      },
      function(c) {
        // unload
        try {
          var res = ctl.unloadSync(plistpath)
        }
        catch (e) {
          logger.error(e)
        }
        return c(null)
      },
      function(c) {
        // populate
        self.populateApp(app, app.path, env, function(err, app) {
          if (err) {
            logger.error(err)
            return c(err)
          } else {
            // save
            app.save(function(err) {
              if (err) {
                logger.error(err)
                return c(err)
              }
              var script = path.join(app.path, app.scriptName)
              plist.buildPlistObject(app.name, script, app.env, function(err, o) {
                if (err) return c(err)
                ctl.load(plist.getPlistPath(app.name), c)
              })
            })
          }
        })
      },
      function(c) {
        self.start(app.name, c)
      }
    ], function(err) {
      return cb(err)
    })
  })

}

/**
 * Creates a new app
 *
 * @param {String} url The url to clone
 * @param {String} dir The absolute path where the app will be cloned
 * @param {String} env The NODE_ENV to run the app under
 * @param {Function} cb function(err)
 * @api public
 */
Apps.create = function(url, dir, env, cb) {
  debug('create')
  var self = this
  if (!dir || dir === "") {
    var e = errors.errorFromCode('EDINVARGS')
    logger.error('Missing dir')
    logger.error(e)
    return cb && cb(e)
  }
  
  if (!url || url === "") {
    var e = errors.errorFromCode('EDINVARGS')
    logger.error('Missing url')
    logger.error(e)
    return cb && cb(e)    
  }
  
  // Get absolute path
  var absoluteDir = path.join(config.appsPath, dir)
  logger.info(absoluteDir)
  self.socketClient.deploy(url, absoluteDir)
  self.socketClient.once('deploy', function(m) {
    if (m.status === 'success') {
      // Successfully deployed
      logger.info('Successfully cloned app')
      // Populate app
      self.populateApp(null, absoluteDir, env, function(err, app) {
        if (err) {
          logger.error('Error populating app')
          logger.error(err)
          return cb(err)
        } else {
          app.save(function(err) {
            if (err) {
              logger.error('Error saving app')
              logger.error(err)
              return cb(err)
            }
            logger.info('Successfully created app')
            var script = path.join(app.path, app.scriptName)
            plist.buildPlistObject(app.name, script, app.env, function(err, o) {
              if (err) {
                return cb(err)
              }
              ctl.load(plist.getPlistPath(app.name), cb)
            })
          })
        }
      })
      
    } else {
      // Error deploying
      logger.error('Error cloning app')
      logger.error(m.error)
      return cb && cb(m.error)
    }

  })
}

/**
 * Installs dependencies for the given app
 *
 * @param {String} name The app's name or job label
 * @param {Function} cb function(err)
 * @api public
 */
Apps.install = function(name, cb) {
  var self = this
  self.findOne(name, function(err, app) {
    if (err) return cb(err)
    self.socketClient.install(app.path)
    self.socketClient.once('install', function(m) {
      if (m.status === 'success') {
        logger.info('Successfully installed app dependencies')
        return cb && cb(null)
      } else {
        logger.error('Error installing app dependencies')
        logger.error(m.error)
        return cb && cb(m.error)
      }
    })
  })
}

/**
 * Pulls the latest commit from master branch for the given app
 *
 * @param {String} name The app's name or job label
 * @param {Function} cb function(err)
 * @api public
 */
Apps.pull = function(name, cb) {
  var self = this
  self.findOne(name, function(err, app) {
    if (err) return cb(err)
    self.socketClient.pull(app.path)
    self.socketClient.once('pull', function(m) {
      if (m.status === 'success') {
        logger.info('Successfully updated app')
        return cb && cb(null)
      } else {
        logger.error('Error updating app')
        logger.error(m.error)
        return cb && cb(m.error)
      }
    })
  })
}

/**
 * Finds an app with the given `name`
 *
 * @param {String} name The app name
 * @param {Function} cb function(err, app)
 * @api public
 */
Apps.findByName = function(name, cb) {
  App.findOne({name: name}).exec(function(err, app) {
    if (err) {
      return cb(err)
    }
    if (!app) {
      return cb(errors.errorFromCode('EDINVAPNA'))
    }
/*
    logger.info(app)
    try {
      var c = ctl.listSync(app.label)
      app.config = c
    }
    catch (e) {
      app.config = {}
    }
*/
    return cb(null, app)
  })
}

/**
 * Finds an app with the given `label`
 *
 * @param {String} label The app label (reverse DNS)
 * @param {Function} cb function(err, app)
 * @api public
 */
Apps.findByLabel = function(label, cb) {
  App.findOne({label: label}).exec(function(err, app) {
    if (err) {
      return cb(err)
    }
    if (!app) {
      return cb(errors.errorFromCode('EDINVJLAB'))
    }
/*
    logger.info(app)
    try {
      var c = ctl.listSync(app.label)
      app.config = c
    }
    catch (e) {
      app.config = {}
    }
*/
    return cb(null, app)
  })
}

/**
 * Finds an app matching either the name or label
 *
 * @param {String} name The app name or label
 * @param {Function} cb function(err, app)
 * @api public
 */
Apps.findOne = function(name, cb) {
  var self = this
  self.findByName(name, function(err, app) {
    if (err) {
      return self.findByLabel(name, cb)
    }
    return cb(null, app)
  })  
}

/**
 * Lists all registered apps
 *
 * @param {Function} cb function(err, apps)
 * @api public
 */
Apps.listAll = function(cb) {
  App.find({}).lean().exec(function(err, apps) {
    if (err) {
      return cb(err)
    }
    logger.info(apps)
    debug('Mapping results')
    var result = _.map(apps, function(app) {
      try {
        var c = ctl.listSync(app.label)
        app.config = c
      }
      catch (e) {
        app.config = {}
      }
      return app
    })
    return cb(null, result);
  })
}

/**
 * Stop app with the given `name` or `label`
 *
 * @param {String} name The app name or label
 * @param {Function} cb function(err)
 * @api public
 */
Apps.stop = function(name, cb) {
  var self = this
  self.findOne(name, function(err, app) {
    if (err) {
      return cb(err)
    }
    fs.unlink(app.pidFile, function(err) {
      var hasErr = false
      try {
        var res = ctl.stopSync(app.label)
        if (res !== 0) {
          hasErr = true
          var err = ctl.errorFromErrno(res)
          logger.error(err)
          return cb(err)
        } else {
          hasErr = false  
        }
        return cb(null)
      }
      catch (e) {
        hasErr = true
        return cb(e)
      }
      
      if (!hasErr) return cb(null)
    })
  })
}

/**
 * Start app with the given `name` or `label`
 *
 * @param {String} name The app name or label
 * @param {Function} cb function(err)
 * @api public
 */
Apps.start = function(name, cb) {
  var self = this
  self.findOne(name, function(err, app) {
    if (err) return cb(err)
    if (fs.existsSync(app.pidFile)) {
      fs.unlink(app.pidFile, function(err) {
        if (err) {
          return cb(err)
        } else {
          try {
            touch.sync(app.pidFile)
            ctl.startSync(app.label)
          }
          catch (e) {
            err = e
          }
          return cb(err)
        }
      })
    } else {
      try {
        ctl.startSync(app.label)
        touch.sync(app.pidFile)
      }
      catch (e) {
        err = e
      }
      return cb(err)
    }
  })
}

/**
 * Restarts the app with the given `name` or `label`
 *
 * @param {String} name The app name or label
 * @param {Function} function(err)
 * @api public
 */
Apps.restart = function(name, cb) {
  var self = this
  self.stop(name, function(err) {
    if (err) return cb(err)
    self.start(name, cb)
  })
}

/**
 * Stops an app, removes its launchd configuration plist, and removes it from the db
 *
 * @param {String} name The app name or label
 * @param {Function} cb function(err)
 * @api public
 */
Apps.remove = function(name, cb) {
  var self = this
  self.findOne(name, function(err, app) {
    if (err) return cb(err)
    var plistpath = plist.getPlistPath(app.name)
    async.series([
      function(c) {
        self.stop(name, function(err) {
          if (err) logger.error(err)
          return c(null)
        })
      },
      function(c) {
        try {
          var res = ctl.unloadSync(plistpath)
        }
        catch (e) {
          logger.error(e)
        }
        return c(null)
      },
      function(c) {
        fs.unlinkSync(plistpath)
        c(null)
      },
      function(c) {
        app.remove(c)
      }
    ], function(err) {
      return cb(err)
    })
  })
}