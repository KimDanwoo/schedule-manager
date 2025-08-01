import { AppLayout } from '@/components/templates';
import { AnalyticsPage, CalendarPage, ScheduleManager } from '@pages/index';
import { BrowserRouter, Navigate, Routes as ReactRouterRoutes, Route } from 'react-router-dom';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <AppLayout>
        <ReactRouterRoutes>
          <Route path="/" element={<ScheduleManager />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </ReactRouterRoutes>
      </AppLayout>
    </BrowserRouter>
  );
};
