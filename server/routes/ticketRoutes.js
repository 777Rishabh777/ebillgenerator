const router = require('express').Router();
const c = require('../controllers/ticketController');

router.get('/',       c.getAll);
router.post('/',      c.create);
router.patch('/:id',  c.updateStatus);
router.delete('/:id', c.remove);

module.exports = router;
