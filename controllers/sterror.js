/*!
 * Simple way to manage errors
 */


var errors = exports.errors = {
  /* Missing file errors */
  EDMISCONF: { errno: 1001, msg: 'Missing configuration file' },
  EDMISPKGJ: { errno: 1002, msg: 'Missing package.json file'},
  
  /* Missing key errors */
  EDMISCCID: { errno: 1010, msg: '[config.js] Missing key: companyID' },
  EDMISCPID: { errno: 1011, msg: '[config.js] Missing key: pidPath' },
  EDMISCLDI: { errno: 1012, msg: '[config.js] Missing key: logsDir' },
  EDMISCNUR: { errno: 1013, msg: '[config.js] Missing key: nodeUser' },
  EDMISPORT: { errno: 1014, msg: '[config.js] Missing key: port' },
  EDMISDOMS: { errno: 1015, msg: '[config.js] Missing key: hostname'},
  EDMISEMAI: { errno: 1016, msg: '[config.js] Missing key: emails' },
  
  EDMISPNAM: { errno: 1020, msg: '[package.json] Missing key: name' },
  EDMISPAUT: { errno: 1021, msg: '[package.json] Missing key: author'},
  EDMISPMAI: { errno: 1022, msg: '[package.json] Missing key: main'},
  EDMISPVER: { errno: 1023, msg: '[package.json] Missing key: version'},
  
  EDINVJLAB: { errno: 1030, msg: 'Invalid job label' },
  EDSCRNOEX: { errno: 1031, msg: 'Script path does not exist' },
  EDINVPIDP: { errno: 1032, msg: 'Invalid PID path' },
  EDINVAPNA: { errno: 1033, msg: 'Invalid app name'},
  EDPATNOEX: { errno: 1034, msg: 'App path does not exit' },
  
  EDINVARGS: { errno: 1040, msg: 'Invalid arguments'}
  
};

/**
 * Gets an error from the given errno
 *
 * @param {Number} errno The errno
 * @api public
 */
var errorFromErrno = exports.errorFromErrno = function(errno) {
  var e = new Error();
  var keys = Object.keys(errors);
  var len = keys.length;
  for (var i=0; i<len; i++) {
    var key = keys[i];
    var o = errors[key];
    if (o.errno === errno) {
      e.code = key;
      e.msg = o.msg;
      e.errno = o.errno; 
      break;
    }
  }
  if (!e.code) {
    e.code = 'EDUNKN';
    e.msg = 'Unknown StormTrooper error...are we in Degobah?';
    e.errno = errno;
  }
  return e;
}

/**
 * Gets an error from the given error code
 *
 * @param {String} code The error code
 * @api public
 */
var errorFromCode = exports.errorFromCode = function(code) {
  var e = new Error();
  if (!errors[code]) {
    e.code = 'EDUNKN';
    e.msg = 'Unknown StormTrooper error...are we in Degobah?';
    e.errno = -1;
    return e;
  }
  e.code = code;
  e.msg = errors[code].msg;
  e.errno = errors[code].errno;
  return e;
}

/**
 * Prints the error message for the given errno
 *
 * @param {Number} errno The errno
 * @api public
 */
var strerror = exports.strerror = function(errno) {
  var keys = Object.keys(errors);
  var len = keys.length;
  for (var i=0; i<len; i++) {
    var key = keys[i];
    var e = errors[key];
    if (e.errno == errno) {
      return e.msg;
    }
  }
  return 'Unknown StormTrooper error...are we in Degobah?';
}