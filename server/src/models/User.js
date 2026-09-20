const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['citizen', 'admin'], default: 'citizen' }
  },
  { timestamps: true }
);

module.exports = model('User', userSchema);
