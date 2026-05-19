const router = require('express').Router();
const c = require('../controllers/statsController');

router.get('/', c.getStats);

module.exports = router;
