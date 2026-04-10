const mongoose = require('mongoose');

const routeStopSchema = new mongoose.Schema({
  harvestRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'HarvestRequest', required: true },
  order: { type: Number, required: true },
  estimatedArrival: Date,
  estimatedHours: Number,
  distanceFromPreviousKm: Number
}, { _id: false });

const assignmentSchema = new mongoose.Schema({
  peelerGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'PeelerGroup', required: true },
  route: [routeStopSchema],
  totalDistanceKm: { type: Number, default: 0 },
  totalWorkHours: { type: Number, default: 0 },
  utilizationScore: { type: Number, default: 0 }
}, { _id: false });

const scheduleSchema = new mongoose.Schema({
  weekStartDate: { type: Date, required: true },
  weekEndDate: { type: Date, required: true },
  assignments: [assignmentSchema],
  optimizerSummary: {
    fitnessScore: Number,
    totalDistanceKm: Number,
    totalAssignedFarms: Number,
    unassignedFarmIds: [String],
    generatedAt: Date
  },
  rawOptimizerResponse: mongoose.Schema.Types.Mixed,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
