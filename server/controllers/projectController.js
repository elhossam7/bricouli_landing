const asyncHandler = require('express-async-handler');
const supabase = require('../config/db');

// @desc    Get user projects
// @route   GET /api/projects
// @access  Private
const getProjects = asyncHandler(async (req, res) => {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', req.user.id);

  if (error) {
    res.status(400);
    throw new Error(error.message);
  }

  res.status(200).json(projects);
});

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
const createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    res.status(400);
    throw new Error('Please add a name and description');
  }

  const { data: project, error } = await supabase
    .from('projects')
    .insert([{ name, description, user_id: req.user.id }])
    .select();

  if (error) {
    res.status(400);
    throw new Error(error.message);
  }

  res.status(201).json(project[0]);
});

module.exports = { getProjects, createProject };
