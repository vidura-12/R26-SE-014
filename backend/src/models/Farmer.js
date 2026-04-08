const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  lat: { type: Number, required: true, min: -90, max: 90 },
  lng: { type: Number, required: true, min: -180, max: 180 },
  address: { type: String, trim: true },
  district: { type: String, trim: true }
}, { _id: false });

const farmerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  farmerCode: { type: String, unique: true, sparse: true },
  fullName: { type: String, required: true, trim: true },
  nic: { type: String, trim: true },
  primaryLocation: { type: locationSchema, required: true },
  notes: { type: String, trim: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Farmer', farmerSchema);
