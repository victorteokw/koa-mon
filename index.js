const mongoose = require('mongoose');
const glob = require('glob');
const chalk = require('chalk');

const locks = [];

const lock = () => {
  return new Promise(function(res, rej) {
    locks.push(res);
  });
};

const unlock = () => {
  while (locks.length) {
    const res = locks.pop();
    res();
  }
};

const timestamp = function() {
  const time = new Date();
  const dateStr = time.toLocaleDateString('en', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const timeStr = time.toLocaleTimeString('en', {
    hour12: false,
    timeZoneName: 'short'
  });
  return `[${dateStr} ${timeStr}]`;
};

const log = function(s) {
  console.log(`${chalk.blue(timestamp())}${chalk.magenta.bold('[DB]')} ${s}`);
};

const connect = function(url, options) {
  log(`Connecting...`);
  mongoose.connect(url, options).catch((err) => {});
};

module.exports = function({url, options, models, debug, lazyConnect}) {

  log(`Using ${url}.`);

  // configure mongoose
  mongoose.set('debug', debug);

  // Load models
  const modelPaths = glob.sync(models + '/**/*.js');
  modelPaths.map(require);

  // Connection Handlers
  const defaultOptions = {
    autoReconnect: true,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 2000
  };

  let connected = false, reconnectTries = 0;

  mongoose.connection.on('error', () => {
    connected = false;
    log(`Error Occurred.`);
    if (options.autoReconnect !== false) {
      if (reconnectTries < (options.reconnectTries || defaultOptions.reconnectTries)) {
        setTimeout(() => {
          connect(url, options);
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
    unlock();
  });

  if (!lazyConnect) {
    connect(url, options);
  }

  // Middleware setup
  return async function(ctx, next) {
    ctx.mongoose = mongoose;
    ctx.models = ctx.mongoose.models;
    if (!connected) {
      await lock();
      if (lazyConnect) {
        connect(url, options);
        lazyConnect = false;
      }
    }
    await next();
  };
};
