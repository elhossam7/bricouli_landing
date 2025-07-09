const express = require('express');
const { registerUser, authUser, toggleEmailVerification, getUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').post(registerUser);
router.post('/login', authUser);
router.get('/profile', protect, getUserProfile);
router.get('/email-verification-helper', toggleEmailVerification);

module.exports = router;
