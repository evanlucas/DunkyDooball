var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../config/config')[env]
  , fs = require('fs')
  , logger = require('loggerjs')('SEEDER')
  , path = require('path')
  , root = path.normalize(__dirname+'/..')

var Seeder = function(obj) {
  this.obj = obj;
  mongoose.connect(config.db)
  fs.readdirSync(path.join(root, 'models')).forEach(function(f) {
    if (path.extname(f) === '.js') {
      require(path.join(root, 'models', f))
    }
  })
}

Seeder.prototype.save = function(cb) {
  var User = mongoose.model('User')
  var user = new User(this.obj)
  user.apiKey = user.generateAPIKey(new Date())
  user.save(cb)
}

module.exports = Seeder