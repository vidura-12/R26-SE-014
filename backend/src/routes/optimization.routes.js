const router = require('express').Router();
const controller = require('../controllers/optimization.controller');
const validate = require('../middleware/validate.middleware');
const { protect, allowRoles } = require('../middleware/auth.middleware');
const { USER_ROLES } = require('../constants/enums');
const schemas = require('../validations/index');

router.use(protect);
router.post('/preview-payload', allowRoles(USER_ROLES.ADMIN), validate(schemas.optimize), controller.previewPayload);
router.post('/run', allowRoles(USER_ROLES.ADMIN), validate(schemas.optimize), controller.runOptimization);
router.get('/schedules', controller.getSchedules);
router.get('/schedules/:id', controller.getScheduleById);

module.exports = router;
