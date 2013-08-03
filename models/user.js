var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , crypto = require('crypto')

var UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  hashed_password: { type: String },
  salt: { type: String },
  apiKey: { type: String, unique: true},
  role: { type: String, enum: ['Admin', 'Management', 'User'], default: 'User'},
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.ObjectId, ref: 'User' },
  requiresChange: { type: Boolean, default: false }
})


UserSchema
  .virtual('password')
  .set(function(password) {
    this._password = password
    this.salt = this.makeSalt()
    this.hashed_password = this.encryptPassword(password)
  })
  .get(function() { return this._password })

var validateValue = function(v) {
  return v && v.length
}

UserSchema.path('name').validate(function(n) {
  return validateValue(n)
})

UserSchema.path('email').validate(function(e) {
  return validateValue(e)
})

UserSchema.pre('save', function(next) {
  if (!this.isNew) return next()
  if (!validateValue(this.password)) return next(new Error('Invalid password'))
  next()
})

UserSchema.method('generateAPIKey', function(date) {
  var d = (date).valueOf().toString()
  var ran = Math.random().toString()
  return crypto.createHash('sha1').update(d+ran).digest('hex')
})

UserSchema.method('authenticate', function(p) {
  return this.encryptPassword(p) === this.hashed_password
})

UserSchema.method('makeSalt', function() {
  return Math.round((new Date().valueOf() * Math.random())) + ''
})

UserSchema.method('encryptPassword', function(p) {
  if (!validateValue(p)) return ''
  return crypto.createHmac('sha1', this.salt).update(p).digest('hex')
})

mongoose.model('User', UserSchema)