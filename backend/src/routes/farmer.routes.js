const router = require('express').Router();
const controller = require('../controllers/farmer.controller');
const validate = require('../middleware/validate.middleware');
const { protect, allowRoles } = require('../middleware/auth.middleware');
const { USER_ROLES } = require('../constants/enums');
const schemas = require('../validations/index');

router.use(protect);
router.post('/', allowRoles(USER_ROLES.FARMER, USER_ROLES.ADMIN), validate(schemas.farmerCreate), controller.createFarmer);
router.get('/me', allowRoles(USER_ROLES.FARMER), controller.getMyProfile);
router.put('/me', allowRoles(USER_ROLES.FARMER), controller.updateMyProfile);
router.get('/', controller.getFarmers);
router.get('/:id', controller.getFarmerById);
router.put('/:id', validate(schemas.farmerCreate), controller.updateFarmer);
router.delete('/:id', allowRoles(USER_ROLES.ADMIN), controller.deleteFarmer);

module.exports = router;
