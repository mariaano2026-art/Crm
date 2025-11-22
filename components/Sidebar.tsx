import React from 'react';
import { useCRM } from '../context/CRMContext';
import { LayoutDashboard, Users, MessageSquare, Building2, Settings, LogOut, Brain, FlaskConical, Bell, Kanban, ShieldAlert, Database } from 'lucide-react';
import { View } from '../types';

const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, leads } = useCRM();

  const leadsWithAttention = leads.filter(l => l.requiresAttention).length;

  const NavItem = ({ view, icon: Icon, label, badge }: { view: View; icon: any; label: string, badge?: number }) => {
    const isActive = currentView === view;
    // Specific logic for attention seeking on Chat tab
    const isAlerting = view === 'chat' && badge && badge > 0;

    let btnClass = "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all mb-1 group ";
    
    if (isAlerting) {
        btnClass += "bg-red-50 text-red-600 shadow-md border border-red-200 animate-pulse";
    } else if (isActive) {
        btnClass += "bg-emerald-600 text-white shadow-md";
    } else {
        btnClass += "text-gray-600 hover:bg-gray-100";
    }

    return (
      <button
        onClick={() => setCurrentView(view)}
        className={btnClass}
      >
        <div className="flex items-center gap-3">
          <Icon size={20} className={isAlerting ? 'text-red-600' : (badge && !isActive ? 'text-red-500' : '')} />
          <span className="font-medium">{label}</span>
        </div>
        {badge && badge > 0 && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isAlerting ? 'bg-red-600 text-white' : 'bg-red-500 text-white animate-bounce'}`}>
              {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200 flex flex-col fixed left-0 top-0 z-20">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2 text-emerald-600">
          <Building2 size={32} />
          <h1 className="text-xl font-bold tracking-tight">ConstrutoraGPT</h1>
        </div>
        <p className="text-xs text-gray-400 mt-1">CRM Inteligente</p>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
        <NavItem view="pipeline" icon={Kanban} label="Pipeline de Vendas" />
        <NavItem view="leads" icon={Users} label="Gestão de Leads" badge={leadsWithAttention > 0 ? leadsWithAttention : undefined} />
        <NavItem view="chat" icon={MessageSquare} label="Atendimento IA" badge={leadsWithAttention > 0 ? leadsWithAttention : undefined} />
        <NavItem view="properties" icon={Building2} label="Imóveis" />
        <NavItem view="training" icon={Brain} label="Instruções IA" />
        <NavItem view="blacklist" icon={ShieldAlert} label="Blacklist" />
        <NavItem view="sandbox" icon={FlaskConical} label="Simulador IA" />
        <div className="my-2 border-t border-gray-100"></div>
        <NavItem view="data-management" icon={Database} label="Backup & Dados" />
        <NavItem view="settings" icon={Settings} label="Configurações" />
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <LogOut size={20} />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;