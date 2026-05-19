const router = require('express').Router();
const c = require('../controllers/userController');

router.get('/',       c.getAll);
router.delete('/:id', c.remove);

// Credit system routes
router.get('/:id/download-status', c.getDownloadStatus);
router.post('/:id/download', c.recordDownload);
router.post('/:id/credits', c.addCredits);
router.post('/:id/pro', c.setPro);

module.exports = router;
