// import React from 'react'
// import AppRoutes from './routes/AppRoutes'
// import { UserProvider } from './context/user.context'

// const App = () => {
//   return (
//     <UserProvider>
//       <AppRoutes />
//     </UserProvider>
//   )
// }

// export default App


import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { UserProvider } from './context/user.context';
import { AppProvider } from './context/AppContext';

const App = () => {
  return (
    <React.StrictMode>
      <UserProvider>
        <AppProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AppProvider>
      </UserProvider>
    </React.StrictMode>
  );
};

export default App;
