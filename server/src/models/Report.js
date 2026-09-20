const { Schema, model } = require('mongoose');
const { TYPES, STATUS } = require('../constants');

const eventSchema = new Schema(
  {
    status: { type: String, enum: STATUS, required: true },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const reportSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: TYPES, required: true },
    area: { type: String, required: true, index: true },
    note: { type: String, required: true, trim: true, minlength: 10, maxlength: 500 },
    status: { type: String, enum: STATUS, default: 'reported', index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    reporterName: { type: String, trim: true, maxlength: 60 },
    events: [eventSchema]
  },
  { timestamps: true }
);

reportSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = model('Report', reportSchema);
