// import React, { Suspense } from 'react'
// import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom'
// import Login from '../screens/Login'
// import Register from '../screens/Register'
// import Home from '../screens/Home'
// import Project from '../screens/Project'
// import UserAuth from '../auth/UserAuth'
// import LandingPage from '../screens/LandingPage'

// // Loading fallback component
// const LoadingFallback = () => (
//   <div style={{ 
//     display: 'flex', 
//     justifyContent: 'center', 
//     alignItems: 'center', 
//     height: '100vh',
//     fontSize: '18px',
//     color: '#666'
//   }}>
//     Loading...
//   </div>
// )

// // Error boundary component
// class RouteErrorBoundary extends React.Component {
//   constructor(props) {
//     super(props)
//     this.state = { hasError: false }
//   }

//   static getDerivedStateFromError(error) {
//     return { hasError: true }
//   }

//   componentDidCatch(error, errorInfo) {
//     console.error('Route Error:', error, errorInfo)
//   }

//   render() {
//     if (this.state.hasError) {
//       return (
//         <div style={{ 
//           display: 'flex', 
//           flexDirection: 'column',
//           justifyContent: 'center', 
//           alignItems: 'center', 
//           height: '100vh',
//           textAlign: 'center',
//           padding: '20px'
//         }}>
//           <h2>Something went wrong</h2>
//           <p>Please refresh the page or try again later.</p>
//           <button 
//             onClick={() => window.location.reload()}
//             style={{
//               padding: '10px 20px',
//               marginTop: '10px',
//               backgroundColor: '#007bff',
//               color: 'white',
//               border: 'none',
//               borderRadius: '4px',
//               cursor: 'pointer'
//             }}
//           >
//             Refresh Page
//           </button>
//         </div>
//       )
//     }

//     return this.props.children
//   }
// }

// // 404 Not Found component
// const NotFound = () => (
//   <div style={{ 
//     display: 'flex', 
//     flexDirection: 'column',
//     justifyContent: 'center', 
//     alignItems: 'center', 
//     height: '100vh',
//     textAlign: 'center',
//     padding: '20px'
//   }}>
//     <h2>404 - Page Not Found</h2>
//     <p>The page you're looking for doesn't exist.</p>
//     <a 
//       href="/" 
//       style={{
//         padding: '10px 20px',
//         marginTop: '10px',
//         backgroundColor: '#007bff',
//         color: 'white',
//         textDecoration: 'none',
//         borderRadius: '4px',
//         display: 'inline-block'
//       }}
//     >
//       Go Home
//     </a>
//   </div>
// )

// const AppRoutes = () => {
//   return (
//     <BrowserRouter>
//       <RouteErrorBoundary>
//         <Suspense fallback={<LoadingFallback />}>
//           <Routes>
//             {/* Default route - redirect to landing page */}
//             <Route path="/" element={<Navigate to="/landing" replace />} />
            
//             {/* Main application routes */}
//             <Route path="/landing" element={<LandingPage />} />
//             <Route path="/login" element={<Login />} />
//             <Route path="/register" element={<Register />} />
//             <Route 
//               path="/main" 
//               element={
//                 <UserAuth>
//                   <Home />
//                 </UserAuth>
//               } 
//             />
//             <Route 
//               path="/project" 
//               element={
//                 <UserAuth>
//                   <Project />
//                 </UserAuth>
//               } 
//             />
            
//             {/* Catch-all route for 404 */}
//             <Route path="*" element={<NotFound />} />
//           </Routes>
//         </Suspense>
//       </RouteErrorBoundary>
//     </BrowserRouter>
//   )
// }

// export default AppRoutes
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Screens
import Login from '../screens/Login';
import Register from '../screens/Register';
import Home from '../screens/Home';
import Project from '../screens/Project';
import LandingPage from '../screens/LandingPage';

// Auth wrapper for protected routes
import UserAuth from '../auth/UserAuth';

// NOTE: Ensure <BrowserRouter> and <UserProvider> are wrapping <AppRoutes /> in your main App.js or index.js

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
                path="/home"
                element={
                    <UserAuth>
                        <Home />
                    </UserAuth>
                }
            />
            <Route
                path="/project"
                element={
                    <UserAuth>
                        <Project />
                    </UserAuth>
                }
            />

            {/* Optional: Catch-all for 404 Not Found */}
            {/* <Route path="*" element={<NotFoundPage />} /> */}
        </Routes>
    );
};

export default AppRoutes;
