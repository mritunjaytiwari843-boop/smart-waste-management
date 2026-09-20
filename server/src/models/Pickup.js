const { Schema, model } = require('mongoose');

// One document for every time the truck empties a bin.
const pickupSchema = new Schema({
  binCode: { type: String, required: true },
  area: { type: String, required: true },
  fillAtPickup: { type: Number, min: 0, max: 100 },
  at: { type: Date, default: Date.now, index: true }
});

module.exports = model('Pickup', pickupSchema);
