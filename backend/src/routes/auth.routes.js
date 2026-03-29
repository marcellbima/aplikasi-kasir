// src/routes/auth.routes.js
const router = require('express').Router();
const { login, refreshToken, logout, me } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', authenticate, me);

module.exports = router;
