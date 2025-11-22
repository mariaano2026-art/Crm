import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Search, Filter, MessageCircle } from 'lucide-react';
import { LeadStatus } from '../types';

const Leads: React.FC = () => {
  const { leads, setCurrentView, setSelectedLeadId } = useCRM();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleChatOpen = (id: string) => {
    setSelectedLeadId(id);
    setCurrentView('chat');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case LeadStatus.HOT: return 'bg-emerald-100 text-emerald-700';
      case LeadStatus.WARM: return 'bg-amber-100 text-amber-700';
      case LeadStatus.COLD: return 'bg-red-100 text-red-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Gestão de Leads</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar nome ou telefone..."
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos os Status</option>
            <option value={LeadStatus.HOT}>{LeadStatus.HOT}</option>
            <option value={LeadStatus.WARM}>{LeadStatus.WARM}</option>
            <option value={LeadStatus.COLD}>{LeadStatus.COLD}</option>
            <option value={LeadStatus.NEW}>{LeadStatus.NEW}</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-500">Nome</th>
              <th className="px-6 py-4 font-medium text-gray-500">Telefone</th>
              <th className="px-6 py-4 font-medium text-gray-500">Status</th>
              <th className="px-6 py-4 font-medium text-gray-500">Último Contato</th>
              <th className="px-6 py-4 font-medium text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredLeads.map(lead => (
              <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{lead.name}</div>
                  <div className="text-xs text-gray-400">ID: {lead.id}</div>
                </td>
                <td className="px-6 py-4 text-gray-600">{lead.phone}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">
                  {new Date(lead.lastContact).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleChatOpen(lead.id)}
                    className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                  >
                    <MessageCircle size={18} />
                    Abrir Chat
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredLeads.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Nenhum lead encontrado.
          </div>
        )}
      </div>
    </div>
  );
};

export default Leads;