const asyncHandler = require('express-async-handler');
const supabase = require('../config/db');

const registerUser = asyncHandler(async (req, res) => {
  const { email, password, name, role } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      },
    },
  });

  if (error) {
    res.status(400);
    throw new Error(error.message);
  }

  if (data) {
    res.status(201).json(data);
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    res.status(401);
    throw new Error(error.message);
  }

  if (data) {
    res.json(data);
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

module.exports = { registerUser, authUser };
