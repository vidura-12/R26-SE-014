const mongoose = require('mongoose');
const { PROCESSING_CATEGORIES, HARVEST_STATUSES } = require('../constants/enums');

const locationSchema = new mongoose.Schema({
  lat: { type: Number, required: true, min: -90, max: 90 },
  lng: { type: Number, required: true, min: -180, max: 180 },
  address: { type: String, trim: true },
  district: { type: String, trim: true }
}, { _id: false });

const harvestRequestSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  plantationName: { type: String, required: true, trim: true },
  location: { type: locationSchema, required: true },
  treeCount: { type: Number, required: true, min: 1 },
  harvestReadyDate: { type: Date, required: true },
  deadlineDate: { type: Date, required: true },
  urgencyLevel: { type: Number, min: 1, max: 5, default: 3 },
  processingCategory: { type: String, enum: Object.values(PROCESSING_CATEGORIES), required: true },
  estimatedYieldKg: { type: Number, min: 0 },
  status: { type: String, enum: Object.values(HARVEST_STATUSES), default: HARVEST_STATUSES.PENDING },
  notes: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('HarvestRequest', harvestRequestSchema);
