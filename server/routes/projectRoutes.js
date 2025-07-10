const { Router } = require('express');
const {
  getProjects,
  createProject,
  getProjectById,
  updateProjectStatus,
  getProjectStats,
  searchProjects,
  updateProject,
  deleteProject,
} = require('../controllers/projectController.js');
const { protect } = require('../middleware/authMiddleware.js');

const router = Router();

router.route('/').get(protect, getProjects).post(protect, createProject);
router.route('/stats').get(protect, getProjectStats);
router.route('/search').get(protect, searchProjects);
router.route('/:id').get(protect, getProjectById).put(protect, updateProject).delete(protect, deleteProject);
router.route('/:id/status').put(protect, updateProjectStatus);

module.exports = router;
