var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , crypto = require('crypto')

function generateToken() {
  var d = (new Date()).valueOf().toString()
  var ran = Math.random().toString()
  return crypto.createHash('sha1').update(d+ran).digest('hex')
}

var ResetPassSchema = new Schema({
  token: { type: String, unique: true },
  user: { type: Schema.ObjectId, ref: 'User'}
})

ResetPassSchema.method('generateToken', function() {
  var d = (new Date()).valueOf().toString()
  var ran = Math.random().toString()
  return crypto.createHash('sha1').update(d+ran).digest('hex')
})

mongoose.model('ResetPass', ResetPassSchema)