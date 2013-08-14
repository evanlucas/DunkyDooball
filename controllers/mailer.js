var nodemailer = require('nodemailer')
  , logger = require('loggerjs')('Mailer')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../config/config')[env]

/**
 * I know, I know...plaintext...need a better way of doing this
 * This is how it is (TEMPORARILY)
 */
exports.sendNewUserEmail = function(name, email, password, cb) {
  var message = {
      from: config.supportEmail
    , to: email
    , subject: 'Your DunkyDooball account has been created.'
  };
  var transport
  var smtp = config.mailTransport
  if (smtp.method.toLowerCase() === 'sendmail') {
    transport = nodemailer.createTransport('Sendmail', smtp.config)
  } else if (smtp.method.toLowerCase() === 'smtp') {
    transport = nodemailer.createTransport('SMTP', {
        service: smtp.service
      , auth: smtp.config
    })
  } else {
    logger.error('Invalid mail transport method')
    return cb && cb()
  }
  
  message.html = [
      '<html>'
    , '<head>'
    , '<link rel="stylesheet" href="'+config.cssUrl+'">'
    , '</head>'
    , '<body>'
    , '<h3>Your DunkyDooball account has been created</h3>'
    , '<hr>'
    , '<img src="'+config.logoUrl+'">'
    , '<p>Hello '+name+'</p>'
    , '<p>Your login is '+email+' and your password is '+password+'</p>'
    , '</body>'
    , '</html>'
  ].join("\n")
  
  transport.sendMail(message, cb)
}