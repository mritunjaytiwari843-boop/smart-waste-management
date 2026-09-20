const bus = require('./bus');

const feed = [];

function say(text) {
  const item = { t: Date.now(), text };
  feed.unshift(item);
  if (feed.length > 8) feed.pop();
  bus.emit('activity', item);
  return item;
}

function getFeed() {
  return feed.slice();
}

module.exports = { say, getFeed };
