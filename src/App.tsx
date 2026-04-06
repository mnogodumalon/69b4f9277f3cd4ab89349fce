import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import FruehstuecksoptionenPage from '@/pages/FruehstuecksoptionenPage';
import GaestePage from '@/pages/GaestePage';
import MeinFruehstueckPage from '@/pages/MeinFruehstueckPage';
import ZimmerPage from '@/pages/ZimmerPage';
import FruehstuecksbestellungPage from '@/pages/FruehstuecksbestellungPage';

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <ActionsProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="fruehstuecksoptionen" element={<FruehstuecksoptionenPage />} />
              <Route path="gaeste" element={<GaestePage />} />
              <Route path="mein-fruehstueck" element={<MeinFruehstueckPage />} />
              <Route path="zimmer" element={<ZimmerPage />} />
              <Route path="fruehstuecksbestellung" element={<FruehstuecksbestellungPage />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Routes>
        </ActionsProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
