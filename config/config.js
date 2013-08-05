var path = require('path')
  , root = path.normalize(__dirname+'/..')

module.exports = {
  development: {
    domain: 'curapps.com',
    appsPath: '/Users/node/apps',
    proxySPort: 80,
    pidPath: path.join(root, 'pids'),
    bindIp: '0.0.0.0',
    apachePort: 9898,
    nodeUser: 'node',
    logsDir: '/Users/node/apps/logs',
    root: root,
    db: 'mongodb://dunky:dooball@localhost/biscuit',
    adminPort: 5044,
    companyID: 'com.curapps',
    nodePath: '/usr/local/bin/node',
    companyName: 'curapps',
    cssUrl: 'http://curapps.com/cbootstrap/assets/css/style.css',
    logoUrl: 'http://curapps.com/bootstrap/assets/img/logo.png',
    enableUI: true,
    supportEmail: 'support@curapps.com',
    mailTransport: {
      method: "Sendmail",
      config: "/usr/sbin/sendmail"
    }
/*    mailTransport: {
      method: 'SMTP',
      config: {
        auth: {
          user: "",
          pass: ""
        }
      }
    }
*/
  },
  test: {
    domain: 'curapps.com',
    appsPath: '/Users/node/apps',
    proxySPort: 80,
    pidPath: path.join(root, 'pids'),
    bindIp: '0.0.0.0',
    apachePort: 9898,
    nodeUser: 'node',
    logsDir: '/Users/node/apps/logs',
    root: root,
    db: 'mongodb://dunky:dooball@localhost/biscuit',
    adminPort: 5044,
    companyID: 'com.curapps',
    nodePath: '/usr/local/bin/node',
    companyName: 'curapps',
    cssUrl: 'http://curapps.com/cbootstrap/assets/css/style.css',
    logoUrl: 'http://curapps.com/bootstrap/assets/img/logo.png',
    enableUI: true,
    supportEmail: 'support@curapps.com',
    mailTransport: {
      method: "Sendmail",
      config: "/usr/sbin/sendmail"
    }
/*    mailTransport: {
      method: 'SMTP',
      config: {
        auth: {
          user: "",
          pass: ""
        }
      }
    }
*/
  },
  production: {
    domain: 'curapps.com',
    appsPath: '/Users/node/apps',
    proxySPort: 80,
    pidPath: path.join(root, 'pids'),
    bindIp: '0.0.0.0',
    apachePort: 9898,
    nodeUser: 'node',
    logsDir: '/Users/node/apps/logs',
    root: root,
    db: 'mongodb://dunky:dooball@localhost/biscuit',
    adminPort: 5044,
    companyID: 'com.curapps',
    nodePath: '/usr/local/bin/node',
    companyName: 'curapps',
    cssUrl: 'http://curapps.com/cbootstrap/assets/css/style.css',
    logoUrl: 'http://curapps.com/bootstrap/assets/img/logo.png',
    enableUI: true,
    supportEmail: 'support@curapps.com',
    mailTransport: {
      method: "Sendmail",
      config: "/usr/sbin/sendmail"
    }
/*    mailTransport: {
      method: 'SMTP',
      config: {
        auth: {
          user: "",
          pass: ""
        }
      }
    }
*/
  }
};