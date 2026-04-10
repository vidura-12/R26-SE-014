const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['HARVEST_STATUS', 'SCHEDULE_ASSIGNED', 'HARVEST_CREATED', 'GENERAL'],
    default: 'GENERAL'
  },
  read: { type: Boolean, default: false },
  link: { type: String },
  meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
