const PeelerGroup = require('../models/PeelerGroup');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { USER_ROLES } = require('../constants/enums');

exports.createPeelerGroup = asyncHandler(async (req, res) => {
  let userId = req.user._id;

  if (req.user.role === USER_ROLES.PEELER) {
    const existing = await PeelerGroup.findOne({ user: userId });
    if (existing) throw new ApiError(409, 'Peeler group already exists for this account');
  } else if (req.user.role === USER_ROLES.ADMIN) {
    if (req.body.email && req.body.password) {
      const exists = await User.findOne({ email: req.body.email });
      if (exists) throw new ApiError(409, 'A user with this email already exists');
      const newUser = await User.create({
        name: req.body.leaderName,
        email: req.body.email,
        password: req.body.password,
        phone: req.body.phone || '',
        role: USER_ROLES.PEELER,
      });
      userId = newUser._id;
    }
  }

  const { email: _e, password: _p, phone: _ph, ...rest } = req.body;
  const data = await PeelerGroup.create({ ...rest, user: userId });
  res.status(201).json({ success: true, data });
});

exports.getMyGroup = asyncHandler(async (req, res) => {
  const data = await PeelerGroup.findOne({ user: req.user._id }).populate('user', 'name email phone role');
  res.json({ success: true, data: data ?? null });
});

exports.updateMyGroup = asyncHandler(async (req, res) => {
  const allowed = ['groupName', 'leaderName', 'groupSize', 'peelingCapacityTreesPerHour', 'maxHoursPerDay', 'skillLevel', 'currentLocation', 'availability'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  const data = await PeelerGroup.findOneAndUpdate({ user: req.user._id }, updates, { new: true, runValidators: true });
  if (!data) throw new ApiError(404, 'Peeler group not found');
  res.json({ success: true, data });
});

exports.getPeelerGroups = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.active !== undefined) filter.active = req.query.active === 'true';
  if (req.query.search) {
    const re = new RegExp(req.query.search, 'i')
    filter.$or = [{ groupName: re }, { leaderName: re }, { 'currentLocation.district': re }]
  }
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit))) : 0
  const total = await PeelerGroup.countDocuments(filter)
  const query = PeelerGroup.find(filter).populate('user', 'name email phone role').sort({ createdAt: -1 })
  if (limit) query.skip((page - 1) * limit).limit(limit)
  const data = await query
  res.json({ success: true, count: data.length, total, page, data });
});

exports.getPeelerGroupById = asyncHandler(async (req, res) => {
  const data = await PeelerGroup.findById(req.params.id).populate('user', 'name email phone role');
  if (!data) throw new ApiError(404, 'Peeler group not found');
  res.json({ success: true, data });
});

exports.updatePeelerGroup = asyncHandler(async (req, res) => {
  const data = await PeelerGroup.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!data) throw new ApiError(404, 'Peeler group not found');
  res.json({ success: true, data });
});

exports.updateAvailability = asyncHandler(async (req, res) => {
  const data = await PeelerGroup.findByIdAndUpdate(req.params.id, { availability: req.body.availability }, { new: true, runValidators: true });
  if (!data) throw new ApiError(404, 'Peeler group not found');
  res.json({ success: true, data });
});


exports.deletePeelerGroup = asyncHandler(async (req, res) => {
  const data = await PeelerGroup.findById(req.params.id);
  if (!data) throw new ApiError(404, 'Peeler group not found');
  if (data.user) await User.findByIdAndDelete(data.user);
  await data.deleteOne();
  res.json({ success: true, message: 'Peeler group deleted' });
});
