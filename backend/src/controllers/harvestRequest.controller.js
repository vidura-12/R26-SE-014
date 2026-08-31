const HarvestRequest = require('../models/HarvestRequest');
const Farmer = require('../models/Farmer');
const Schedule = require('../models/Schedule');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { USER_ROLES } = require('../constants/enums');
const { notifyHarvestCreated, notifyHarvestStatusChange, notifyAllAdmins } = require('../services/notification.service');
const { triggerAutoOptimize } = require('../services/autoOptimize.service');

/**
 * Enrich harvest request objects with the peeler group they were assigned to by
 * the optimizer (from the most recent Schedule that routes to them). Mutates and
 * returns the given plain objects; each gets an `assignedPeeler` field (or null).
 */
async function attachAssignedPeeler(requests) {
  const list = Array.isArray(requests) ? requests : [requests];
  const ids = list.map((r) => r._id).filter(Boolean);
  if (!ids.length) return requests;

  const schedules = await Schedule.find({ 'assignments.route.harvestRequest': { $in: ids } })
    .populate('assignments.peelerGroup', 'groupName leaderName')
    .sort({ createdAt: -1 })
    .lean();

  const byRequest = new Map();
  for (const schedule of schedules) {
    for (const assignment of schedule.assignments || []) {
      for (const stop of assignment.route || []) {
        const key = String(stop.harvestRequest);
        if (byRequest.has(key)) continue; // schedules are newest-first, keep the latest
        byRequest.set(key, {
          groupName: assignment.peelerGroup?.groupName || null,
          leaderName: assignment.peelerGroup?.leaderName || null,
          estimatedArrival: stop.estimatedArrival || null,
          scheduleId: schedule._id
        });
      }
    }
  }

  for (const req of list) req.assignedPeeler = byRequest.get(String(req._id)) || null;
  return requests;
}

exports.createHarvestRequest = asyncHandler(async (req, res) => {
  let farmerId = req.body.farmer;

  if (req.user.role === USER_ROLES.FARMER) {
    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) throw new ApiError(400, 'Create farmer profile before submitting harvest requests');
    farmerId = farmer._id;
  }

  if (!farmerId) throw new ApiError(400, 'Farmer is required');
  if (new Date(req.body.harvestReadyDate) > new Date(req.body.deadlineDate)) {
    throw new ApiError(400, 'deadlineDate must be after harvestReadyDate');
  }

  const data = await HarvestRequest.create({ ...req.body, farmer: farmerId });

  // Notify all admins about new harvest request
  notifyHarvestCreated(data).catch(() => {});

  // Auto re-optimize over this request's harvest-ready / deadline window
  triggerAutoOptimize({
    weekStartDate: data.harvestReadyDate,
    weekEndDate: data.deadlineDate,
    reason: 'harvest-created',
    createdBy: req.user._id
  });

  res.status(201).json({ success: true, data });
});

exports.getHarvestRequests = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.farmer) filter.farmer = req.query.farmer;
  if (req.query.processingCategory) filter.processingCategory = req.query.processingCategory;
  if (req.query.search) filter.plantationName = { $regex: req.query.search, $options: 'i' };

  if (req.user.role === USER_ROLES.FARMER) {
    const farmer = await Farmer.findOne({ user: req.user._id });
    if (farmer) filter.farmer = farmer._id;
  }

  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit))) : 0
  const total = await HarvestRequest.countDocuments(filter)
  const query = HarvestRequest.find(filter).populate('farmer').sort({ createdAt: -1 }).lean()
  if (limit) query.skip((page - 1) * limit).limit(limit)
  const data = await query
  await attachAssignedPeeler(data)
  res.json({ success: true, count: data.length, total, page, data });
});

exports.getHarvestRequestById = asyncHandler(async (req, res) => {
  const data = await HarvestRequest.findById(req.params.id).populate('farmer').lean();
  if (!data) throw new ApiError(404, 'Harvest request not found');
  await attachAssignedPeeler(data);
  res.json({ success: true, data });
});

exports.updateHarvestRequest = asyncHandler(async (req, res) => {
  if (req.body.harvestReadyDate && req.body.deadlineDate && new Date(req.body.harvestReadyDate) > new Date(req.body.deadlineDate)) {
    throw new ApiError(400, 'deadlineDate must be after harvestReadyDate');
  }

  const data = await HarvestRequest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!data) throw new ApiError(404, 'Harvest request not found');

  // Auto re-optimize over the (possibly updated) harvest-ready / deadline window
  triggerAutoOptimize({
    weekStartDate: data.harvestReadyDate,
    weekEndDate: data.deadlineDate,
    reason: 'harvest-updated',
    createdBy: req.user._id
  });

  res.json({ success: true, data });
});

exports.updateHarvestRequestStatus = asyncHandler(async (req, res) => {
  const oldDoc = await HarvestRequest.findById(req.params.id).populate('farmer');
  if (!oldDoc) throw new ApiError(404, 'Harvest request not found');

  const oldStatus = oldDoc.status;
  const newStatus = req.body.status;

  const data = await HarvestRequest.findByIdAndUpdate(
    req.params.id, { status: newStatus }, { new: true, runValidators: true }
  ).populate('farmer');

  // Notify the farmer user about status change
  if (oldStatus !== newStatus && oldDoc.farmer?.user) {
    notifyHarvestStatusChange({
      harvest: data,
      oldStatus,
      newStatus,
      recipientUserId: oldDoc.farmer.user
    }).catch(() => {});
  }

  res.json({ success: true, data });
});

exports.deleteHarvestRequest = asyncHandler(async (req, res) => {
  const data = await HarvestRequest.findByIdAndDelete(req.params.id);
  if (!data) throw new ApiError(404, 'Harvest request not found');
  res.json({ success: true, message: 'Harvest request deleted' });
});
