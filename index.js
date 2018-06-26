const mongoose = require('mongoose');
const glob = require('glob');
const chalk = require('chalk');
const Semaphore = require('semaphore-async-await').default;

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

module.exports = function({url, options, models, debug}) {

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

  const savedRequests = [];
  const lock = new Semaphore(1);
  lock.wait();

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
    lock.signal();
    connected = true;
    reconnectTries = 0;
    log(`Connected.`);
  });

  connect(url, options);

  // Middleware setup
  return async function(ctx, next) {
    ctx.mongoose = mongoose;
    ctx.models = ctx.mongoose.models;
    if (!connected) {
      await lock.wait();
    }
    await next();
  };
};
