# koa-mon
[![NPM version][npm-image]][npm-url] [![Dependency Status][daviddm-image]][daviddm-url]

koa-mon is a koa middleware for working with mongoose. Features including

1. Handles model loading
2. Handles mongoose connection including auto reconnects
3. Passing mongoose and models to koa context
4. Handles multiple mongoose connections

## Installation

``` bash
npm install koa-mon --save
```

## Usage

``` js
const mongoose = require('koa-mon');

// Simplest Usage
app.use(mongoose({
  modelDir: __dirname + '/models', // Where you models are defined
  url: config.database.url // Mongoose connect url
}));

// Advanced Usage
app.use(mongoose({
  modelDir: __dirname + '/models', // Where you models are defined
  url: config.database.url, // Mongoose connect url
  options: {}, // Mongoose connect options
  lazyConnect: true, // This will defer connecting to first request
  connectionName: 'connection1', // This is for multiple connections
  debug: config.database.debug // Mongoose debug option
}));

app.use((ctx, next) => {
  // Now get models from ctx
  const mongoose = ctx.mongoose;
  const { User } = ctx.models;
  const connections = ctx.connections;
});
```


[npm-image]: https://badge.fury.io/js/koa-mon.svg
[npm-url]: https://npmjs.org/package/koa-mon
[daviddm-image]: https://david-dm.org/zhangkaiyulw/koa-mon.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/zhangkaiyulw/koa-mon
