// User Model - Database interaction utilities
const supabase = require('../config/db');

/**
 * User profile data model
 * Provides utilities for interacting with user profiles in the database
 */
class UserModel {
    /**
     * Get user profile by ID
     * @param {string} userId - User UUID
     * @returns {Promise<Object>} User profile data
     */
    static async getProfile(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        return data;
    }

    /**
     * Update user profile
     * @param {string} userId - User UUID
     * @param {Object} profileData - Profile data to update
     * @returns {Promise<Object>} Updated profile data
     */
    static async updateProfile(userId, profileData) {
        const { data, error } = await supabase
            .from('profiles')
            .update({
                ...profileData,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    /**
     * Create new user profile
     * @param {Object} profileData - Profile data
     * @returns {Promise<Object>} Created profile data
     */
    static async createProfile(profileData) {
        const { data, error } = await supabase
            .from('profiles')
            .insert([profileData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    /**
     * Get user project statistics
     * @param {string} userId - User UUID
     * @param {string} role - User role (client/artisan)
     * @returns {Promise<Object>} Project statistics
     */
    static async getProjectStats(userId, role) {
        const column = role === 'client' ? 'client_id' : 'artisan_id';
        
        const { data, error } = await supabase
            .from('projects')
            .select('status')
            .eq(column, userId);
        
        if (error || !data) {
            return { totalProjects: 0, completedProjects: 0 };
        }
        
        const totalProjects = data.length;
        const completedProjects = data.filter(p => p.status === 'completed').length;
        
        return { totalProjects, completedProjects };
    }
}

module.exports = UserModel;
