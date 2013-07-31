/**
 * Module dependencies
 */

var debug = require('debug')('DunkyDooball:plist')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../config/config')[env]
  , fs = require('fs')
  , path = require('path')
  , plist = require('plist')
  , logger = require('loggerjs')('plist')
  , errors = require('./sterror')


/**
 * Constructor
 *
 * Will throw errors for missing configuration keys
 *
 */
var STPlist = module.exports = function(isTesting) {
  debug('Constructing STPlist')
  if (!config.companyID) {
    // Missing companyID
    var e = errors.errorFromCode('EDMISCOID');
    logger.error(e);
    throw e;
  }

  if (!config.pidPath) {
    // Missing pidPath
    var e = errors.errorFromCode('EDMISPIDP');
    logger.error(e);
    throw e;
  }
  
  if (!config.logsDir) {
    // Missing logsDir
    var e = errors.errorFromCode('EDMISLOGD');
    logger.error(e);
    throw e;
  }
  
  if (!config.nodeUser) {
    var e = errors.errorFromCode('EDMISNOUS');
    logger.error(e);
    throw e;
  }
  
  this.isTesting = isTesting || false;
  
}

/**
 * Normalizes an application name
 *
 * @param {String} appName The application name
 * @api public
 */
STPlist.prototype.normalizeAppName = function(appName) {
  debug('Normalizing app: %s', appName);
  if (!appName) return appName;
  return appName.replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Builds reverse DNS for the given `appName`
 *
 * @param {String} appName The application name
 * @api public
 */
STPlist.prototype.getReverseDNS = function(appName) {
  debug('Building reverse DNS for app named: %s', appName);
  var self = this;
  if (!appName) return "";
  var norm = self.normalizeAppName(appName);
  return config.companyID+'.'+norm;
}

/**
 * Builds the name of the launchd configuration plist
 *
 * @param {String} appName The application name
 * @api private
 */
STPlist.prototype.getPlistName = function(appName) {
  debug('Building plist name')
  return this.getReverseDNS(appName)+'.plist';
}

/**
 * Builds the plist path for the given `appName`
 *
 * @param {String} appName The application name
 * @api public
 */
STPlist.prototype.getPlistPath = function(appName) {
  debug('Building plist path')
  if (!appName) return "";
  var plistName = this.getPlistName(appName);
  
  if (this.isTesting) {
    return path.join(path.normalize(__dirname + '/..'), 'TestPlists', plistName);
  }
  
  return path.join('/System', 'Library', 'LaunchDaemons', plistName);
}

/**
 * Builds the PID filename for the given `appName`
 *
 * @param {String} appName The application name
 * @api public
 */
STPlist.prototype.getPIDFilename = function(appName) {
  debug('Building PID filename')
  if (!appName) return "";
  return this.normalizeAppName(appName)+'.pid';
}

/**
 * Builds the path to the PID file for the given `appName`
 *
 * @param {String} appName The application name
 * @api public
 */
STPlist.prototype.getPIDPath = function(appName) {
  debug('Building PID path')
  if (!appName) return "";
  return path.join(config.pidPath, this.getPIDFilename(appName));
}

/**
 * Gets the environment to run the app under
 * Defaults to `development`
 *
 * @param {String} e The app environment
 * @api private
 */
STPlist.prototype.getEnv = function(e) {
  if (!e || e == "") return 'development';
  var en = 'development';
  
  switch(e) {
    case 'development':
    case 'dev':
    case 'd':
      en = 'development';
      break;
    case 'test':
    case 't':
      en = 'test';
      break;
    case 'production':
    case 'prod':
    case 'p':
      en = 'production';
      break;    
  }
  
  return en;
}

/**
 * Builds the log paths for the given `appName`
 *
 * @param {String} appName The application name
 * @api private
 */
STPlist.prototype.getLogPaths = function(appName) {
  debug('Building log paths')
  if (!appName) return "";
  var self = this;
  var revDNSName = self.getReverseDNS(appName);
  if (revDNSName == "") {
    return {};
  }
  
  var logs = {};
  logs.error = path.join(config.logsDir, revDNSName+'.error.log');
  logs.output = path.join(config.logsDir, revDNSName+'.output.log');
  debug('Error log path: %s', logs.error);
  debug('Output log path: %s', logs.output);
  return logs;
}

/**
 * Builds the launchd configuration plist object
 *
 * @param {String} appName The application name
 * @param {String} scriptPath The path to the main script
 * @param {String} environment The application environment
 * @param {Function} cb function(err, plistObject)
 * @api public
 */
STPlist.prototype.buildPlistObject = function(appName, scriptPath, environment, cb) {
  debug('Building plist object')
  var self = this
    , logs = self.getLogPaths(appName)
    , pidPath = self.getPIDPath(appName)
  
  
  
  var plistObject = {};
  
  /**
   * Set job label
   * Verify it didnt return ""
   */
  var label = self.getReverseDNS(appName);
  
  if (label == "") {
    var e = errors.errorFromCode('EDINVJLAB');
    logger.error(e);
     return cb(e);
  }
  
  /*!
   * Set the job label
   * Should be reverse DNS
   */  
  plistObject['Label'] = label;
  
  /*!
   * Set program arguments
   * Must first verify that the path exists
   */ 

  
  if (!fs.existsSync(scriptPath)) {
    var e = errors.errorFromCode('EDSCRNOEX');
    logger.log(e);
    return cb(e);
  }

  /*!
   * Args that are used when running the app
   */
  plistObject['ProgramArguments'] = [
    config.nodePath,
    scriptPath
  ];
  
  /*!
   * The app will start when the system boots (If it is meant to)
   */
  plistObject['RunAtLoad'] = true;
  
  /*!
   * Get PID path
   * Verify it is valid
   */
  var pidPath = self.getPIDPath(appName);
  if (pidPath == "") {
    var e = errors.errorFromCode('EDINVPIDP');
    logger.error(e);
    return cb(e);
  }
  
  /*!
   * Set the keepalive to use essentially a pid file
   */
  plistObject['KeepAlive'] = {};
  plistObject['KeepAlive']['PathState'] = {};
  plistObject['KeepAlive']['PathState'][pidPath] = true;
  
  var en = self.getEnv(environment);
  plistObject['EnvironmentVariables'] = {
    'NODE_ENV': en
  };
  
  /*!
   * Prevent the app from running as root
   */
  plistObject['UserName'] = config.nodeUser;
  
  /*!
   * Set log paths
   */
  plistObject['StandardErrorPath'] = logs.error;
  plistObject['StandardOutPath'] = logs.output;
  
  /*!
   * Generate the plist
   */
  var plistData = plist.build(plistObject).toString();
  var plistPath = self.getPlistPath(appName);
  /*!
   * Write the plist to file
   */
  fs.writeFile(plistPath, plistData, 'utf8', function(err) {
    if (err) {
      logger.error(err);
      return cb(err);
    } else {
      logger.info('Successfully wrote launchd configuration plist');
      return cb(null, plistObject);
    }
  })
}