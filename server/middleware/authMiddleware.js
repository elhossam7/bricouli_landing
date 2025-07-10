const asyncHandler = require('express-async-handler');
const supabase = require('../config/db');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('Token received:', token ? 'Present' : 'Missing');

      // Verify token and get user
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        console.error('Auth error:', error);
        res.status(401);
        throw new Error('Not authorized, token failed');
      }

      console.log('User authenticated:', user.id);
      // Attach user to the request object
      req.user = user;
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(401);
      throw new Error('Not authorized');
    }
  }

  if (!token) {
    console.log('No token provided');
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

module.exports = { protect };
