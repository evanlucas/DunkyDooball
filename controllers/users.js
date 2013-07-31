/**
 * Module dependencies
 */
var debug = require('debug')('DunkyDooball:Users')
  , logger = require('loggerjs')('Users')
  , mongoose = require('mongoose')
  , User = mongoose.model('User')
  , ResetPass = mongoose.model('ResetPass')
  , helper = require('./helper')
  , moment = require('moment')

/*!
 * Expose exports
 */
var Users = exports


/*!
 * Params
 */
Users.user = function(req, res, next, id) {
  debug('Users.user')
  User.findOne({_id: id}, function(err, user) {
    if (err) return next(err)
    req.user = user
    next()
  })
}

/*!
 * API
 */

/*!
 * HTTP handler for creating a user
 */
Users.createUser = function(req, res) {
  debug('Users.createUser')
  var body
  if (req.body) {
    body = req.body
  } else {
    return res.send(200, {
        status: 'error'
      , message: 'Invalid format. Please send as JSON'
    })
  }
  var email = body.email
  email = email.toLowerCase()
  var name = body.name
  var user = new User()
  user.name = name
  user.email = email
  var password = body.password
  user.password = password
  var role
  if (!body.role) {
    role = 'User'
  } else {
    var roles = ['Admin', 'Management', 'User']
    if (roles.indexOf(body.role) === -1) {
      role = 'User'
    } else {
      role = body.role
    }
  }
  user.role = role
  user.createdBy = req.user
  user.apiKey = user.generateAPIKey(new Date())
  user.save(function(err) {
    if (err) {
      logger.error(err)
      if (err.err) {
        if (err.err.indexOf('duplicate key') !== -1) {
          return res.send(200, {
              status: 'error'
            , message: 'Email already exists'
            , error: err
          })
        }
      }
      return res.send(200, {
          status: 'error'
        , message: 'Error creating user'
        , error: err
      })
    } else {
      return res.send(200, {
          status: 'success'
        , data: {
            message: 'Successfully created user'
          , apiKey: user.apiKey
        }
      })
    }
  })
}

/*!
 * HTTP handler for authenticating a user
 */
Users.authenticate = function(req, res) {
  debug('Users.authenticate')
  var body = req.body
  var email = body.email
  if (!email || email === "") {
    return res.send(200, {
        status: 'error'
      , message: 'Invalid email'
    })
  }
  email = email.toLowerCase()
  var password = body.password
  User.findOne({email: email}, function(err, user) {
    if (err) {
      logger.error(err)
      return res.send(200, {
          status: 'error'
        , message: 'Invalid email'
      })
    } else {
      if (!user) {
        logger.error('Invalid user')
        return res.send(200, {
            status: 'error'
          , message: 'Invalid email'
        })
      } else {
        if (user.authenticate(password)) {
          return res.send(200, {
              status: 'success'
            , data: {
              apiKey: user.apiKey
            }
          })
        } else {
          logger.error('Invalid credentials')
          return res.send(200, {
              status: 'error'
            , message: 'Invalid credentials'
          })
        }
      }
    }
  })
}