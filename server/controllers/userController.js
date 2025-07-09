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
      emailRedirectTo: 'http://localhost:3000/pages/login.html?verified=true'
    },
  });

  if (error) {
    res.status(400);
    throw new Error(error.message);
  }

  if (data.user) {
    try {
      // Also create a profile record in the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            name: name,
            role: role,
            email: email
          }
        ]);

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Don't throw error here as the user is already created
      }
    } catch (profileError) {
      console.error('Error creating profile:', profileError);
    }

    // Check if email confirmation is required
    if (data.user && !data.user.email_confirmed_at) {
      res.status(201).json({
        message: 'Registration successful! Please check your email to verify your account before logging in.',
        user: data.user,
        session: data.session,
        emailConfirmationRequired: true
      });
    } else {
      res.status(201).json(data);
    }
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
    // Provide more specific error messages
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('Invalid email or password. If you just registered, please check your email to verify your account first.');
    } else if (error.message.includes('Email not confirmed')) {
      throw new Error('Please check your email and click the verification link before logging in.');
    } else {
      throw new Error(error.message);
    }
  }

  if (data) {
    res.json(data);
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// Development helper - disable email verification
const toggleEmailVerification = asyncHandler(async (req, res) => {
  // This should only be used in development
  // In production, you should configure this in Supabase dashboard
  res.json({ 
    message: 'To disable email verification, go to Supabase Dashboard > Authentication > Settings > Email Confirmations and toggle off "Enable email confirmations"' 
  });
});

// Get user profile
const getUserProfile = asyncHandler(async (req, res) => {
  const { user } = req; // This should be set by auth middleware
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', user.id)
      .single();
    
    if (error) {
      res.status(404);
      throw new Error('Profile not found');
    }
    
    res.json(profile);
  } catch (error) {
    res.status(500);
    throw new Error('Error fetching profile');
  }
});

module.exports = { registerUser, authUser, toggleEmailVerification, getUserProfile };
