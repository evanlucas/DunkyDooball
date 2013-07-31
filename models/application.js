var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , debug = require('debug')('DunkyDooball:Application')

var AppSchema = new Schema({
  name: {type: String},
  label: {type: String, unique: true},
  path: {type: String},
  port: {type:Number, unique: true},
  env: {type: String, enum: ['development', 'test', 'production'], default: 'development'},
  author: {type: String},
  pkgVersion: {type: String},
  pidFile: {type: String, unique: true},
  scriptName: {type: String },
  createdAt: { type: Date, default: Date.now },
  domains: [{type: String }],
  emails: [{type: String}]
});

mongoose.model('App', AppSchema);