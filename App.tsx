
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Chat from './pages/Chat';
import Properties from './pages/Properties';
import AITraining from './pages/AITraining';
import Settings from './pages/Settings';
import Sandbox from './pages/Sandbox';
import Pipeline from './pages/Pipeline';
import TagsPipeline from './pages/TagsPipeline';
import Blacklist from './pages/Blacklist';
import DataManagement from './pages/DataManagement';
import { CRMProvider, useCRM } from './context/CRMContext';
import { Menu, X } from 'lucide-react';

const MainContent: React.FC = () => {
  const { currentView } = useCRM();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'leads': return <Leads />;
      case 'pipeline': return <Pipeline />;
      case 'tags-pipeline': return <TagsPipeline />;
      case 'chat': return <Chat />;
      case 'properties': return <Properties />;
      case 'training': return <AITraining />;
      case 'settings': return <Settings />;
      case 'sandbox': return <Sandbox />;
      case 'blacklist': return <Blacklist />;
      case 'data-management': return <DataManagement />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900 overflow-x-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Wrapper */}
      <div className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <main className="flex-1 flex flex-col w-full min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
            <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <Menu size={24} />
            </button>
            <span className="font-bold text-emerald-600 text-lg">ConstrutoraGPT</span>
            <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        <div className="flex-1 overflow-auto">
            {renderView()}
        </div>
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