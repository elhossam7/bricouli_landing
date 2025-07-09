const asyncHandler = require('express-async-handler');
const supabase = require('../config/db');

const registerUser = asyncHandler(async (req, res) => {
  const { email, password, name, role, phone, businessName, experienceLevel, serviceRadius, zipCode, hourlyRate, skills } = req.body;

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
      const profileData = {
        id: data.user.id,
        name: name,
        role: role,
        email: email,
        phone: phone,
        profile_completed: false // Default to false, will be updated based on role-specific requirements
      };
      
      // Add role-specific fields
      if (role === 'artisan') {
        profileData.business_name = businessName;
        profileData.experience_level = experienceLevel;
        profileData.service_radius = serviceRadius;
        profileData.zip_code = zipCode;
        profileData.hourly_rate = hourlyRate;
        profileData.skills = skills;
        // Mark as completed if all artisan fields are provided
        profileData.profile_completed = name && phone && experienceLevel && serviceRadius && zipCode && skills;
      } else if (role === 'client') {
        // Mark as completed if basic client fields are provided
        profileData.profile_completed = name && phone;
      }
      
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData]);

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

  if (data && data.user) {
    // Check if user has completed their profile
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('profile_completed, name, role, phone, address, skills, bio, business_name, experience_level, service_radius, zip_code, hourly_rate')
        .eq('id', data.user.id)
        .single();
      
      let profileCompleted = false;
      
      if (!profileError && profile) {
        // Check if essential profile fields are filled
        const role = data.user.user_metadata?.role || profile.role;
        
        if (role === 'client') {
          // For clients, check if basic info is complete (be more lenient)
          profileCompleted = profile.name && (profile.phone || profile.email);
        } else if (role === 'artisan') {
          // For artisans, check if basic professional info is complete (be more lenient)
          profileCompleted = profile.name && (profile.phone || profile.email) && 
                           (profile.experience_level || profile.skills);
        }
        
        // Override with explicit profile_completed flag if it exists
        if (profile.profile_completed !== null && profile.profile_completed !== undefined) {
          profileCompleted = profile.profile_completed;
        }
      }
      
      // Update user metadata to include profile completion status
      const updatedData = {
        ...data,
        user: {
          ...data.user,
          user_metadata: {
            ...data.user.user_metadata,
            profile_completed: profileCompleted
          }
        }
      };
      
      res.json(updatedData);
    } catch (profileError) {
      console.error('Error checking profile completion:', profileError);
      // If we can't check profile, assume it's not completed
      const updatedData = {
        ...data,
        user: {
          ...data.user,
          user_metadata: {
            ...data.user.user_metadata,
            profile_completed: false
          }
        }
      };
      res.json(updatedData);
    }
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

// Complete user profile after registration
const completeProfile = asyncHandler(async (req, res) => {
  const { userId, name, phone, address, bio, skills } = req.body;
  
  if (!userId) {
    res.status(400);
    throw new Error('User ID is required');
  }
  
  try {
    // Update the profiles table
    const { error } = await supabase
      .from('profiles')
      .update({
        name: name,
        phone: phone,
        address: address,
        bio: bio,
        skills: skills,
        profile_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating profile:', error);
      res.status(500);
      throw new Error('Failed to update profile');
    }
    
    res.json({ 
      success: true, 
      message: 'Profile completed successfully' 
    });
    
  } catch (error) {
    console.error('Error completing profile:', error);
    res.status(500);
    throw new Error('Error completing profile');
  }
});

module.exports = { registerUser, authUser, toggleEmailVerification, getUserProfile, completeProfile };
