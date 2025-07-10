import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user.context';

/**
 * RedirectIfAuth is a component for public routes (e.g., landing, login, register).
 * If an authenticated user tries to access these routes, they are redirected to '/home'.
 * It waits for UserContext to finish its initial loading.
 */
const RedirectIfAuth = ({ children }) => {
    // Retrieve user object and loading state from UserContext
    const { user, loading: userContextLoading } = useContext(UserContext);
    const navigate = useNavigate();

    // useEffect to handle redirection logic if user is already authenticated
    React.useEffect(() => {
        // If UserContext is still loading, wait
        if (userContextLoading) {
            return;
        }

        // If UserContext has loaded and an authenticated user exists,
        // redirect them to the home page.
        if (user) {
            navigate('/home', { replace: true });
        }
        // If no user exists, this effect does nothing, allowing children (public page) to render.
    }, [user, userContextLoading, navigate]);

    // While UserContext is loading, display a loading indicator.
    if (userContextLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-50">
                <div className="text-lg font-medium text-slate-700">Loading...</div>
            </div>
        );
    }

    // If UserContext has loaded and the user is authenticated,
    // useEffect will have initiated navigation to '/home'. Show a message or loader.
    if (user) {
         return (
            <div className="flex justify-center items-center min-h-screen bg-slate-50">
                <div className="text-lg font-medium text-slate-700">Redirecting...</div>
            </div>
        );
    }

    // If UserContext has loaded and no user is authenticated, render the children (the public page).
    return <>{children}</>;
};

export default RedirectIfAuth;
