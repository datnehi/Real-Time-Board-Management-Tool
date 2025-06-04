const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  sendVerificationCode,
  signup,
  signin,
  getUser,
  updateUser,
} = require('../controllers/auth.controller');

router.post('/send-code', sendVerificationCode);
router.post('/signup', signup);
router.post('/signin', signin);
router.get('/user', authMiddleware, getUser);
router.put('/user', authMiddleware, updateUser);

module.exports = router;
