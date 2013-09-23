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

Users.getUsersUI = function(req, res) {
  var sort = {}
    , skip = 0
    , limit = 10
    , cols = ['name', 'role', 'email', 'createdAt', 'createdBy.name']
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

  User
    .find({})
    .skip(skip)
    .limit(limit)
    .sort(sort)
    .populate('createdBy')
    .exec(function(err, users) {
      if (err) {
        logger.error('Error finding users for DataTables:', err)
        return res.send(500)
      }
      User.count().exec(function(err, count) {
        if (err) {
          logger.error('Error counting users for DataTables:', err)
          return res.send(500)
        }
        output.iTotalRecords = count
        output.iTotalDisplayRecords = users.length
        var aaData = []

        users.forEach(function(user) {
          var row = []
          var name = user.name || 'N/A'
          row.push(name)
          row.push(formatRole(user))
          row.push(formatEmail(user))
          row.push(moment(user.createdAt).format('MMM Do, YYYY'))
          logger.info('user:', user)
          var u = (user.createdBy && user.createdBy.name) ? user.createdBy.name : 'N/A'
          row.push(u)
          row.push(actionButtonsForUser(user, req.user))
          aaData.push(row)
        })
        output.aaData = aaData
        output.sEcho = Number(req.param('sEcho'))
        return res.send(200, output)
      })
    })

}

function formatEmail(user) {
  return '<a href="mailto:'+user.email+'">'+user.email+'</a>'
}

function formatRole(user) {
  return '<span class="user-role" data-role="'+user.role+'">'+user.role+'</span>'
}
function actionButtonsForUser(userToEdit, currentUser) {
  var output = ''
  if (userToEdit.role === 'Admin' && currentUser.role === 'Management') {
    return output
  }
  // Edit Button
  output += '<a href="#" data-id="'+userToEdit.id+'" data-name="'+userToEdit.name+'" data-role="'+userToEdit.role+'" class="btn btn-primary btn-edit" title="Edit User" rel="tooltip" data-position="top" data-trigger="hover"-><i class="icon-pencil"></i></a>'
  
  // Delete Button
  output += '<a href="#" data-id="'+userToEdit.id+'" data-name="'+userToEdit.name+'" class="btn btn-danger btn-delete" title="Delete User" rel="tooltip" data-position="top" data-trigger="hover"><i class="icon-trash"></i></a>'
  return output
}