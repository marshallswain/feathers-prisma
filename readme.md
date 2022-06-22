# feathers-prisma

[![CI](https://github.com/feathersjs-ecosystem/feathers-prisma/workflows/CI/badge.svg)](https://github.com/feathersjs-ecosystem/feathers-prisma/actions?query=workflow%3ACI)
[![Dependency Status](https://img.shields.io/david/feathersjs-ecosystem/feathers-prisma.svg?style=flat-square)](https://david-dm.org/feathersjs-ecosystem/feathers-prisma)
[![Download Status](https://img.shields.io/npm/dm/feathers-prisma.svg?style=flat-square)](https://www.npmjs.com/package/feathers-prisma)

A [Feathers](https://feathersjs.com) database adapter for [Prisma](https://www.prisma.org/) using the Prisma Client.

```bash
$ npm install --save prisma feathers-prisma
```

> __Important:__ `feathers-prisma` implements the [Feathers Common database adapter API](https://docs.feathersjs.com/api/databases/common.html) and [querying syntax](https://docs.feathersjs.com/api/databases/querying.html).

## API

### `service(options)`

Returns a new service instance initialized with the given options. `Model` has to be a Prisma collection.

```js
const MongoClient = require('prisma').MongoClient;
const service = require('feathers-prisma');

MongoClient.connect('prisma://localhost:27017/feathers').then(client => {
  app.use('/messages', service({
    Model: client.db('feathers').collection('messages')
  }));
  app.use('/messages', service({ Model, id, events, paginate }));
});
```

__Options:__

- `Model` (**required**) - The Prisma Client instance
<!-- - `id` (*optional*, default: `'_id'`) - The name of the id field property. By design, Prisma will always add an `_id` property.
- `disableObjectify` (*optional*, default `false`) - This will disable the objectify of the id field if you want to use normal strings
- `events` (*optional*) - A list of [custom service events](https://docs.feathersjs.com/api/events.html#custom-events) sent by this service
- `paginate` (*optional*) - A [pagination object](https://docs.feathersjs.com/api/databases/common.html#pagination) containing a `default` and `max` page size
- `whitelist` (*optional*) - A list of additional query parameters to allow (e..g `[ '$regex', '$geoNear' ]`)
- `multi` (*optional*) - Allow `create` with arrays and `update` and `remove` with `id` `null` to change multiple items. Can be `true` for all methods or an array of allowed methods (e.g. `[ 'remove', 'create' ]`)
- `useEstimatedDocumentCount` (*optional*, default `false`) - If `true` document counting will rely on `estimatedDocumentCount` instead of `countDocuments` -->

### params.prisma

When making a [service method](https://docs.feathersjs.com/api/services.html) call, `params` can contain an `prisma` property (for example, `{upsert: true}`) which allows to modify the options used to run the Prisma query.

#### Transactions


## Example

Here is an example of a Feathers server with a `messages` endpoint that writes to the `feathers` database and the `messages` collection.

```cli
npm install @feathersjs/feathers @feathersjs/errors @feathersjs/express @feathersjs/socketio feathers-prisma prisma
```

In `app.js`:

```js
const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');

const MongoClient = require('prisma').MongoClient;
const service = require('feathers-prisma');

// Create an Express compatible Feathers application instance.
const app = express(feathers());
// Turn on JSON parser for REST services
app.use(express.json());
// Turn on URL-encoded parser for REST services
app.use(express.urlencoded({extended: true}));
// Enable REST services
app.configure(express.rest());
// Enable Socket.io
app.configure(socketio());

// Connect to the db, create and register a Feathers service.
app.use('/messages', service({
  paginate: {
    default: 2,
    max: 4
  }
}));

// A basic error handler, just like Express
app.use(express.errorHandler());

// Connect to your Prisma instance(s)
MongoClient.connect('prisma://localhost:27017/feathers')
  .then(function(client){
    // Set the model now that we are connected
    app.service('messages').Model = client.db('feathers').collection('messages');

    // Now that we are connected, create a dummy Message
    app.service('messages').create({
      text: 'Message created on server'
    }).then(message => console.log('Created message', message));
  }).catch(error => console.error(error));

// Start the server.
const port = 3030;

app.listen(port, () => {
  console.log(`Feathers server listening on port ${port}`);
});
```

Run the example with `node app` and go to [localhost:3030/messages](http://localhost:3030/messages).

## Querying

### Example: Find records with a case-insensitive search

## License

Copyright (c) 2019

Licensed under the [MIT license](LICENSE).