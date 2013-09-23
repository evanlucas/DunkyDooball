/**
 * Module dependencies
 */
var debug = require('debug')('DunkyDooball:Router')
  , logger = require('loggerjs')('Router')
  , mongoose = require('mongoose')
  , User = mongoose.model('User')

var success = function(msg) {
  if (!msg) {
    return {status: 'success'};
  }
  return {
      status: 'success'
    , message: msg
  }
}

var error = function(msg, err) {
  if (err) {
    return {
        status: 'error'
      , message: msg
      , error: err
    };
  }
  return {
      status: 'error'
    , message: msg
  };
}

/**
 * Middleware
 */

function requiresAuthUI(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/login')
  }
  next()
}

function requiresAdminUI(req, res, next) {
  if (!req.isAuthenticated()) return res.redirect('/login')
  var user = req.user
  if (!user || (user && user.role !== 'Admin')) {
    return res.render('errors/401', {
      path: req.path
    })
  }
  
  next()
}

module.exports = function(app, proxyServer, socketclient, passport) {
  /**
   * Management Portal Routes
   * Only serve routes is config.enableUI === true
   */
  if (app.config.enableUI) {
    var pages = require('../controllers/pages')
    app.get('/', requiresAuthUI, pages.renderIndex)
    app.get('/network', requiresAuthUI, pages.renderNetwork)
    app.get('/apps', requiresAuthUI, pages.renderApps)
    app.get('/users', requiresAuthUI, pages.renderUsers)
    app.get('/login', function(req, res) {
      res.render('login')
    })
    app.post('/login', function(req, res, next) {
      passport.authenticate('local', function(err, user, info) {
        if (err) return next(err)
        if (!user) {
          req.session.messages = [info.message]
          return res.redirect('/login')
        }
        req.logIn(user, function(err) {
          if (err) return next(err)
          return res.redirect('/')
        })
      })(req, res, next)
    })
    
  }
  
  app.get('/api', function(req, res) {
    res.send(200, success('API is alive and kicking'))
  })
  
  var requiresAuth = function(req, res, next) {
    if (req.user) return next()
    if (req.get('X-Auth-Token')) {
      var apiKey = req.get('X-Auth-Token')
      req.apiKey = apiKey
      User.findOne({
        apiKey: apiKey
      }, function(err, user) {
        if (err) {
          return res.send(200, error('Invalid auth token'));
        } else {
          if (user) {
            req.user = user
            return next()
          } else {
            return res.send(200, error('Unauthorized'))
          }
        }
      })
    } else {
      return res.send(200, error('Invalid auth token'))
    }
  }
  
  var requiresAdmin = function(req, res, next) {
    if (req.user && req.user.role === 'Admin') return next()
    if (req.get('X-Auth-Token')) {
      var apiKey = req.get('X-Auth-Token')
      req.apiKey = apiKey
      User.findOne({
        apiKey: apiKey
      }, function(err, user) {
        if (err) {
          return res.send(200, error('Invalid auth token'));
        } else {
          if (user) {
            req.user = user
            if (user.role === 'Admin') {
              return next()
            }
            return res.send(200, error('You do not have the authorization to make this request'))
          } else {
            return res.send(200, error('Unauthorized'))
          }
        }
      })
    } else {
      return res.send(200, error('Invalid auth token'))
    }    
  }
  
  /**
   * User related API routes
   */
  var users = require('../controllers/users')
  
  app.post('/api/users/create', requiresAdmin, users.createUser)
  app.post('/api/users/auth', users.authenticate)
  
  /**
   * Application related API routes
   */
  var api = require('../controllers/api')
  api.setServer(proxyServer)
  api.setSocketClient(socketclient)
  
  app.param('appName', api.appName)
  app.get('/api/apps/list', requiresAuth, api.listAll)
  app.get('/api/apps/list/:appName', requiresAuth, api.list)
  app.post('/api/apps/:appName/start', requiresAdmin, api.start)
  app.post('/api/apps/:appName/stop', requiresAdmin, api.stop)
  app.post('/api/apps/:appName/remove', requiresAdmin, api.remove)
  app.post('/api/apps/create', requiresAdmin, api.create)
  app.post('/api/apps/:appName/pull', requiresAdmin, api.pull)
  app.post('/api/apps/:appName/install', requiresAdmin, api.install)
  app.put('/api/apps/:appName', requiresAdmin, api.update)
  
  /**
   * UI related API routes for DataTables
   */
  app.get('/api/ui/apps', requiresAuth, api.getAppsUI)
  app.get('/api/ui/users', requiresAdmin, users.getUsersUI)
  
  app.all('/api/*', function(req, res) {
    return res.send(200, {
        status: 'error'
      , message: 'Route not found'
    })
  })
}