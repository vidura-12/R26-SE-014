const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  lat: { type: Number, required: true, min: -90, max: 90 },
  lng: { type: Number, required: true, min: -180, max: 180 },
  address: { type: String, trim: true },
  district: { type: String, trim: true }
}, { _id: false });

const availabilitySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  available: { type: Boolean, default: true },
  startTime: { type: String, default: '08:00' },
  endTime: { type: String, default: '17:00' }
}, { _id: false });

const peelerGroupSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  groupCode: { type: String, unique: true, sparse: true },
  groupName: { type: String, required: true, trim: true },
  leaderName: { type: String, required: true, trim: true },
  currentLocation: { type: locationSchema, required: true },
  groupSize: { type: Number, required: true, min: 1 },
  peelingCapacityTreesPerHour: { type: Number, required: true, min: 1 },
  maxHoursPerDay: { type: Number, default: 8, min: 1, max: 16 },
  skillLevel: { type: Number, min: 1, max: 5, default: 3 },
  rating: { type: Number, min: 1, max: 5, default: 4 },
  availability: [availabilitySchema],
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('PeelerGroup', peelerGroupSchema);
