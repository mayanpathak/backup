import React, { createContext, useState, useEffect, useCallback } from 'react';

// Create the UserContext
export const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Start with loading true
    const [error, setError] = useState(null);

    // Effect to load user from localStorage on initial render
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            const storedToken = localStorage.getItem('token');
            if (storedUser && storedToken) {
                setUser(JSON.parse(storedUser));
            }
        } catch (err) {
            console.error("Failed to parse user from localStorage", err);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    }, []);

    // Login function to set user and store in localStorage
    const login = useCallback((userData, token) => {
        try {
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', token);
            setUser(userData);
        } catch (err) {
            console.error("Failed to save user to localStorage", err);
            setError("Could not save session. Please check your browser settings.");
        }
    }, []);

    // Clear user data from state and localStorage
    const clearUser = useCallback(() => {
        try {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setUser(null);
        } catch (err) {
            console.error("Failed to clear user from localStorage", err);
        }
    }, []);

    return (
        <UserContext.Provider 
            value={{ 
                user, 
                login, // Use login instead of setUser directly
                clearUser, 
                loading, 
                setLoading, 
                error, 
                setError,
                isAuthenticated: !!user // Helper to check if user is authenticated
            }}
        >
            {!loading && children} 
        </UserContext.Provider>
    );
};

// Custom hook to use the user context
export const useUser = () => {
    const context = React.useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};