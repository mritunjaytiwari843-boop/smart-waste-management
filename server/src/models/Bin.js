const { Schema, model } = require('mongoose');

const binSchema = new Schema({
  code: { type: String, required: true, unique: true },
  area: { type: String, required: true },
  type: { type: String, required: true },
  fill: { type: Number, min: 0, max: 100, default: 0 },
  at: { type: Number, min: 0, max: 1, required: true },
  label: { type: String, enum: ['up', 'down', 'left', 'right'], default: 'up' }
});

module.exports = model('Bin', binSchema);
