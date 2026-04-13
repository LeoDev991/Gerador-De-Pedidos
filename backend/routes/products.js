const express = require('express');
const ProductsController = require('../controllers/productsController');

const router = express.Router();

router.get('/', ProductsController.list);
router.post('/', ProductsController.create);
router.delete('/:id', ProductsController.remove);

module.exports = router;
