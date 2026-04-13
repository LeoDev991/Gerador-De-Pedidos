const express = require('express');
const OrdersController = require('../controllers/ordersController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/meta', OrdersController.stores);
router.get('/:id/pdf', OrdersController.pdf);
router.get('/', OrdersController.list);
router.post('/', authMiddleware, OrdersController.create);
router.get('/:id', OrdersController.detail);
router.post('/:id/duplicate', authMiddleware, OrdersController.duplicate);

module.exports = router;
