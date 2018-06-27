# koa-mon

koa-mon is a koa middleware for working with mongoose. Features including

1. Handles model loading
2. Handles mongoose connection including auto reconnects
3. Passing mongoose and models to koa context

## Installation

``` bash
npm install koa-mon --save
```

## Usage

``` js
const mongoose = require('koa-mon');

app.use(mongoose({
  models: __dirname + '/models', // Where you models are defined
  debug: config.database.debug, // Mongoose debug option
  url: config.database.url, // Mongoose connect url
  options: {}, // Mongoose connect options
  lazyConnect: true // This will defer connecting to first request
}));

app.use((ctx, next) => {
  // Now get models from ctx
  const mongoose = ctx.mongoose;
  const { User } = ctx.models;
});
```
