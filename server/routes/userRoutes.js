const express = require('express');
const { 
  registerUser, 
  authUser, 
  toggleEmailVerification, 
  getUserProfile, 
  completeProfile,
  updateUserProfile,
  getDetailedUserProfile,
  updateAvatar
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').post(registerUser);
router.post('/login', authUser);
router.get('/profile', protect, getUserProfile);
router.get('/profile/detailed', protect, getDetailedUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/profile/avatar', protect, updateAvatar);
router.post('/complete-profile', completeProfile);
router.get('/email-verification-helper', toggleEmailVerification);

module.exports = router;
