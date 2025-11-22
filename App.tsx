import React from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Chat from './pages/Chat';
import Properties from './pages/Properties';
import AITraining from './pages/AITraining';
import Settings from './pages/Settings';
import Sandbox from './pages/Sandbox';
import Pipeline from './pages/Pipeline';
import Blacklist from './pages/Blacklist';
import { CRMProvider, useCRM } from './context/CRMContext';

const MainContent: React.FC = () => {
  const { currentView } = useCRM();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'leads': return <Leads />;
      case 'pipeline': return <Pipeline />;
      case 'chat': return <Chat />;
      case 'properties': return <Properties />;
      case 'training': return <AITraining />;
      case 'settings': return <Settings />;
      case 'sandbox': return <Sandbox />;
      case 'blacklist': return <Blacklist />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
      <Sidebar />
      <main className="ml-64 flex-1">
        {renderView()}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <CRMProvider>
      <MainContent />
    </CRMProvider>
  );
};

export default App;