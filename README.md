# DunkyDooball

A Mac node application server

## Goal

To provide a way to host multiple node applications on a single Mac server

## Requirements

- OS X 10.8+
- Xcode 4.5+ (including cli tools)
- [Node.js v0.10+](http://nodejs.org) *Could work on v0.8, not tested though*
- [MongoDB v2.2+](http://www.mongodb.org)

## Configuration

### domain
- The main domain

### appsPath (`/Users/node/apps`)
- The absolute path to the directory that will hold your apps

### proxySPort (`80`)
- The port on which the server should listen

### pidPath (`./pids`)
- The relative path from the project root to hold pid files

### bindIp (`0.0.0.0`)
- The IP address to bind to

### apachePort (`9898`)
- The port that Apache/Nginx will listen on
- This **must** be changed in the web server's configuration

### nodeUser (`node`)
- The user to run the apps under

### logsDir (`/Users/node/apps/logs`)
- The directory to store stdout and stderr logs

### db (`mongodb://dunky:dooball@localhost/biscuit`)
- The mongo connection string

### adminPort (`5044`)
- The port on which the API listens

### companyID (`com.curapps`)
- Company identifier (should be in reverse DNS format)

### nodePath (`/usr/local/bin/node`)
- The path to the node executable

### companyName
- Your company name

### cssUrl
- Your stylesheet URL
- Defaults to `http://curapps.com/bootstrap/assets/css/bootstrap.css`

### logoUrl
- Your logo URL
- Defaults to `http://curapps.com/bootstrap/assets/img/logo.png`

## Installation

- After installing the dependencies, run:
```
sudo ./helper.js install [environment]
```

- The environment can be `development`, `test`, or `production`
- Follow the prompts to create the admin user
- To get your API key:
```
curl <server>:5044/api/users/auth -H 'Content-type: application/json' -X POST -d '{"email": "<your email>", "name": "Your name", "password": "<your password>"}'

- Each request requires the `X-Auth-Token` header. This will be your API key

## API

### POST /api/users/create
- Params
  - name {String}
  - email {String}
  - password {String}
  - role {String} `User` or `Admin`

### POST /api/users/auth
- Params
  - email {String}
  - password {String}

### GET /api/apps/list

### GET /api/apps/list/:appName
- Params
  - appName {String}

### POST /api/apps/:appName/start
- Params
  - appName {String}

### POST /api/apps/:appName/stop
- Params
  - appName {String}

### POST /api/apps/:appName/remove
- Params
  - appName {String}

### POST /api/apps/create
- Params
  - url {String} The url to clone
  - dir {String} The **name** of the directory to clone to
    - This is just the name, not the path
  - env {String} The environment `development`, `test`, or `production`

### POST /api/apps/:appName/pull
- Params
  - appName {String}

### POST /api/apps/:appName/install
- Params
  - appName {String}

### PUT /api/apps/:appName
- Params
  - env {String} The environment to change to


## Thanks

- [stagecoach](https://github.com/punkave/stagecoach)


## License

MIT