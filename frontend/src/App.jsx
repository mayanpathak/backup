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

const App = () => {
  return (
    <React.StrictMode>
      <UserProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </UserProvider>
    </React.StrictMode>
  );
};

export default App;
