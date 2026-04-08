const User = require('../models/User');
const Farmer = require('../models/Farmer');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { signToken } = require('../services/token.service');
const { USER_ROLES } = require('../constants/enums');

exports.register = asyncHandler(async (req, res) => {
  const exists = await User.findOne({ email: req.body.email });
  if (exists) throw new ApiError(409, 'Email already exists');
  const user = await User.create(req.body);

  // Auto-create a basic farmer profile so the user can submit harvest requests immediately
  if (user.role === USER_ROLES.FARMER) {
    const existing = await Farmer.findOne({ user: user._id });
    if (!existing) {
      await Farmer.create({
        user: user._id,
        fullName: user.name,
        primaryLocation: { lat: 6.9271, lng: 79.8612, address: '', district: '' },
      }).catch(() => {});
    }
  }

  const token = signToken(user);
  res.status(201).json({ success: true, token, data: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

exports.login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password))) throw new ApiError(401, 'Invalid email or password');
  const token = signToken(user);
  res.json({ success: true, token, data: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

exports.me = asyncHandler(async (req, res) => res.json({ success: true, data: req.user }));

exports.userCounts = asyncHandler(async (req, res) => {
  const [total, admin, farmer, peeler] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'ADMIN' }),
    User.countDocuments({ role: 'FARMER' }),
    User.countDocuments({ role: 'PEELER' }),
  ])
  res.json({ success: true, data: { total, ADMIN: admin, FARMER: farmer, PEELER: peeler } })
})

exports.listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit))) : 0
  const filter = {}
  if (req.query.role) filter.role = req.query.role
  if (req.query.search) {
    const re = new RegExp(req.query.search, 'i')
    filter.$or = [{ name: re }, { email: re }, { phone: re }]
  }
  const total = await User.countDocuments(filter)
  const query = User.find(filter).select('-password').sort({ createdAt: -1 })
  if (limit) query.skip((page - 1) * limit).limit(limit)
  const users = await query
  res.json({ success: true, total, page, data: users });
});

exports.updateAccount = asyncHandler(async (req, res) => {
  const { name, phone, currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  if (name !== undefined) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();

  if (newPassword) {
    if (!currentPassword) throw new ApiError(400, 'Current password is required to set a new password');
    const valid = await user.comparePassword(currentPassword);
    if (!valid) throw new ApiError(401, 'Current password is incorrect');
    user.password = newPassword;
  }

  await user.save();
  res.json({ success: true, data: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
});

exports.getFarmerUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: USER_ROLES.FARMER, active: true }).select('_id name email');
  // Exclude users who already have a farmer profile
  const linked = await Farmer.find().distinct('user');
  const unlinked = users.filter(u => !linked.some(id => id.toString() === u._id.toString()));
  res.json({ success: true, data: unlinked });
});
