const { EventEmitter } = require('events');

// One in-process event bus. Server-Sent Events subscribers listen here.
const bus = new EventEmitter();
bus.setMaxListeners(0);

module.exports = bus;
