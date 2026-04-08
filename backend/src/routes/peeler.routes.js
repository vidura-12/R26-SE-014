const router = require('express').Router();
const controller = require('../controllers/peeler.controller');
const validate = require('../middleware/validate.middleware');
const { protect, allowRoles } = require('../middleware/auth.middleware');
const { USER_ROLES } = require('../constants/enums');
const schemas = require('../validations/index');

router.use(protect);
router.post('/', allowRoles(USER_ROLES.PEELER, USER_ROLES.ADMIN), validate(schemas.peelerCreate), controller.createPeelerGroup);
router.get('/me', allowRoles(USER_ROLES.PEELER), controller.getMyGroup);
router.put('/me', allowRoles(USER_ROLES.PEELER), controller.updateMyGroup);
router.get('/', controller.getPeelerGroups);
router.get('/:id', controller.getPeelerGroupById);
router.put('/:id', allowRoles(USER_ROLES.PEELER, USER_ROLES.ADMIN), validate(schemas.peelerCreate), controller.updatePeelerGroup);
router.patch('/:id/availability', allowRoles(USER_ROLES.PEELER, USER_ROLES.ADMIN), controller.updateAvailability);
router.delete('/:id', allowRoles(USER_ROLES.ADMIN), controller.deletePeelerGroup);

module.exports = router;
