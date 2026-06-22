import { useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ConnectorsPage } from './pages/ConnectorsPage';
import { MainLayout } from './components/ui/MainLayout';
import { useSession } from './hooks/useSession';

function App() {
  const session = useSession();
  const [activePage, setActivePage] = useState<'dashboard' | 'connectors'>('dashboard');

  if (!session) {
    return <LoginPage />;
  }

  return (
    <MainLayout activePage={activePage} onNavigate={setActivePage}>
      {activePage === 'dashboard' ? <DashboardPage /> : <ConnectorsPage />}
    </MainLayout>
  );
}

export default App;
