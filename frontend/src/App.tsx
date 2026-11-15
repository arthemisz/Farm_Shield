import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { FarmShieldProvider } from './context/FarmShieldContext';
import { AppRoutes } from './routes/AppRoutes';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <FarmShieldProvider>
        <AppRoutes />
      </FarmShieldProvider>
    </BrowserRouter>
  );
};

export default App;

