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

var getUserFromSession = function(session, cb) {
  User.findById(session.passport.user, cb)
}

var createUser = function(data, socket, session) {
  debug('createUser')
  var user = getUserFromSession(session, function(err, user) {
    if (err || !user) {
      logger.error('Error populating user:', err)
      return socket.emit('createUserError', 'Error creating user')
    } else {
      if (user.role !== 'Admin' && data.role === 'Admin') {
        // A non-admin cannot change an Admin's role
        logger.error('Error creating user:', user, 'is trying to create an admin')
        return socket.emit('createUserError', 'You are not authorized to create an admin')
      }
      var u = new User()
      u.name = data.name
      u.email = data.email
      u.apiKey = u.generateAPIKey(new Date())
      u.role = data.role || 'User'
      u.requiresChange = true
      // Generate a reset token
      var p = new ResetPassword({email: data.email})
      p.token = p.generateToken(new Date())
      u.save(function(err) {
        if (err) {
          logger.error('Error saving user:', err)
          return socket.emit('createUserError', 'Error creating user')
        } else {
          p.save(function(err, resetPass) {
            if (err) {
              logger.error('Error creating password token:', err)
              return socket.emit('createUserError', 'Error creating user')
            } else {
              // Send password reset email
              var token = resetPass.token
              
            }
          })
        }
      })
    }
  })
}

var editUser = function(data, socket, session) {
  debug('editUser')
  var user = getUserFromSession(session, function(err, user) {
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
          logger.error('Error updating user:', err)
          return socket.emit('editUserError', 'Error editing user')
        } else {
          socket.emit('editUserSuccess', 'Successfully edited user')
        }
      })
    }    
  })
}

var deleteUser = function(data, socket, session) {
  debug('deleteUser')
  var user = getUserFromSession(session, function(err, user) {
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

var grabData = function(socket, session) {
  var data = {
      totalmem: sys.getTotalMem()
    , freemem: sys.getFreeMem().toFixed(0)
    , loadavg: sys.getLoadAvg()
    , cpuCount: sys.getCPUCount()
  };
  socket.emit('grabDataSuccess', data)
}

module.exports = function(io) {
  io.on('connection', function(err, socket, session) {
    if (err) {
      logger.error('Error connecting to socket:', err)
    } else {
      debug('Successfully connected to socket')
      debug('User: ['+session.passport.user+']')
      
/*
      socket.on('createUser', function(data) {
        
      })
*/
      socket.on('grabData', function() {
        return grabData(socket, session)
      })
      
      socket.on('deleteUser', function(data) {
        return deleteUser(data, socket, session)
      })
      
      socket.on('editUser', function(data) {
        return editUser(data, socket, session)
      })
    }
  })
}