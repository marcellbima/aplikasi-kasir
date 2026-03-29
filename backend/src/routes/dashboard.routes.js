// src/routes/dashboard.routes.js
const router = require('express').Router();
const { getDashboard } = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, authorize('ADMIN'), getDashboard);

module.exports = router;
