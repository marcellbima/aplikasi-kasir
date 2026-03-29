// src/routes/product.routes.js
const router = require('express').Router();
const { getProducts, getProductByBarcode, getProduct, createProduct, updateProduct, adjustStock, deleteProduct } = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', getProducts);
router.get('/barcode/:barcode', getProductByBarcode);
router.get('/:id', getProduct);
router.post('/', authorize('ADMIN'), createProduct);
router.put('/:id', authorize('ADMIN'), updateProduct);
router.patch('/:id/stock', authorize('ADMIN'), adjustStock);
router.delete('/:id', authorize('ADMIN'), deleteProduct);

module.exports = router;
