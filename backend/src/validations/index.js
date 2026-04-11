const Joi = require('joi');
const { USER_ROLES, PROCESSING_CATEGORIES, HARVEST_STATUSES } = require('../constants/enums');

const objectId = Joi.string().hex().length(24);

const location = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  address: Joi.string().allow('', null),
  district: Joi.string().allow('', null)
});

const email = Joi.string().email({ tlds: { allow: false } }).required()

const register = Joi.object({
  name: Joi.string().required(),
  email,
  phone: Joi.string().allow('', null),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid(...Object.values(USER_ROLES)).required()
});

const login = Joi.object({ email, password: Joi.string().required() });

const farmerCreate = Joi.object({
  fullName: Joi.string().required(),
  nic: Joi.string().allow('', null),
  primaryLocation: location.required(),
  notes: Joi.string().allow('', null),
  userId: objectId.allow('', null).optional(),
  email: Joi.string().email({ tlds: { allow: false } }).optional(),
  password: Joi.string().min(6).optional(),
  phone: Joi.string().allow('', null).optional(),
});

const peelerCreate = Joi.object({
  groupName: Joi.string().required(),
  leaderName: Joi.string().required(),
  currentLocation: location.required(),
  groupSize: Joi.number().integer().min(1).required(),
  peelingCapacityTreesPerHour: Joi.number().min(1).required(),
  maxHoursPerDay: Joi.number().min(1).max(16).default(8),
  skillLevel: Joi.number().min(1).max(5).default(3),
  rating: Joi.number().min(1).max(5).default(4),
  availability: Joi.array().items(Joi.object({
    date: Joi.date().required(),
    available: Joi.boolean().default(true),
    startTime: Joi.string().default('08:00'),
    endTime: Joi.string().default('17:00')
  })).default([]),
  email: Joi.string().email({ tlds: { allow: false } }).optional(),
  password: Joi.string().min(6).optional(),
  phone: Joi.string().allow('', null).optional(),
});

const harvestCreate = Joi.object({
  farmer: objectId.optional(),
  plantationName: Joi.string().required(),
  location: location.required(),
  treeCount: Joi.number().integer().min(1).required(),
  harvestReadyDate: Joi.date().required(),
  deadlineDate: Joi.date().required(),
  urgencyLevel: Joi.number().integer().min(1).max(5).default(3),
  processingCategory: Joi.string().valid(...Object.values(PROCESSING_CATEGORIES)).required(),
  estimatedYieldKg: Joi.number().min(0).optional(),
  notes: Joi.string().allow('', null)
});

const harvestUpdate = harvestCreate.fork(
  ['plantationName', 'location', 'treeCount', 'harvestReadyDate', 'deadlineDate', 'processingCategory'],
  (schema) => schema.optional()
);

const statusUpdate = Joi.object({
  status: Joi.string().valid(...Object.values(HARVEST_STATUSES)).required()
});

const optimize = Joi.object({
  weekStartDate: Joi.date().required(),
  weekEndDate: Joi.date().required()
});

const updateAccount = Joi.object({
  name: Joi.string().min(1).optional(),
  phone: Joi.string().allow('', null).optional(),
  currentPassword: Joi.string().optional(),
  newPassword: Joi.string().min(6).optional(),
});

module.exports = { register, login, farmerCreate, peelerCreate, harvestCreate, harvestUpdate, statusUpdate, optimize, updateAccount };
