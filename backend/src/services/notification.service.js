const Notification = require('../models/Notification');
const User = require('../models/User');
const { USER_ROLES } = require('../constants/enums');

async function createNotification({ recipient, title, message, type = 'GENERAL', link, meta }) {
  return Notification.create({ recipient, title, message, type, link, meta });
}

async function notifyAllAdmins({ title, message, type, link, meta }) {
  const admins = await User.find({ role: USER_ROLES.ADMIN, active: true }).select('_id');
  await Promise.all(admins.map(a => createNotification({ recipient: a._id, title, message, type, link, meta })));
}

async function notifyHarvestStatusChange({ harvest, oldStatus, newStatus, recipientUserId }) {
  const statusLabels = {
    PENDING: 'Pending',
    SCHEDULED: 'Scheduled',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };
  await createNotification({
    recipient: recipientUserId,
    title: 'Harvest Request Updated',
    message: `Your harvest request "${harvest.plantationName}" status changed from ${statusLabels[oldStatus] ?? oldStatus} to ${statusLabels[newStatus] ?? newStatus}.`,
    type: 'HARVEST_STATUS',
    link: '/farmer/harvests',
    meta: { harvestId: harvest._id, oldStatus, newStatus }
  });
}

async function notifyHarvestCreated(harvest) {
  await notifyAllAdmins({
    title: 'New Harvest Request',
    message: `A new harvest request "${harvest.plantationName}" has been submitted and is awaiting review.`,
    type: 'HARVEST_CREATED',
    link: '/admin/harvests',
    meta: { harvestId: harvest._id }
  });
}

async function notifyScheduleAssigned({ schedule, recipientUserIds }) {
  const { format } = require('date-fns');
  const weekLabel = format(new Date(schedule.weekStartDate), 'MMM d') + ' – ' + format(new Date(schedule.weekEndDate), 'MMM d, yyyy');
  await Promise.all(recipientUserIds.map(uid =>
    createNotification({
      recipient: uid,
      title: 'New Schedule Assigned',
      message: `A harvest schedule has been generated for the week of ${weekLabel}. Check your routes.`,
      type: 'SCHEDULE_ASSIGNED',
      link: '/peeler/routes',
      meta: { scheduleId: schedule._id }
    })
  ));
}

module.exports = { createNotification, notifyAllAdmins, notifyHarvestStatusChange, notifyHarvestCreated, notifyScheduleAssigned };
