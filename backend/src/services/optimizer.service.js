const axios = require('axios');
const HarvestRequest = require('../models/HarvestRequest');
const PeelerGroup = require('../models/PeelerGroup');
const Schedule = require('../models/Schedule');
const { HARVEST_STATUSES } = require('../constants/enums');
const ApiError = require('../utils/apiError');

const toDateOnly = (date) => new Date(date).toISOString().slice(0, 10);

const mapRequestToOptimizerFarm = (request) => ({
  id: request._id.toString(),
  farmerName: request.farmer?.fullName || 'Unknown Farmer',
  farmName: request.plantationName,
  location: { lat: request.location.lat, lng: request.location.lng },
  treeCount: request.treeCount,
  harvestReady: true,
  urgency: request.urgencyLevel,
  processingCategory: request.processingCategory,
  readyFrom: toDateOnly(request.harvestReadyDate),
  peelabilityDeadline: toDateOnly(request.deadlineDate),
  estimatedYieldKg: request.estimatedYieldKg || undefined
});

const getAvailableDays = (peeler, weekStartDate, weekEndDate) => {
  const available = (peeler.availability || [])
    .filter((slot) => slot.available !== false)
    .map((slot) => new Date(slot.date))
    .filter((d) => d >= weekStartDate && d <= weekEndDate)
    .map(toDateOnly);

  if (available.length) return [...new Set(available)].sort();

  const days = [];
  const cursor = new Date(weekStartDate);
  while (cursor <= weekEndDate) {
    days.push(toDateOnly(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};

const mapPeelerToOptimizer = (peeler, weekStartDate, weekEndDate) => ({
  id: peeler._id.toString(),
  groupName: peeler.groupName,
  location: { lat: peeler.currentLocation.lat, lng: peeler.currentLocation.lng },
  groupSize: peeler.groupSize,
  capacityTreesPerHour: peeler.peelingCapacityTreesPerHour,
  availableDays: getAvailableDays(peeler, weekStartDate, weekEndDate),
  maxHoursPerDay: peeler.maxHoursPerDay || 8,
  rating: peeler.rating || 4
});

const buildOptimizationPayload = async ({ weekStartDate, weekEndDate }) => {
  const requests = await HarvestRequest.find({
    status: HARVEST_STATUSES.PENDING,
    harvestReadyDate: { $lte: weekEndDate },
    deadlineDate: { $gte: weekStartDate }
  }).populate('farmer');

  const peelers = await PeelerGroup.find({ active: true });

  if (!requests.length) throw new ApiError(400, 'No pending harvest requests found for this week');
  if (!peelers.length) throw new ApiError(400, 'No active peeler groups found');

  return {
    weekStart: toDateOnly(weekStartDate),
    farms: requests.map(mapRequestToOptimizerFarm),
    peelerGroups: peelers.map((peeler) => mapPeelerToOptimizer(peeler, weekStartDate, weekEndDate)),
    settings: {
      populationSize: Number(process.env.GA_POPULATION_SIZE || 100),
      generations: Number(process.env.GA_GENERATIONS || 220),
      crossoverRate: Number(process.env.GA_CROSSOVER_RATE || 0.85),
      mutationRate: Number(process.env.GA_MUTATION_RATE || 0.08),
      elitismCount: Number(process.env.GA_ELITISM_COUNT || 5),
      tournamentSize: Number(process.env.GA_TOURNAMENT_SIZE || 4),
      randomSeed: Number(process.env.GA_RANDOM_SEED || 42)
    }
  };
};

const createScheduleFromOptimizer = async ({ weekStartDate, weekEndDate, optimizerResponse, createdBy }) => {
  const schedules = optimizerResponse.schedules || [];
  const assignments = schedules.map((schedule) => ({
    peelerGroup: schedule.peelerGroupId,
    route: (schedule.route || []).map((stop, index) => ({
      harvestRequest: stop.farmId,
      order: stop.sequence || index + 1,
      estimatedArrival: stop.scheduledDate ? new Date(stop.scheduledDate) : undefined,
      estimatedHours: stop.estimatedWorkHours || 0,
      distanceFromPreviousKm: stop.travelKmFromPrevious || 0
    })),
    totalDistanceKm: schedule.totalTravelKm || 0,
    totalWorkHours: schedule.totalWorkHours || 0,
    utilizationScore: schedule.assignedTreeCount || 0
  })).filter((item) => item.peelerGroup && item.route.length);

  const scheduleDoc = await Schedule.create({
    weekStartDate,
    weekEndDate,
    assignments,
    optimizerSummary: {
      fitnessScore: optimizerResponse.summary?.fitnessCost,
      totalDistanceKm: optimizerResponse.summary?.totalTravelKm,
      totalAssignedFarms: optimizerResponse.summary?.assignedFarmCount,
      unassignedFarmIds: optimizerResponse.unassignedFarmIds || [],
      generatedAt: new Date()
    },
    rawOptimizerResponse: optimizerResponse,
    createdBy
  });

  const assignedIds = assignments.flatMap((a) => a.route.map((r) => r.harvestRequest));
  if (assignedIds.length) {
    await HarvestRequest.updateMany({ _id: { $in: assignedIds } }, { status: HARVEST_STATUSES.SCHEDULED });
  }

  return scheduleDoc.populate([
    { path: 'assignments.peelerGroup' },
    { path: 'assignments.route.harvestRequest' }
  ]);
};

const runOptimization = async ({ weekStartDate, weekEndDate, createdBy }) => {
  const payload = await buildOptimizationPayload({ weekStartDate, weekEndDate });
  const baseUrl = process.env.ALGO_URL || 'http://localhost:8001';
  let optimizerResponse;

  try {
    const { data } = await axios.post(`${baseUrl}/optimize`, payload, { timeout: 120000 });
    optimizerResponse = data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message;
    throw new ApiError(502, `Python optimizer failed: ${message}`);
  }

  return createScheduleFromOptimizer({ weekStartDate, weekEndDate, optimizerResponse, createdBy });
};

module.exports = { runOptimization, buildOptimizationPayload };
