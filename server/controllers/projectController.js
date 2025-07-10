const asyncHandler = require('express-async-handler');
const supabase = require('../config/db');

// @desc    Get user projects
// @route   GET /api/projects
// @access  Private
const getProjects = asyncHandler(async (req, res) => {
  // Try to get all projects first to see the schema
  const { data: allProjects, error: allError } = await supabase
    .from('projects')
    .select('*')
    .limit(5);

  if (allError) {
    console.error('Error fetching all projects:', allError);
  } else {
    console.log('All projects sample:', allProjects);
  }

  // Now try with client_id instead of user_id
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', req.user.id);

  if (error) {
    console.error('Error fetching user projects with client_id:', error);
    res.status(400);
    throw new Error(error.message);
  }

  res.status(200).json(projects);
});

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
const createProject = asyncHandler(async (req, res) => {
  console.log('Creating project with data:', req.body);
  console.log('User ID:', req.user.id);
  
  const { 
    title, 
    description, 
    category, 
    budget, 
    timeline, 
    location, 
    skills_required, 
    project_type, 
    urgency_level,
    photos,
    additional_requirements 
  } = req.body;

  if (!title || !description) {
    console.log('Validation failed: Missing required fields');
    res.status(400);
    throw new Error('Please provide title and description');
  }

  // Let's first try to get the existing projects to understand the schema
  try {
    const { data: existingProjects, error: schemaError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.error('Schema check error:', schemaError);
    } else {
      console.log('Existing project schema (first row):', existingProjects[0] || 'No existing projects');
    }
  } catch (e) {
    console.log('Could not check schema:', e.message);
  }

  // Create minimal project data with only the fields that exist in the database
  const projectData = {
    title,
    description,
    client_id: req.user.id,
    status: 'open',
    created_at: new Date().toISOString()
  };

  // Add only the fields that exist in the database schema
  if (budget) projectData.budget = budget;
  // Skip fields that don't exist in the database yet
  // if (timeline) projectData.timeline = timeline;
  // if (location) projectData.location = location;
  // if (urgency_level) projectData.urgency_level = urgency_level;
  
  // Skip problematic fields like 'category' for now
  // if (category) projectData.category = category;

  console.log('Project data to insert:', projectData);

  // Try to insert the project
  const { data: project, error } = await supabase
    .from('projects')
    .insert([projectData])
    .select();

  if (error) {
    console.error('Supabase error:', error);
    res.status(400);
    throw new Error(error.message);
  }

  console.log('Project created successfully:', project[0]);
  res.status(201).json(project[0]);
});

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // First try to get the project with any user field that might exist
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    res.status(404);
    throw new Error('Project not found');
  }

  // Check if user owns this project (try different user field names)
  const userIdFields = ['client_id', 'user_id', 'owner_id', 'created_by'];
  const userOwnsProject = userIdFields.some(field => 
    project[field] && project[field] === req.user.id
  );

  if (!userOwnsProject) {
    res.status(403);
    throw new Error('Not authorized to view this project');
  }

  res.status(200).json(project);
});

// @desc    Update project status
// @route   PUT /api/projects/:id/status
// @access  Private
const updateProjectStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    res.status(400);
    throw new Error('Status is required');
  }

  // Validate status values
  const validStatuses = ['open', 'in_progress', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status value');
  }

  // First get the project to check ownership
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Error fetching project:', fetchError);
    res.status(404);
    throw new Error('Project not found');
  }

  // Check if user owns this project
  const userIdFields = ['client_id', 'user_id', 'owner_id', 'created_by'];
  const userOwnsProject = userIdFields.some(field => 
    project[field] && project[field] === req.user.id
  );

  if (!userOwnsProject) {
    res.status(403);
    throw new Error('Not authorized to update this project');
  }

  // Update the project status
  const { data: updatedProject, error } = await supabase
    .from('projects')
    .update({ 
      status
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating project status:', error);
    res.status(400);
    throw new Error('Failed to update project status');
  }

  res.status(200).json(updatedProject);
});

// @desc    Get project statistics for dashboard
// @route   GET /api/projects/stats
// @access  Private
const getProjectStats = asyncHandler(async (req, res) => {
  try {
    // Get all projects for the user
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', req.user.id);

    if (error) {
      console.error('Error fetching projects for stats:', error);
      res.status(400);
      throw new Error(error.message);
    }

    // Calculate statistics
    const stats = {
      total: projects.length,
      active: projects.filter(p => p.status === 'open' || p.status === 'in_progress').length,
      completed: projects.filter(p => p.status === 'completed').length,
      cancelled: projects.filter(p => p.status === 'cancelled').length,
      draft: projects.filter(p => p.status === 'draft').length,
      totalBudget: projects.reduce((sum, p) => {
        if (p.budget && p.budget.includes('-')) {
          // Handle ranges like "500-1000"
          const [min, max] = p.budget.replace(/[^0-9-]/g, '').split('-');
          return sum + (parseInt(max) || 0);
        } else if (p.budget) {
          // Handle single values
          const amount = parseInt(p.budget.replace(/[^0-9]/g, ''));
          return sum + (amount || 0);
        }
        return sum;
      }, 0),
      averageResponseTime: calculateAverageResponseTime(projects),
      recentActivity: projects
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          title: p.title,
          status: p.status,
          created_at: p.created_at
        }))
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error calculating project stats:', error);
    res.status(500);
    throw new Error('Failed to calculate project statistics');
  }
});

// Helper function to calculate average response time
const calculateAverageResponseTime = (projects) => {
  const completedProjects = projects.filter(p => p.status === 'completed');
  if (completedProjects.length === 0) return 0;
  
  const totalTime = completedProjects.reduce((sum, project) => {
    const start = new Date(project.created_at);
    const end = new Date(); // Use current time as end since we don't have updated_at
    return sum + (end - start) / (1000 * 60 * 60 * 24); // Convert to days
  }, 0);
  
  return Math.round(totalTime / completedProjects.length);
};

// @desc    Search and filter projects
// @route   GET /api/projects/search
// @access  Private
const searchProjects = asyncHandler(async (req, res) => {
  const { 
    query, 
    status, 
    dateFrom, 
    dateTo, 
    minBudget, 
    maxBudget,
    sortBy = 'created_at',
    sortOrder = 'desc',
    page = 1,
    limit = 10
  } = req.query;

  try {
    let supabaseQuery = supabase
      .from('projects')
      .select('*')
      .eq('client_id', req.user.id);

    // Apply filters
    if (status) {
      supabaseQuery = supabaseQuery.eq('status', status);
    }

    if (dateFrom) {
      supabaseQuery = supabaseQuery.gte('created_at', dateFrom);
    }

    if (dateTo) {
      supabaseQuery = supabaseQuery.lte('created_at', dateTo);
    }

    // Text search in title and description
    if (query) {
      supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    // Apply sorting
    supabaseQuery = supabaseQuery.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

    const { data: projects, error, count } = await supabaseQuery;

    if (error) {
      console.error('Error searching projects:', error);
      res.status(400);
      throw new Error(error.message);
    }

    // Filter by budget if specified (since Supabase might not support budget range filtering directly)
    let filteredProjects = projects;
    if (minBudget || maxBudget) {
      filteredProjects = projects.filter(project => {
        if (!project.budget) return false;
        
        let projectBudget = 0;
        if (project.budget.includes('-')) {
          const [min, max] = project.budget.replace(/[^0-9-]/g, '').split('-');
          projectBudget = parseInt(max) || 0;
        } else {
          projectBudget = parseInt(project.budget.replace(/[^0-9]/g, '')) || 0;
        }
        
        if (minBudget && projectBudget < parseInt(minBudget)) return false;
        if (maxBudget && projectBudget > parseInt(maxBudget)) return false;
        return true;
      });
    }

    res.status(200).json({
      projects: filteredProjects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || filteredProjects.length,
        pages: Math.ceil((count || filteredProjects.length) / limit)
      }
    });

  } catch (error) {
    console.error('Error in search projects:', error);
    res.status(500);
    throw new Error('Failed to search projects');
  }
});

// @desc    Update project details
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    title, 
    description, 
    budget, 
    timeline, 
    location, 
    urgency_level,
    additional_requirements 
  } = req.body;

  // First get the project to check ownership
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Error fetching project:', fetchError);
    res.status(404);
    throw new Error('Project not found');
  }

  // Check if user owns this project
  const userIdFields = ['client_id', 'user_id', 'owner_id', 'created_by'];
  const userOwnsProject = userIdFields.some(field => 
    project[field] && project[field] === req.user.id
  );

  if (!userOwnsProject) {
    res.status(403);
    throw new Error('Not authorized to update this project');
  }

  // Prepare update data with only existing database fields
  const updateData = {};

  if (title) updateData.title = title;
  if (description) updateData.description = description;
  if (budget) updateData.budget = budget;
  // Skip fields that don't exist in the database yet
  // if (timeline) updateData.timeline = timeline;
  // if (location) updateData.location = location;
  // if (urgency_level) updateData.urgency_level = urgency_level;
  // if (additional_requirements) updateData.requirements = additional_requirements;

  // Update the project
  const { data: updatedProject, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    res.status(400);
    throw new Error('Failed to update project');
  }

  res.status(200).json(updatedProject);
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // First get the project to check ownership
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Error fetching project:', fetchError);
    res.status(404);
    throw new Error('Project not found');
  }

  // Check if user owns this project
  const userIdFields = ['client_id', 'user_id', 'owner_id', 'created_by'];
  const userOwnsProject = userIdFields.some(field => 
    project[field] && project[field] === req.user.id
  );

  if (!userOwnsProject) {
    res.status(403);
    throw new Error('Not authorized to delete this project');
  }

  // Delete the project
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting project:', error);
    res.status(400);
    throw new Error('Failed to delete project');
  }

  res.status(200).json({ message: 'Project deleted successfully' });
});

module.exports = { getProjects, createProject, getProjectById, updateProjectStatus, getProjectStats, searchProjects, updateProject, deleteProject };
