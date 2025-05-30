const express = require('express');
const router = express.Router();
const {
  sendVerificationCode,
  signup,
  signin,
  githubOAuth,
} = require('../controllers/auth.controller');

router.post('/send-code', sendVerificationCode);
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/github', githubOAuth);

module.exports = router;
