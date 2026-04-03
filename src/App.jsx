import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/layout/AppShell';
import { LineagePage } from './pages/LineagePage';
import { QueryListPage } from './pages/QueryListPage';
import { QueryDetailPage } from './pages/QueryDetailPage';
import { SchemaPage } from './pages/SchemaPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<Navigate to="/lineage" replace />} />
            <Route path="lineage" element={<LineagePage />} />
            <Route path="queries" element={<QueryListPage />} />
            <Route path="queries/:id" element={<QueryDetailPage />} />
            <Route path="schemas" element={<SchemaPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
