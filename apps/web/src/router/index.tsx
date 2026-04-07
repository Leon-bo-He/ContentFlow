import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppShell } from '../components/layout/AppShell.js';

const Dashboard = lazy(() => import('../pages/Dashboard.js'));
const Ideas = lazy(() => import('../pages/Ideas.js'));
const WorkspaceBoard = lazy(() => import('../pages/WorkspaceBoard.js'));
const Calendar = lazy(() => import('../pages/Calendar.js'));
const Publications = lazy(() => import('../pages/Publications.js'));
const Analytics = lazy(() => import('../pages/Analytics.js'));
const Settings = lazy(() => import('../pages/Settings.js'));

function Loading() {
  return <div className="p-6 text-gray-400">Loading…</div>;
}

function wrap(C: React.ComponentType) {
  return (
    <Suspense fallback={<Loading />}>
      <C />
    </Suspense>
  );
}

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: wrap(Dashboard) },
      { path: 'ideas', element: wrap(Ideas) },
      { path: 'workspaces/:workspaceId/board', element: wrap(WorkspaceBoard) },
      { path: 'workspaces/:workspaceId/calendar', element: wrap(Calendar) },
      { path: 'workspaces/:workspaceId/analytics', element: wrap(Analytics) },
      { path: 'publications', element: wrap(Publications) },
      { path: 'settings', element: wrap(Settings) },
    ],
  },
]);
