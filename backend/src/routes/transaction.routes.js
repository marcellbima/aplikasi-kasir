// src/routes/transaction.routes.js
const router = require('express').Router();
const { createTransaction, getTransactions, getTransaction, updateTransaction, deleteTransaction } = require('../controllers/transaction.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/', getTransactions);
router.get('/:id', getTransaction);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
