/**
 * Module dependencies
 */

var logger = require('loggerjs')('Sockets')
  , debug = require('debug')('DunkyDooball:sockets')
  , SessionSockets = require('session.socket.io')
  , mongoose = require('mongoose')
  , User = mongoose.model('User')
  , App = mongoose.model('App')
  , sys = require('../controllers/system')
  , ResetPassword = mongoose.model('ResetPass')
  , mailer = require('../controllers/mailer')

var getUserFromSession = function(id, cb) {
  User.findById(id, cb)
}

var methods = ['createUser', 'editUser', 'deleteUser', 'grabData']

module.exports = exports = SOCK

function SOCK(io, masterIO) {
  this.io = io
  this.masterIO = masterIO
  var self = this
  io.on('connection', function(err, socket, session) {
    if (err) {
      logger.error('Error connecting to socket: ', err)
    } else {
      var user = session.passport.user
      debug('User: ['+user+']')
      methods.forEach(function(method) {
        socket.on(method, function(data) {
          return self[method](data, socket, user, masterIO)
        })
      })
    }
  })
}

SOCK.prototype.createUser = function(data, socket, session) {
  debug('createUser')
  var self = this
  if (!data.hasOwnProperty('name') || !data.hasOwnProperty('email')) {
    return socket.emit('createUserError', 'Creating a user requires both an email and a name')
  } else {
    getUserFromSession(session, function(err, user) {
      if (err || !user) {
        logger.error('Error finding user: ', err)
        return socket.emit('createUserError', 'Error creating user')
      } else {
        if (user.role !== 'Admin' && data.role === 'Admin') {
          logger.error('Error creating user: ', user, 'is trying to create an admin')
          return socket.emit('createUserError', 'You are not authorized to create an admin')
        }
        var u = new User()
        u.name = data.name
        u.email = data.email
        u.createdBy = user
        u.apiKey = u.generateAPIKey(new Date())
        u.role = data.role || 'User'
        u.password = u.generatePassword(new Date())
        u.save(function(err) {
          if (err) {
            logger.error('Error creating user: ', err)
            return socket.emit('createUserError', 'Error creating user')
          } else {
            mailer.sendNewUserEmail(u.name, u.email, u.password, function(err) {
              if (err) {
                logger.error('Error sending email: ', err)
              }
            })
            return socket.emit('createUserSuccess', 'Successfully created user')
          }
        })
      }
    })
  }
}

SOCK.prototype.editUSer = function(data, socket, session) {
  debug('editUser')
  var self = this
  getUserFromSession(session, function(err, user) {
    if (err || !user) {
      logger.error('Error populating user:', err)
      return socket.emit('editUserError', 'Error editing user')
    } else {
      if (user.role !== 'Admin' && data.role === 'Admin') {
        // A non-admin cannot change an Admin's role
        logger.error('Error editing user:', user, 'is trying to change an admin\'s role')
        return socket.emit('editUserError', 'You are not authorized to edit this user')
      }
      User.findByIdAndUpdate(data.id, { $set: { role: data.role }}, function(err, u) {
        if (err) {
          logger.error('Error updating user: ', err)
          return socket.emit('editUserError', 'Error editing user')
        } else {
          socket.emit('editUserSuccess', 'Successfully edited user')
        }
      })
    }
  })
}

SOCK.prototype.deleteUser = function(data, socket, session) {
  debug('deleteUser')
  getUserFromSession(session, function(err, user) {
    if (err || !user) {
      logger.error('Error populating user:', err)
      return socket.emit('deleteUserError', 'Error deleting user')
    } else {
      if (user.role !== 'Admin' && data.role === 'Admin') {
        // A non-admin cannot change an Admin's role
        logger.error('Error deleting user:', user, 'is trying to delete an admin')
        return socket.emit('deleteUserError', 'You are not authorized to delete this user')
      }
      User.findByIdAndRemove(data.id, function(err, u) {
        if (err) {
          logger.error('Error deleting user:', err)
          return socket.emit('deleteUserError', 'Error deleting user')
        } else {
          socket.emit('deleteUserSuccess', 'Successfully deleted user')
        }
      })
    }    
  })
}

SOCK.prototype.grabData = function(data, socket, session) {
  var data = {
      totalmem: sys.getTotalMem()
    , freemem: sys.getFreeMem().toFixed(0)
    , loadavg: sys.getLoadAvg()
    , cpuCount: sys.getCPUCount()
  };
  socket.emit('grabDataSuccess', data)
}