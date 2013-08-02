/**
 * Module dependencies
 */
var debug = require('debug')('DunkyDooball:System')
  , os = require('os')
  , exec = require('child_process').exec
  , System = exports

/*!
 * Gets the system uptime in hours
 */
var getUptimeHours = System.getUptimeHours = function() {
  return Math.floor(os.uptime() / 3600)
}

/*!
 * Gets the system uptime in minutes
 */
var getUptimeMinutes = System.getUptimeMinutes = function() {
  return Math.floor(os.uptime() / 60)
}

/*!
 * Gets a human readable system uptime
 */
var getUptime = System.getUptime = function() {
  var hours = getUptimeHours()
  var minutes = getUptimeMinutes()
  if ((hours * 60) === minutes) {
    return hours+' hrs.'
  }
  var mins = (minutes-(hours*60))
  return hours+' hrs. '+mins+' mins.'
}

/*!
 * Gets the total memory in GB
 */
var getTotalMem = System.getTotalMem = function() {
  return os.totalmem() / 1048576
}

/*!
 * Gets the free memory in GB
 */
var getFreeMem = System.getFreeMem = function() {
  return os.freemem() / 1048576
}

/*!
 * Gets the system load average (fixed to 2 decimal places)
 */
var getLoadAvg = System.getLoadAvg = function() {
  return os.loadavg()[0].toFixed(2)
}

/**
 * Gets the OS version, build, and release
 *
 * @param {Function} cb function(err, data)
 * @api private
 */
var getOS = System.getOS = function(cb) {
  var osType = os.type();
  var release = os.release();
  var o = {};
  exec('sw_vers', function(err, stdout, stderr) {
    if (err) {
      logger.error('Error getting sw_vers');
      logger.error(err);
      return cb && cb(err);
    }
    var data = stdout.split("\n");
    for (var i=0; i<data.length; i++) {
      var line = data[i];
      if (line == "") continue;
      if (matches = line.match(/([\w]+)([:])([\s]+)(.*)/)) {
        var key = matches[1];
        var val = matches[4];
        o[key] = val;
      }
    }
    return cb && cb(null, o);
  });
}

/**
 * Gets general system info
 *
 * @param {Function} cb function(err, data)
 * @api public
 */
var getGeneralData = System.getGeneralData = function(cb) {
  var data = {
    hostname: os.hostname(),
    osType: os.type(),
    platform: os.platform(),
    cores: os.cpus().length,
    arch: os.arch(),
    cpuSpeed: os.cpus()[0].speed / 1000
  };
  
  data.uptime = {
    minutes: getUptimeMinutes(),
    hours: getUptimeHours(),
    formatted: getUptime()
  };
  
  data.nodeversion = process.version;
  data.memory = {
    totalmem: Math.round(getTotalMem()),
    freemem: Math.round(getFreeMem())
  };
  data.loadavg = getLoadAvg();
  getOS(function(err, res) {
    if (err) {
      debug('Error getting os');
      console.log(err);
      return cb(err);
    } else {
      data.os = res;
      return cb(null, data);
    }
  });
}

/**
 * Gets network interfaces
 *
 * @api public
 * @returns Array
 */
var getNetworkData = System.getNetworkData = function() {
  var netInt = os.networkInterfaces()
  var keys = Object.keys(netInt);
  var ips = [];
  if (keys.length) {
    keys.forEach(function(key, index) {
      var netI = netInt[key];
      for (var a=0; a<netI.length; a++) {
        var ne = netI[a];
        if (ne.family === 'IPv4') {
          ips.push({
              ip: ne.address
            , interface: key
            , family: ne.family
          });
        }
      }
    });
  }
  
  return ips;
}