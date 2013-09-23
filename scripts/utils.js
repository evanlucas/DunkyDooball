var ctl = require('launchctl')
  , util = require('util')
  , appName = 'com.dunkydooball.server'
  , socketServerName = 'com.dunkydooball.socketserver'
  , appCtl = '/System/Library/LaunchDaemons/com.dunkydooball.server.plist'
  , socketCtl = '/System/Library/LaunchDaemons/com.dunkydooball.socketserver.plist'
  , fs = require('fs')
  , plist = require('plist')
  , path = require('path')
  , Table = require('cli-table')
  , utils = exports

utils.verifyEnv = function(env) {
  return ~['development', 'test', 'production'].indexOf(env.toLowerCase())
}

utils.isInstalled = function() {
  if (!fs.existsSync(appCtl)) return false
  if (!fs.existsSync(socketCtl)) return false
  return true
}

utils.writeConfig = function(env) {
  var confPath = path.resolve(__dirname, '../config/config.js')
  var config = require(confPath)[env]
  var p = {
      'Label': appName
    , 'ProgramArguments': [
        config.nodePath
      , path.join(path.normalize(__dirname + '/..'), 'server.js')
    ]
    , 'RunAtLoad': true
    , 'KeepAlive': true
    , 'EnvironmentVariables': { 
        'NODE_ENV': env
      , 'PATH': "/usr/local/bin:/usr/local/sbin:/usr/bin:/bin:/sbin:/usr/sbin"
    }
    , 'StandardErrorPath': path.join(config.logsDir, 'com.dunkydooball.server.error.log')
    , 'StandardOutPath': path.join(config.logsDir, 'com.dunkydooball.server.output.log')
  };
  
  var data = plist.build(p).toString()
  fs.writeFileSync(appCtl, data, 'utf8')
  p = data = null
  
  p = {
      'Label': socketServerName
    , 'ProgramArguments': [
        config.nodePath
      , path.join(path.normalize(__dirname + '/..'), 'utils', 'socketserver.js')
    ]
    , 'RunAtLoad': true
    , 'KeepAlive': true
    , 'EnvironmentVariables': { 
        'NODE_ENV': env
      , 'PATH': "/usr/local/bin:/usr/local/sbin:/usr/bin:/bin:/sbin:/usr/sbin"
    }
    , 'UserName': config.nodeUser
    , 'StandardErrorPath': path.join(config.logsDir, 'com.dunkydooball.socketserver.error.log')
    , 'StandardOutPath': path.join(config.logsDir, 'com.dunkydooball.socketserver.output.log')
  };
  
  data = plist.build(p).toString()
  fs.writeFileSync(socketCtl, data, 'utf8')
  p = data = null
}

utils.isRoot = function() {
  return (process.getuid() === 0)
}

utils.start = function(label) {
  var res
  try {
    res = ctl.startSync(label)
    if (res !== 0) {
      var e = ctl.errorFromErrno(res)
      return e
    }
  }
  catch(e) {
    return e
  }
  
  return res
}

utils.stop = function(label) {
  var res
  try {
    res = ctl.stopSync(label)
    if (res !== 0) {
      var e = ctl.errorFromCode(res)
      return e
    }
  }
  catch(e) {
    return e
  }
  
  return res
}

utils.load = function(p) {
  var res
  try {
    res = ctl.loadSync(p)
    if (res !== 0) {
      var e = ctl.errorFromCode(res)
      return e
    }
  }
  catch(e) {
    return e
  }
  return res
}

utils.unload = function(p) {
  var res
  try {
    res = ctl.unloadSync(p)
    if (res !== 0) {
      var e = ctl.errorFromCode(res)
      return e
    }
  }
  catch(e) {
    return e
  }
  return res
}

utils.status = function() {
  var serverStatus
    , socketStatus
  
  try { serverStatus = ctl.listSync(appName) }
  catch(e) { serverStatus = false }
  
  try { socketStatus = ctl.listSync(socketServerName) }
  catch(e) { socketStatus = false }
  
  var table = new Table({
    head: ['Name', 'Status']
  })
  
  if (!serverStatus) {
    table.push(['Server', 'Not Running'.red])
  } else {
    table.push(['Server', (serverStatus.PID) ? 'Running'.magenta : 'Not Running'.red])
  }
  
  if (!socketStatus) {
    table.push(['Socket Server', 'Not Running'.red])
  } else {
    table.push(['Socket Server', (socketStatus.PID) ? 'Running'.magenta : 'Not Running'.red])
  }
  console.log(table.toString())
}

utils.createAdmin = function(email, name, password, cb) {
  var user = {
      email    : email
    , name     : name
    , password : password
    , role     : 'Admin'
  };
  var Seeder = require('./seed')
  var seeder = new Seeder(user)
  seeder.save(cb)
}