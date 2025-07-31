import { StrictMode } from 'react';
import { AppRouter } from '../routes/AppRouter';

export const AppProviders = () => {
  return (
    <StrictMode>
      <AppRouter />
    </StrictMode>
  );
};
