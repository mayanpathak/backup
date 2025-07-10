import userModel from '../models/user.model.js';

export const createUser = async ({ email, password }) => {
    try {
        // Basic input validation
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        if (typeof email !== 'string' || typeof password !== 'string') {
            throw new Error('Email and password must be strings');
        }

        const sanitizedEmail = email.trim();
        if (sanitizedEmail.length === 0) {
            throw new Error('Email cannot be empty');
        }

        // Hash password with error handling
        const hashedPassword = await userModel.hashPassword(password);
        
        if (!hashedPassword) {
            throw new Error('Failed to hash password');
        }

        // Create user with error handling
        const user = await userModel.create({
            email: sanitizedEmail,
            password: hashedPassword
        });

        return user;

    } catch (error) {
        // Handle duplicate key error
        if (error.code === 11000) {
            throw new Error('User with this email already exists');
        }
        throw error;
    }
};

export const getAllUsers = async ({ userId }) => {
    try {
        if (!userId) {
            throw new Error('User ID is required');
        }

        const users = await userModel.find({
            _id: { $ne: userId }
        });

        // Ensure we return an array
        return Array.isArray(users) ? users : [];

    } catch (error) {
        // Handle invalid ObjectId
        if (error.message.includes('Cast to ObjectId failed')) {
            throw new Error('Invalid User ID format');
        }
        throw error;
    }
};