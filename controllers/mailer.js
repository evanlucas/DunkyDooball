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
    , '<style>'
    , '  code,kbd,pre,samp { font-family: monospace, serif; font-size: 1em; }'
    , '  code,pre { padding: 0 3px 2px; font-family: Monaco, Menlo, Consolas, "Courier New", monospace; font-size: 12px; color: #333333; border-radius: 4px; }'
    , '  code { padding: 2px 4px; font-size: 90%; color: #c7254e; white-space: nowrap; background-color: #f9f2f4; }'
    , '</style>'
    , '</head>'
    , '<body>'
    , '<h3>Your DunkyDooball account has been created</h3>'
    , '<p>Hello '+name+'</p>'
    , '<p>Your login is '+email+' and your password is '+password+'</p>'
    , '</body>'
    , '</html>'
  ].join("\n")
  
  transport.sendMail(message, cb)
}