const { Router } = require('express');
const {
  getProjects,
  createProject,
} = require('../controllers/projectController.js');
const { protect } = require('../middleware/authMiddleware.js');

const router = Router();

router.route('/').get(protect, getProjects).post(protect, createProject);

module.exports = router;
