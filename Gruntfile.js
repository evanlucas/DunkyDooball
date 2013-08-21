var logger = require('loggerjs')('Grunt')
  , util = require('util')
  , appName = 'com.dunkydooball.server'
  , socketServerName = 'com.dunkydooball.socketserver'
  , appCtl = '/System/Library/LaunchDaemons/com.dunkydooball.server.plist'
  , socketCtl = '/System/Library/LaunchDaemons/com.dunkydooball.socketserver.plist'
  , ctl = require('launchctl')
  , fs = require('fs')



function verifyEnv(env) {
  return ~['development', 'test', 'production'].indexOf(env.toLowerCase())
}

module.exports = function(grunt) {

  function requiresRoot() {
    grunt.log.write('Checking for root........ ')
    if (process.getuid() !== 0) {
      grunt.log.error('Error performing install', 'This option requires root')
      process.exit(1)
    }
    grunt.log.ok()
  }
  
  function isInstalled() {
    if (!fs.existsSync(appCtl)) return false
    if (!fs.existsSync(socketCtl)) return false
    return true
  }
  
  function checkInstall() {
    grunt.log.write('Checking for install..... ')
    if (isInstalled()) return
    grunt.log.error('You must first install Dunky Dooball')
    process.exit(1)
    grunt.log.ok()
  }
  
  function start(label) {
    try {
      var res = ctl.startSync(label)
      if (res !== 0) {
        var e = ctl.errorFromErrno(res)
        grunt.log.error('Error starting: ', label, e)
        throw e
      }
    }
    catch(e) {
      grunt.log.error('Error starting: ', label, e)
      throw e
    }
  }
  
  function stop(label) {
    try {
      var res = ctl.stopSync(label)
      if (res !== 0) {
        var e = ctl.errorFromErrno(res)
        grunt.log.error('Error stopping: ', label, e)
        throw e
      }
    }
    catch(e) {
      grunt.log.error('Error stopping: ', label, e)
      throw e
    }
  }
  
  function unload(p) {
    try {
      var res = ctl.unloadSync(p)
      if (res !== 0) {
        var e = ctl.errorFromErrno(res)
        grunt.log.error('Error unloading: ', p, e)
        throw e
      }
      fs.unlinkSync(p)
    }
    catch(e) {
      grunt.log.error('Error unloading: ', p, e)
      throw e
    }
  }
  
  function load(p) {
    try {
      var res = ctl.loadSync(p)
      if (res !== 0) {
        var e = ctl.errorFromErrno(res)
        grunt.log.error('Error loading: ', p, e)
        throw e
      }
    }
    catch(e) {
      grunt.log.error('Error loading: ', p, e)
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
    grunt.log.write('Building server plist.... ')
    var plistData = plist.build(dunkyPlistObj).toString()
    grunt.log.ok()
    // write it to file
    grunt.log.write('Writing to file.......... ')
    fs.writeFileSync(appCTLPath, plistData, 'utf8')
    grunt.log.ok()
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
    grunt.log.write('Building socket plist.... ')
    plistData = plist.build(socketPlistObj).toString()
    grunt.log.ok()
    // write it to file
    grunt.log.write('Writing to file.......... ')
    fs.writeFileSync(socketCTLPath, plistData, 'utf8')
    grunt.log.ok()
    grunt.log.write('Loading socket server.... ')
    load(socketCtl)
    grunt.log.ok()
    grunt.log.write('Loading HTTP server...... ')
    load(appCtl)
    grunt.log.ok()
  }
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    
    cafemocha: {
      unitTests: {
        src: 'tests/test.js',
        options: {
          ui: 'bdd',
          reporter: 'nyan',
          colors: true
        }
      }
    }
  })
  
  grunt.loadNpmTasks('grunt-cafe-mocha')
  
  grunt.registerTask('test', ['cafemocha'])
  grunt.registerTask('default', 'test')
  
  grunt.registerTask('status', 'Check the status of the HTTP and socket servers', function() {
    var done = this.async()
    requiresRoot()
    grunt.log.writeln('Checking status')
    var serverStatus
      , socketStatus
      , Table = require('cli-table')
    
    try {
      serverStatus = ctl.listSync(appName)
    }
    catch(e) {
      serverStatus = false
    }
    
    try {
      socketStatus = ctl.listSync(socketServerName)
    }
    catch(e) {
      socketStatus = false
    }
    
    var table = new Table({
      head: ['Label', 'Status']
    })
    
    if (!serverStatus) {
      table.push(['com.dunkydooball.server', 'Not Running'.red])
    } else {
      table.push(['com.dunkydooball.server', (serverStatus.PID) ? 'Running'.magenta : 'Not Running'.red])
    }
    
    if (!socketStatus) {
      table.push(['com.dunkydooball.socketserver', 'Not Running'.red])
    } else {
      table.push(['com.dunkydooball.socketserver', (socketStatus.PID) ? 'Running'.magenta : 'Not Running'.red])
    }
    
    console.log(table.toString())
    done()
  })
  
  grunt.registerTask('start', 'Starts the server', function() {
    requiresRoot()
    checkInstall()
    grunt.log.write('Starting server.......... ')
    load(appCtl)
    load(socketCtl)
    grunt.log.ok()
  })
  
  grunt.registerTask('stop', 'Stops the server and unloads the launchd plists', function() {
    requiresRoot()
    checkInstall()
    grunt.log.write('Stopping server.......... ')
    unload(appCtl)
    unload(socketCtl)
    grunt.log.ok()
  })
  
  grunt.registerTask('restart', 'Restarts the servers', function() {
    requiresRoot()
    checkInstall()
    grunt.log.write('Restarting server........ ')
    stop(socketServerName)
    grunt.log.ok()
  })
  
  grunt.registerTask('install-dev', 'Installs the servers in a dev environment', function() {
    requiresRoot()
    grunt.log.writeln('Installing in dev env.... ')
    writeConfig('development')
    grunt.log.writeln('Successfully installed... ')
  })
  
  grunt.registerTask('install-test', 'Installs the server in a test environment', function() {
    requiresRoot()
    grunt.log.writeln('Installing in test env... ')
    writeConfig('test')
    grunt.log.writeln('Successfully installed... ')
  })
  
  grunt.registerTask('install-prod', 'Installs the server in a production environment', function() {
    requiresRoot()
    grunt.log.writeln('Installing in prod env... ')
    writeConfig('production')
    grunt.log.writeln('Successfully installed... ')
  })
}