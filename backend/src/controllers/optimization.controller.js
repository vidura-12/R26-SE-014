const Schedule = require('../models/Schedule');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { runOptimization, buildOptimizationPayload } = require('../services/optimizer.service');
const { notifyOptimizationComplete } = require('../services/notification.service');

exports.previewPayload = asyncHandler(async (req, res) => {
  const weekStartDate = new Date(req.body.weekStartDate);
  const weekEndDate = new Date(req.body.weekEndDate);
  const payload = await buildOptimizationPayload({ weekStartDate, weekEndDate });
  res.json({ success: true, data: payload });
});

exports.runOptimization = asyncHandler(async (req, res) => {
  const weekStartDate = new Date(req.body.weekStartDate);
  const weekEndDate = new Date(req.body.weekEndDate);
  if (weekStartDate > weekEndDate) throw new ApiError(400, 'weekStartDate must be before weekEndDate');
  const schedule = await runOptimization({ weekStartDate, weekEndDate, createdBy: req.user?._id });

  try {
    await notifyOptimizationComplete({ schedule });
  } catch (_) {}

  res.status(201).json({ success: true, data: schedule });
});

exports.getSchedules = asyncHandler(async (req, res) => {
  const data = await Schedule.find()
    .populate('assignments.peelerGroup')
    .populate('assignments.route.harvestRequest')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: data.length, data });
});

exports.getScheduleById = asyncHandler(async (req, res) => {
  const data = await Schedule.findById(req.params.id)
    .populate('assignments.peelerGroup')
    .populate('assignments.route.harvestRequest');
  if (!data) throw new ApiError(404, 'Schedule not found');
  res.json({ success: true, data });
});

