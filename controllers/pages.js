var logger = require('loggerjs')('Pages')
  , system = require('./system')
  , Pages = exports

Pages.renderIndex = function(req, res) {
  system.getGeneralData(function(err, data) {
    if (err) {
      logger.error('Error getting general data:', err)
      return res.render('errors/500')
    }
    res.render('index', {
      data: data,
      profile: req.user
    })
  })
}

Pages.renderNetwork = function(req, res) {
  logger.info('Network: ', system.getNetworkData())
  res.render('network', {
      data: system.getNetworkData()
    , profile: req.user
  })
}

Pages.renderApps = function(req, res) {
  res.render('apps', {
    profile: req.user
  })
}

Pages.renderUsers = function(req, res) {
  res.render('users', {
    profile: req.user
  })
}