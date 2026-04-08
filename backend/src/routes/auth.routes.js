const router = require('express').Router();
const controller = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { protect, allowRoles } = require('../middleware/auth.middleware');
const schemas = require('../validations/index');
const { USER_ROLES } = require('../constants/enums');

router.post('/register', validate(schemas.register), controller.register);
router.post('/login', validate(schemas.login), controller.login);
router.get('/me', protect, controller.me);
router.patch('/update-account', protect, validate(schemas.updateAccount), controller.updateAccount);
router.get('/users/counts', protect, allowRoles(USER_ROLES.ADMIN), controller.userCounts);
router.get('/users', protect, allowRoles(USER_ROLES.ADMIN), controller.listUsers);
router.get('/farmer-users', protect, controller.getFarmerUsers);

module.exports = router;
