const router = require('express').Router();
const axios = require('axios');

router.get('/health', (req, res) => res.json({ success: true, message: 'Cinnamon backend API is running' }));

router.get('/optimization/health', async (req, res) => {
  try {
    const baseUrl = process.env.ALGO_URL || 'http://localhost:8001';
    const { data } = await axios.get(`${baseUrl}/health`);
    res.json(data);
  } catch (error) {
    res.status(502).json({ success: false, message: `Optimizer unreachable: ${error.message}` });
  }
});
router.use('/auth', require('./auth.routes'));
router.use('/farmers', require('./farmer.routes'));
router.use('/peeler-groups', require('./peeler.routes'));
router.use('/harvest-requests', require('./harvestRequest.routes'));
router.use('/optimization', require('./optimization.routes'));
router.use('/notifications', require('./notification.routes'));

module.exports = router;
