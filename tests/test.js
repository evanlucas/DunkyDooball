var should = require('should')
  , assert = require('assert')

describe('DunkyDooball', function() {
  describe('Plist', function() {
    var plist = new (require('../controllers/stplist'))(true);
    describe('normalizeAppName()', function() {
      var apps = [
        {name: 'Pride', output: 'Pride'},
        {name: 'Patient Reps', output: 'PatientReps'},
        {name: 'This is a test', output: 'Thisisatest'},
        {name: 'This, is, a, test', output: 'Thisisatest'}
      ];
      
      apps.forEach(function(a) {
        it('Should normalize the app name: '+a.name, function() {
          var n = plist.normalizeAppName(a.name);
          assert.equal(n, a.output);
        });
      });
    });
    
    describe('getReverseDNS()', function() {
      var apps = [
        {name: 'Pride', output: 'com.hbc.Pride'},
        {name: 'Patient Reps', output: 'com.hbc.PatientReps'},
        {name: 'This is a test', output: 'com.hbc.Thisisatest'},
        {name: 'This, is, a, test', output: 'com.hbc.Thisisatest'}
      ];
      apps.forEach(function(a) {
        it('Should build reverse DNS: '+a.name, function() {
          var n = plist.getReverseDNS(a.name);
          assert.equal(n, a.output);
        });
      })
    });
    
    describe('getPlistName()', function() {
      var apps = [
        {name: 'Pride', output: 'com.hbc.Pride.plist'},
        {name: 'Patient Reps', output: 'com.hbc.PatientReps.plist'},
        {name: 'This is a test', output: 'com.hbc.Thisisatest.plist'},
        {name: 'This, is, a, test', output: 'com.hbc.Thisisatest.plist'}
      ];
      
      apps.forEach(function(a) {
        it('Should build the plist name: '+a.name, function() {
          var n = plist.getPlistName(a.name);
          assert.equal(n, a.output);
        });
      })
    });
    
    describe('getEnv()', function() {
      var envs = [
        {name: 'development', output: 'development'},
        {name: 'dev', output: 'development'},
        {name: 'd', output: 'development'},
        {name: 'test', output: 'test'},
        {name: 't', output: 'test'},
        {name: 'production', output: 'production'},
        {name: 'prod', output: 'production'},
        {name: 'p', output: 'production'},
        {name: 'This is something funky', output: 'development'}
      ];
      envs.forEach(function(a) {
        it('Should return a valid NODE_ENV: '+a.name, function() {
          var n = plist.getEnv(a.name);
          assert.equal(n, a.output);
        });
      })
    });
  });
})

describe('Configuration', function() {
  var helper = require('../controllers/helper')
  describe('checkConfig()', function() {
    it('Should not throw an error', function() {
      helper.checkConfig()
    })
  })
})

describe('Errors', function() {
  var errors = require('../controllers/sterror')
  var errorCodes = Object.keys(errors.errors)
  errorCodes.forEach(function(code) {
    var error = errors.errorFromCode(code)
    var errno = error.errno
    var msg = error.msg
    it('Should have a msg of: '+msg, function() {
      assert.equal(msg, errors.strerror(errno))
    })
  })
})

describe('system', function() {
  var sys = require('../controllers/system')
  describe('nodeversion', function() {
    it('Should return the correct node version', function(done) {
      sys.getGeneralData(function(err, data) {
        assert.ifError(err)
        assert.equal(data.nodeversion, process.version)
        done()
      })
    })
  })
})

describe('Database', function() {
  var mongoose = require('mongoose')
    , config = require('../config/config')['development']
    , fs = require('fs')
    , path = require('path')
  
  describe('Can connect to database', function() {
    it('Should not throw an error', function() {
      mongoose.connect(config.db)
    })
  })
  
  describe('Initialize models', function() {
    var modelsDir = path.join(config.root, 'models')
    fs.readdirSync(modelsDir).forEach(function(f) {
      if (path.extname(f) === '.js') {
        describe('Require '+f, function() {
          it('Should not throw an error', function() {
            require(path.join(modelsDir, f))
          })
        })
      }
    })
  })

  
})