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

      // Verify token and get user
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        res.status(401);
        throw new Error('Not authorized, token failed');
      }

      // Attach user to the request object
      req.user = user;
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

module.exports = { protect };
