import React, { createContext, useState, useContext } from 'react';

// Create the UserContext
export const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Clear user data
    const clearUser = () => {
        setUser(null);
    };

    return (
        <UserContext.Provider 
            value={{ 
                user, 
                setUser, 
                clearUser, 
                loading, 
                setLoading, 
                error, 
                setError 
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

// Custom hook to use the user context
export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};