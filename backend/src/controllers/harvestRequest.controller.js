const HarvestRequest = require('../models/HarvestRequest');
const Farmer = require('../models/Farmer');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { USER_ROLES } = require('../constants/enums');
const { notifyHarvestCreated, notifyHarvestStatusChange, notifyAllAdmins } = require('../services/notification.service');

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
  const query = HarvestRequest.find(filter).populate('farmer').sort({ createdAt: -1 })
  if (limit) query.skip((page - 1) * limit).limit(limit)
  const data = await query
  res.json({ success: true, count: data.length, total, page, data });
});

exports.getHarvestRequestById = asyncHandler(async (req, res) => {
  const data = await HarvestRequest.findById(req.params.id).populate('farmer');
  if (!data) throw new ApiError(404, 'Harvest request not found');
  res.json({ success: true, data });
});

exports.updateHarvestRequest = asyncHandler(async (req, res) => {
  if (req.body.harvestReadyDate && req.body.deadlineDate && new Date(req.body.harvestReadyDate) > new Date(req.body.deadlineDate)) {
    throw new ApiError(400, 'deadlineDate must be after harvestReadyDate');
  }

  const data = await HarvestRequest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!data) throw new ApiError(404, 'Harvest request not found');
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
