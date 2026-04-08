const router = require('express').Router();
const controller = require('../controllers/harvestRequest.controller');
const validate = require('../middleware/validate.middleware');
const { protect, allowRoles } = require('../middleware/auth.middleware');
const { USER_ROLES } = require('../constants/enums');
const schemas = require('../validations/index');

router.use(protect);
router.post('/', allowRoles(USER_ROLES.FARMER, USER_ROLES.ADMIN), validate(schemas.harvestCreate), controller.createHarvestRequest);
router.get('/', controller.getHarvestRequests);
router.get('/:id', controller.getHarvestRequestById);
router.put('/:id', allowRoles(USER_ROLES.FARMER, USER_ROLES.ADMIN), validate(schemas.harvestUpdate), controller.updateHarvestRequest);
router.patch('/:id/status', allowRoles(USER_ROLES.FARMER, USER_ROLES.ADMIN), validate(schemas.statusUpdate), controller.updateHarvestRequestStatus);
router.delete('/:id', allowRoles(USER_ROLES.ADMIN), controller.deleteHarvestRequest);

module.exports = router;
