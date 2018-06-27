# koa-mon
[![NPM version][npm-image]][npm-url] [![Dependency Status][daviddm-image]][daviddm-url]

koa-mon is a koa middleware for working with mongoose. Features including

1. Handles model loading
2. Handles mongoose connection including auto reconnects
3. Passing mongoose and models to koa context
4. Handles multiple mongoose connections
5. Nice database connection status logging with local timestamps

## Installation

``` bash
npm install koa-mon --save
```

## Usage

### Single connection

For single connection, don't need to specify `connectionName`. By default,
mongoose's default connection is used. You can export your compiled models
directly.

``` js
const mongoose = require('koa-mon');

app.use(mongoose({
  modelDir: __dirname + '/models', // Where you models are defined
  url: 'mongodb://127.0.0.1:27017/your-db', // Mongoose connect url
  options: {}, // Mongoose connect options, omit this if it's just empty,
  debug: false // Should mongoose output debug messages, omit if false
}));
```

### Multiple connections

For multiple connections, you need to specify `connectionName` explicitly.
In your model definitions, you need to name it like `'User.js'` and export a
schema. Koa-mon handles the relationship between model and connections for you.

``` js
const mongoose = require('koa-mon');

app.use(mongoose({
  modelDir: __dirname + '/models1',
  url: 'mongodb://127.0.0.1:27017/db1',
  connectionName: 'db1'
}));

app.use(mongoose({
  modelDir: __dirname + '/models2',
  url: 'mongodb://127.0.0.1:27017/db2',
  connectionName: 'db2'
}));
```

To retrive your models:

``` js
app.use((ctx, next) => {
  const mongoose = ctx.mongoose;
  const { User1 } = ctx.db1;
  const { User2 } = ctx.db2;
  const { User1 } = ctx.connections.db1.models;
  const { User2 } = ctx.connections.db2.models;
});
```

To define your model:
``` js
// Post.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

// You need to export the schema, do not use mongoose.model('Post', postSchema)
module.exports = new Schema({
  title: String,
  content: String
});
```


[npm-image]: https://badge.fury.io/js/koa-mon.svg
[npm-url]: https://npmjs.org/package/koa-mon
[daviddm-image]: https://david-dm.org/zhangkaiyulw/koa-mon.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/zhangkaiyulw/koa-mon
