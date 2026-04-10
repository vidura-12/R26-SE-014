const Schedule = require('../models/Schedule');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { runOptimization, buildOptimizationPayload } = require('../services/optimizer.service');
const { notifyScheduleAssigned, notifyAllAdmins } = require('../services/notification.service');

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
    const populated = await Schedule.findById(schedule._id).populate('assignments.peelerGroup');
    const peelerUserIds = (populated.assignments ?? []).map(a => a.peelerGroup?.user).filter(Boolean);
    if (peelerUserIds.length > 0) await notifyScheduleAssigned({ schedule, recipientUserIds: peelerUserIds });
    await notifyAllAdmins({
      title: 'Optimization Complete',
      message: `A new harvest schedule has been generated with ${populated.assignments?.length ?? 0} peeler routes.`,
      type: 'SCHEDULE_ASSIGNED',
      link: '/admin/schedules',
      meta: { scheduleId: schedule._id }
    });
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

