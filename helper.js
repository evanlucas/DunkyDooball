#!/usr/bin/env node
var colors = require('colors')
  , util = require('util')
  , program = require('commander')
  , pkg = require('./package')
  , appName = 'com.dunkydooball.server'
  , socketServerName = 'com.dunkydooball.socketserver'
  , appCTLPath = '/System/Library/LaunchDaemons/com.dunkydooball.server.plist'
  , socketCTLPath = '/System/Library/LaunchDaemons/com.dunkydooball.socketserver.plist'
  , ctl = require('launchctl')
  , fs = require('fs')

program
  .version(pkg.version)
  

program
  .command('start')
  .description('Starts the server')
  .action(function() {
    requiresRoot()
    loadPath(appCTLPath)
    loadPath(socketCTLPath)
    console.log('info: '.cyan, 'Successfully started server')
    process.exit()
  })

program
  .command('restart')
  .description('Restarts the server')
  .action(function() {
    requiresRoot()
    stopWithLabel(socketServerName)
    console.log('info: '.cyan, 'Successfully restarted server')
    process.exit()
  })

program
  .command('stop')
  .description('Stops the server and unloads its launchd config files (prevents restarting)')
  .action(function() {
    requiresRoot()
    try {
      stopWithLabel(socketServerName)
    }
    catch (e) {}
    unloadPath(appCTLPath)
    unloadPath(socketCTLPath)
    console.log('info: '.cyan, 'Successfully stopped server')
    process.exit()
  })

program
  .command('test')
  .description('Run unit tests')
  .action(function(){
    var Mocha = require('mocha')
    var mocha = new Mocha({
        ui: 'bdd'
      , reporter: 'spec'
    })
    mocha.addFile(__dirname+'/tests/test.js')
    mocha.run(function(errs) {
      process.exit(errs)
    })
  })

program
  .command('status')
  .description('Get the status of the main server and the socket server')
  .action(function() {
    requiresRoot()
    var serverStatus
      , socketStatus
      , Table = require('cli-table')
    
    try {
      serverStatus = ctl.listSync(appName)
    }
    catch (e) {
      serverStatus = false
    }
    
    try {
      socketStatus = ctl.listSync(socketServerName)
    }
    catch (e) {
      socketStatus = false
    }
    
    var table1 = new Table({
      head: ['Label', 'Status']
    })
    
    if (!serverStatus) {
      table1.push(['com.dunkydooball.server', 'Not Running'.red])
    } else {
      table1.push(['com.dunkydooball.server', (serverStatus.PID) ? 'Running'.magenta : 'Not Running'.red])
    }
    
    if (!socketStatus) {
      table1.push(['com.dunkydooball.socketserver', 'Not Running'.red])
    } else {
      table1.push(['com.dunkydooball.socketserver', (socketStatus.PID) ? 'Running'.magenta : 'Not Running'.red])
    }
    
    console.log(table1.toString())
    process.exit()
  })

program
  .command('install <env>')
  .description('Performs a full install')
  .action(function(env) {
    requiresRoot()
    if (!verifyEnv(env)) {
      console.log('error:'.red, 'Invalid environment')
      console.log('error:'.red, 'Please specify one of `development`, `test`, or `production`')
      process.exit(1)
    }
    
    writeConfig(env)
    console.log()
    console.log('info: '.cyan, 'Beginning admin user setup')
    var user = {};
    user.role = 'Admin'
    program.prompt('Name: ', function(name) {
      user.name = name
      program.prompt('Email: ', function(email) {
        user.email = email
        program.password('Password: ', '*', function(p) {
          user.password = p
          var seeder = new (require('./scripts/seed'))(user)
          seeder.save(function(err) {
            if (err) {
              console.log('error:'.red, err)
              process.exit(1)
            } else {
              console.log('info: '.cyan, 'Successfully created admin user')
              process.exit()
            }
          })
        })
      })
    })

  })


program.parse(process.argv)

if (program.args.length < 1) program.help()

function requiresRoot() {
  if (process.getuid() !== 0) {
    console.log('error:'.red, 'Error performing install')
    console.log('error:'.red, 'This option requires root')
    process.exit()
  }
}

function verifyEnv(env) {
  return ~['development', 'test', 'production'].indexOf(env.toLowerCase())
}

function isInstalled() {
  if (!fs.existsSync(appCTLPath)) return false
  if (!fs.existsSync(socketCTLPath)) return false
  return true
}

function checkInstall() {
  if (isInstalled()) return
  console.log()
  console.log('error:'.red, 'You must first install DunkyDooball')
  console.log()
  program.help()
}

function startWithLabel(label) {
  checkInstall()
  try {
    var res = ctl.startSync(label)
    if (res !== 0) {
      console.log('error:'.red, 'Error starting: '+label)
      var e = ctl.errorFromErrno(res)
      console.log('error:'.red, e)
      throw e
    }
  }
  catch (e) {
    console.log('error:'.red, 'Error starting: '+label)
    console.log('error:'.red, e)
    throw e
  }
}

function stopWithLabel(label) {
  checkInstall()
  try {
    var res = ctl.stopSync(label)
    if (res !== 0) {
      console.log('error:'.red, 'Error stopping: '+label)
      var e = ctl.errorFromErrno(res)
      console.log('error:'.red, e)
      throw e
    }
  }
  catch (e) {
    console.log('error:'.red, 'Error stopping: '+label)
    console.log('error:'.red, e)
    throw e
  }
}

function unloadPath(p) {
  checkInstall()
  try {
    var res = ctl.unloadSync(p)
    if (res !== 0) {
      console.log('error:'.red, 'Error unloading: '+label)
      var e = ctl.errorFromErrno(res)
      console.log('error:'.red, e)
      throw e
    }    
  }
  catch (e) {
    console.log('error:'.red, 'Error unloading: '+label)
    console.log('error:'.red, e)
    throw e
  }
}

function loadPath(p) {
  checkInstall()
  try {
    var res = ctl.loadSync(p)
    if (res !== 0) {
      console.log('error:'.red, 'Error loading: '+label)
      var e = ctl.errorFromErrno(res)
      console.log('error:'.red, e)
      throw e
    }    
  }
  catch (e) {
    console.log('error:'.red, 'Error loading: '+label)
    console.log('error:'.red, e)
    throw e
  }
}

function writeConfig(env) {
  var plist = require('plist')
    , config = require('./config/config')[env]
    , path = require('path')
  
  /**
   * Setup launchdaemons
   */
  var dunkyPlistObj = {};
  dunkyPlistObj['Label'] = appName
  dunkyPlistObj['ProgramArguments'] = [
      config.nodePath
    , path.join(__dirname, 'server.js')
  ]
  
  dunkyPlistObj['RunAtLoad'] = true
  dunkyPlistObj['KeepAlive'] = true
  dunkyPlistObj['EnvironmentVariables'] = {
    NODE_ENV: env
  };
  dunkyPlistObj['StandardErrorPath'] = path.join(config.logsDir, 'com.dunkydooball.server.error.log')
  dunkyPlistObj['StandardOutPath'] = path.join(config.logsDir, 'com.dunkydooball.server.output.log')
  
  // generate the plist
  var plistData = plist.build(dunkyPlistObj).toString()
  // write it to file
  fs.writeFileSync(appCTLPath, plistData, 'utf8')
  console.log('info: '.cyan, 'Successfully created DunkyDooball Server configuration file')
  plistData = null
  
  var socketPlistObj = {};
  socketPlistObj['Label'] = socketServerName
  socketPlistObj['ProgramArguments'] = [
      config.nodePath
    , path.join(__dirname, 'utils', 'socketserver.js')
  ]
  
  socketPlistObj['RunAtLoad'] = true
  socketPlistObj['KeepAlive'] = true
  socketPlistObj['EnvironmentVariables'] = {
    NODE_ENV: env,
    PATH: "/usr/local/bin:/usr/local/sbin:/usr/bin:/bin:/sbin:/usr/sbin"
  };
  // IMPORTANT...required for privilege separation
  socketPlistObj['UserName'] = config.nodeUser
  socketPlistObj['StandardErrorPath'] = path.join(config.logsDir, 'com.dunkydooball.socketserver.error.log')
  socketPlistObj['StandardOutPath'] = path.join(config.logsDir, 'com.dunkydooball.socketserver.output.log')
  
  // generate the plist
  plistData = plist.build(socketPlistObj).toString()
  // write it to file
  fs.writeFileSync(socketCTLPath, plistData, 'utf8')
  console.log('info: '.cyan, 'Successfully created DunkyDooball Socket Server configuration file')
  ctl.loadSync(socketCTLPath)
  ctl.loadSync(appCTLPath)
}