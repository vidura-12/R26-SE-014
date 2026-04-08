const Farmer = require('../models/Farmer');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { USER_ROLES } = require('../constants/enums');

exports.createFarmer = asyncHandler(async (req, res) => {
  let userId = req.body.userId || null

  if (req.user.role === USER_ROLES.FARMER) {
    userId = req.user._id
    const existing = await Farmer.findOne({ user: userId })
    if (existing) throw new ApiError(409, 'Farmer profile already exists')
  } else if (req.user.role === USER_ROLES.ADMIN) {
    if (req.body.email && req.body.password) {
      // Auto-create a farmer user account then link it
      const exists = await User.findOne({ email: req.body.email })
      if (exists) throw new ApiError(409, 'A user with this email already exists')
      const newUser = await User.create({
        name: req.body.fullName,
        email: req.body.email,
        password: req.body.password,
        phone: req.body.phone || '',
        role: USER_ROLES.FARMER,
      })
      userId = newUser._id
    } else if (req.body.userId) {
      const linkedUser = await User.findById(req.body.userId)
      if (!linkedUser) throw new ApiError(404, 'User not found')
      const existing = await Farmer.findOne({ user: req.body.userId })
      if (existing) throw new ApiError(409, 'A farmer profile already exists for this user')
    }
  }

  const { userId: _removed, email: _e, password: _p, phone: _ph, ...rest } = req.body
  const farmer = await Farmer.create({ ...rest, user: userId || req.user._id })
  res.status(201).json({ success: true, data: farmer })
});

exports.getMyProfile = asyncHandler(async (req, res) => {
  const data = await Farmer.findOne({ user: req.user._id }).populate('user', 'name email phone role');
  if (!data) throw new ApiError(404, 'Farmer profile not found');
  res.json({ success: true, data });
});

exports.updateMyProfile = asyncHandler(async (req, res) => {
  const allowed = ['fullName', 'nic', 'primaryLocation', 'notes']
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)))
  const data = await Farmer.findOneAndUpdate({ user: req.user._id }, updates, { new: true, runValidators: true });
  if (!data) throw new ApiError(404, 'Farmer profile not found');
  res.json({ success: true, data });
});

exports.getFarmers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit))) : 0
  const filter = {}
  if (req.query.search) {
    const re = new RegExp(req.query.search, 'i')
    filter.$or = [{ fullName: re }, { 'primaryLocation.district': re }, { nic: re }]
  }
  const total = await Farmer.countDocuments(filter)
  const query = Farmer.find(filter).populate('user', 'name email phone role').sort({ createdAt: -1 })
  if (limit) query.skip((page - 1) * limit).limit(limit)
  const data = await query
  res.json({ success: true, count: data.length, total, page, data });
});

exports.getFarmerById = asyncHandler(async (req, res) => {
  const data = await Farmer.findById(req.params.id).populate('user', 'name email phone role');
  if (!data) throw new ApiError(404, 'Farmer not found');
  res.json({ success: true, data });
});

exports.updateFarmer = asyncHandler(async (req, res) => {
  const data = await Farmer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!data) throw new ApiError(404, 'Farmer not found');
  res.json({ success: true, data });
});

exports.deleteFarmer = asyncHandler(async (req, res) => {
  const data = await Farmer.findById(req.params.id);
  if (!data) throw new ApiError(404, 'Farmer not found');
  if (data.user) await User.findByIdAndDelete(data.user);
  await data.deleteOne();
  res.json({ success: true, message: 'Farmer deleted' });
});
