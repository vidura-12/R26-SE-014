const router = require('express').Router();
const controller = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', controller.getNotifications);
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', controller.markRead);
router.delete('/:id', controller.deleteNotification);

module.exports = router;
