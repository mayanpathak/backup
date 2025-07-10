import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserContext } from '../context/user.context'; // Assuming path is correct

/**
 * UserAuth is a component that protects routes requiring authentication for the current session.
 * If the user is not authenticated (user is null in UserContext), it redirects
 * them to the '/login' page.
 * It also handles the brief period while UserContext might be initializing its 'loading' state.
 */
const UserAuth = ({ children }) => {
    const { user, loading: userContextLoading } = useContext(UserContext);
    const location = useLocation();

    // If UserContext is still in its initial 'loading' state (though this should be minimal now),
    // show a generic loading indicator.
    if (userContextLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-50">
                <div className="text-lg font-medium text-slate-700">Loading...</div>
                {/* You might want a more sophisticated spinner here */}
            </div>
        );
    }

    // If context has loaded and there is no authenticated user for the current session,
    // redirect to the login page. Pass the current location in 'state' so that
    // after successful login, the user can be redirected back to the originally intended page.
    // However, our current Login.js redirects to /home directly.
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If an authenticated user exists for the current session, render the children components.
    return children;
};

export default UserAuth;