const { Schema, model } = require('mongoose');

// Keeps the running number used for tracking IDs such as WM-1043.
const counterSchema = new Schema({
  _id: { type: String },
  seq: { type: Number, default: 0 }
});

module.exports = model('Counter', counterSchema);
