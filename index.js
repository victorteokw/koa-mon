const mongoose = require('mongoose');
const glob = require('glob');
const chalk = require('chalk');

const timestamp = function() {
  const stamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
  return `[${stamp}]`;
}

const log = function(s) {
  console.log(`${chalk.blue(timestamp())}${chalk.magenta.bold('[DB]')} ${s}`);
}

module.exports = function({url, options, models, debug}) {

  console.log(`Using ${url}.`);

  const defaultOptions = {
    autoReconnect: true,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 2000
  };

  // configure mongoose
  mongoose.set('debug', debug);

  let connected = false,
      connectionPromise = false,
      closed = false,
      reconnectTries = 0;

  // Gracefully handle close
  const cleanup = function() {
    if (closed) return;
    mongoose.connection.close(function () {
      closed = true;
      log(`close connection to ${url}`);
    });
  };

  // process
  //   .on('exit', cleanup)
  //   .on('SIGINT', cleanup)
  //   .on('SIGTERM', cleanup);

  mongoose.connection.on('error', () => {
    connected = false;
    log(`Error Occurred.`);
    if (options.autoReconnect !== false) {
      if (reconnectTries < (options.reconnectTries || defaultOptions.reconnectTries)) {
        setTimeout(() => {
          connectionPromise = connect();
          reconnectTries += 1;
        }, options.reconnectInterval || defaultOptions.reconnectInterval);
      }
    }
  });
  mongoose.connection.on('disconnected', function () {
    connected = false;
    log(`Disconnected.`);
  });
  mongoose.connection.on('connected', function () {
    connected = true;
    reconnectTries = 0;
    log(`Connected.`);
  });

  const connect = function() {
    log(`Connecting...`);
    const p = mongoose.connect(url, options);
    p.catch((err) => {});
    return p;
  };

  connectionPromise = connect();

  // Load models
  const modelPaths = glob.sync(models + '/**/*.js');
  modelPaths.map(require);

  // Middleware setup
  return async function(ctx, next) {
    !connected && await connectionPromise;
    ctx.mongoose = mongoose;
    ctx.models = ctx.mongoose.models;
    await next();
  };
};
