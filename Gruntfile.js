var logger = require('loggerjs')('Grunt')
  , appName = 'com.dunkydooball.server'
  , socketServerName = 'com.dunkydooball.socketserver'
  , appCtl = '/System/Library/LaunchDaemons/com.dunkydooball.server.plist'
  , socketCtl = '/System/Library/LaunchDaemons/com.dunkydooball.socketserver.plist'
  , utils = require('./scripts/utils')

module.exports = function(grunt) {
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
    },
    
    prompt: {
      seed: {
        options: {
          questions: [
            {
              config: 'name',
              type: 'input',
              message: 'Enter user\'s name',
              validate: function(u) {
                return u.length && u.length > 0 || 'Name cannot be blank'
              }
            },
            {
              config: 'email',
              type: 'input',
              message: 'Enter user\'s email',
              validate: function(e) {
                return (e.indexOf('@') !== -1) || 'Invalid email address'
              }
            },
            {
              config: 'pass',
              type: 'password',
              message: 'Enter user\'s password',
              validate: function(p) {
                return p.length && p.length > 0 || 'Password cannot be blank'
              }
            }
          ]
        }
      },
      install: {
        options: {
          questions: [
            {
              config: 'environment',
              type: 'list',
              message: 'Select your environment',
              choices: [
                {
                  value: 'development',
                  name: 'development'
                },
                {
                  value: 'test',
                  name: 'test'
                },
                {
                  value: 'production',
                  name: 'production'
                }
              ]
            }
          ]
        }
      }
    }
  })
  
  function checkRoot() {
    grunt.log.write('Checking that we are root...')
    if (!utils.isRoot()) {
      grunt.fail.fatal('Must be run as root')
    }
    grunt.log.ok()
  }
  
  function checkInstalled() {
    grunt.log.write('Checking that DunkyDooball has been installed... ')
    if (!utils.isInstalled()) {
      grunt.fail.fatal('DunkyDooball must first be installed')
    }
    grunt.log.ok()
  }
  
  grunt.loadNpmTasks('grunt-cafe-mocha')
  grunt.loadNpmTasks('grunt-prompt')
  
  grunt.registerTask('test', ['cafemocha'])
  grunt.registerTask('default', 'test')
  
  grunt.registerTask('status', 'Check the status of the HTTP and socket servers', function() {
    checkRoot()
    checkInstalled()
    utils.status()
  })
  
  grunt.registerTask('start', 'Starts the server', function() {
    checkRoot()
    checkInstalled()
    grunt.log.write('Starting server......... ')
    var res = utils.load(appCtl)
    if (res instanceof Error) {
      grunt.fail.fatal(res)
    }
    
    res = utils.load(socketCtl)
    if (res instanceof Error) {
      grunt.fail.fatal(res)
    }
    
    grunt.log.ok()
  })
  
  grunt.registerTask('stop', 'Stops the server', function() {
    checkRoot()
    checkInstalled()
    grunt.log.write('Stopping server.......... ')
    var res = utils.unload(appCtl)
    if (res instanceof Error) {
      grunt.fail.fatal(res)
    }
    res = utils.unload(socketCtl)
    if (res instanceof Error) {
      grunt.fail.fatal(res)
    }
    grunt.log.ok()
  })
  
  grunt.registerTask('restart', 'Restarts the servers', function() {
    checkRoot()
    checkInstalled()
    grunt.log.write('Restarting server........ ')
    var res = utils.stop(socketServerName)
    if (res instanceof Error) {
      grunt.fail.fatal(res)
    }
    grunt.log.ok()
  })
  
  grunt.registerTask('installWithEnv', 'Installs the servers', function() {
    checkRoot()
    grunt.log.writeln('Installing............... ')
    var env = grunt.config('environment')
    var d = grunt.config('environment')
    utils.writeConfig(env)
    grunt.log.ok()
  })
  
  grunt.registerTask('createAdmin', 'Creates an admin user', function() {
    grunt.log.write('Creating admin........... ')
    var name = grunt.config('name')
      , email = grunt.config('email')
      , pass = grunt.config('pass')
      , done = this.async()
    
    utils.createAdmin(email, name, pass, function(err, user) {
      if (err) {
        grunt.fail.fatal(err)
      } else {
        grunt.log.ok()
        grunt.log.writeln('API Key: ', user.apiKey)
        done()
      }
    })
  })
  
  grunt.registerTask('create-admin', ['prompt:seed', 'createAdmin'])
  
  grunt.registerTask('install', ['prompt:install', 'installWithEnv'])
}