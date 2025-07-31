import { ScheduleManager } from '@pages/index';
import { BrowserRouter, Navigate, Routes as ReactRouterRoutes, Route } from 'react-router-dom';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <ReactRouterRoutes>
        <Route path="/" element={<ScheduleManager />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </ReactRouterRoutes>
    </BrowserRouter>
  );
};
