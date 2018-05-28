const mongoose = require('mongoose');
const glob = require('glob');

module.exports = function({url, options, models, debug}) {

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
      console.log(`[koa2-mongoose] close connection to ${url}.`);
    });
  };

  process
    //.on('exit', cleanup)
    .on('SIGINT', cleanup)
    .on('SIGTERM', cleanup);

  mongoose.connection.on('error', () => {
    connected = false;
    console.log(`[koa2-mongoose] error connecting to ${url}.`);
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
    console.log(`[koa2-mongoose] connection to ${url} disconnected.`);
  });
  mongoose.connection.on('connected', function () {
    connected = true;
    reconnectTries = 0;
    console.log(`[koa2-mongoose] connection to ${url} connected.`);
  });

  const connect = function() {
    console.log(`[koa2-mongoose] connecting ${url}.`);
    return mongoose.connect(url, options).catch((err) => {});
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
