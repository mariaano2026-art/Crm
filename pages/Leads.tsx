

import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Search, MessageCircle, UserPlus, X, Check, Briefcase } from 'lucide-react';
import { LeadStatus } from '../types';

const Leads: React.FC = () => {
  const { leads, setCurrentView, setSelectedLeadId, addLead, properties } = useCRM();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadInterest, setNewLeadInterest] = useState('');

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

  const handleAddLead = (e: React.FormEvent) => {
      e.preventDefault();
      if(newLeadName && newLeadPhone) {
          addLead(newLeadName, newLeadPhone, newLeadInterest || undefined);
          setIsModalOpen(false);
          setNewLeadName('');
          setNewLeadPhone('');
          setNewLeadInterest('');
      }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case LeadStatus.HOT: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case LeadStatus.WARM: return 'bg-amber-100 text-amber-700 border-amber-200';
      case LeadStatus.COLD: return 'bg-red-100 text-red-700 border-red-200';
      case LeadStatus.NO_AI: return 'bg-gray-200 text-gray-600 border-gray-300';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen relative">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Gestão de Leads</h2>
            <p className="text-sm text-gray-500">Visualize e gerencie todos os contatos em um só lugar.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar nome ou telefone..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm text-gray-700"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos os Status</option>
            <option value={LeadStatus.HOT}>{LeadStatus.HOT}</option>
            <option value={LeadStatus.WARM}>{LeadStatus.WARM}</option>
            <option value={LeadStatus.COLD}>{LeadStatus.COLD}</option>
            <option value={LeadStatus.NEW}>{LeadStatus.NEW}</option>
            <option value={LeadStatus.NO_AI}>{LeadStatus.NO_AI}</option>
          </select>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium shadow-sm transition-colors"
          >
              <UserPlus size={20} />
              <span className="hidden sm:inline">Novo Lead</span>
              <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Telefone</th>
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider hidden md:table-cell">Último Contato</th>
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {filteredLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{lead.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{lead.id}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm font-mono">{lead.phone}</td>
                    <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(lead.status)}`}>
                        {lead.status}
                    </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm hidden md:table-cell">
                    {new Date(lead.lastContact).toLocaleDateString('pt-BR')} <span className="text-xs opacity-50">{new Date(lead.lastContact).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="px-6 py-4">
                    <button
                        onClick={() => handleChatOpen(lead.id)}
                        className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-600 hover:text-white font-medium text-sm transition-all"
                    >
                        <MessageCircle size={16} />
                        <span className="hidden sm:inline">Conversar</span>
                    </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        {filteredLeads.length === 0 && (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Search size={24} className="opacity-20" />
            </div>
            <p>Nenhum lead encontrado com os filtros atuais.</p>
          </div>
        )}
      </div>

      {/* ADD LEAD MODAL */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <UserPlus size={20} className="text-emerald-600"/> Novo Lead Manual
                      </h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                          <X size={20} />
                      </button>
                  </div>
                  <form onSubmit={handleAddLead} className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo *</label>
                          <input 
                              required
                              type="text" 
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                              placeholder="Ex: João da Silva"
                              value={newLeadName}
                              onChange={e => setNewLeadName(e.target.value)}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp / Telefone *</label>
                          <input 
                              required
                              type="text" 
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                              placeholder="Ex: +55 11 99999-9999"
                              value={newLeadPhone}
                              onChange={e => setNewLeadPhone(e.target.value)}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Interesse Inicial (Opcional)</label>
                          <div className="relative">
                              <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                              <select 
                                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-white appearance-none"
                                  value={newLeadInterest}
                                  onChange={e => setNewLeadInterest(e.target.value)}
                              >
                                  <option value="">Interesse Geral / Não sei</option>
                                  {properties.map(p => (
                                      <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                                  ))}
                              </select>
                          </div>
                      </div>

                      <div className="pt-4 flex gap-3">
                          <button 
                              type="button" 
                              onClick={() => setIsModalOpen(false)}
                              className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition"
                          >
                              Cancelar
                          </button>
                          <button 
                              type="submit" 
                              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition shadow-md flex items-center justify-center gap-2"
                          >
                              <Check size={18} /> Cadastrar
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Leads;