
import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Lead, LeadStatus } from '../types';
import { MessageSquare, Phone, Clock, CalendarCheck, AlertCircle, Flame, Snowflake, ThermometerSun, PowerOff } from 'lucide-react';

const Pipeline: React.FC = () => {
  const { leads, updateLeadStatus, setSelectedLeadId, setCurrentView } = useCRM();
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  const columns = [
    { 
        status: LeadStatus.NEW, 
        label: 'Novos Leads', 
        color: 'border-blue-500', 
        bg: 'bg-blue-50',
        icon: AlertCircle
    },
    { 
        status: LeadStatus.COLD, 
        label: 'Frios / Em Espera', 
        color: 'border-cyan-500', 
        bg: 'bg-cyan-50',
        icon: Snowflake
    },
    { 
        status: LeadStatus.WARM, 
        label: 'Mornos / Negociação', 
        color: 'border-amber-500', 
        bg: 'bg-amber-50',
        icon: ThermometerSun
    },
    { 
        status: LeadStatus.HOT, 
        label: 'Quentes', 
        color: 'border-orange-500', 
        bg: 'bg-orange-50',
        icon: Flame
    },
    { 
        status: LeadStatus.SCHEDULED, 
        label: 'Visita Agendada', 
        color: 'border-emerald-500', 
        bg: 'bg-emerald-50',
        icon: CalendarCheck
    },
    {
        status: LeadStatus.NO_AI,
        label: 'IA Desligada (Blacklist)',
        color: 'border-gray-600',
        bg: 'bg-gray-200',
        icon: PowerOff
    }
  ];

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = 'move';
    // Optional: Set drag image or ghost
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    if (draggedLeadId) {
      updateLeadStatus(draggedLeadId, status);
      setDraggedLeadId(null);
    }
  };

  const openChat = (id: string) => {
      setSelectedLeadId(id);
      setCurrentView('chat');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <div className="px-8 py-6 flex justify-between items-center bg-white border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">Pipeline de Vendas</h2>
        <div className="text-sm text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            A IA move os cards automaticamente, mas você também pode arrastar.
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-8">
        <div className="flex gap-6 h-full min-w-max">
          {columns.map((col) => {
            const columnLeads = leads.filter(l => l.status === col.status);
            const Icon = col.icon;
            const isBlacklistCol = col.status === LeadStatus.NO_AI;

            return (
              <div 
                key={col.status}
                className={`w-80 flex flex-col rounded-xl border-t-4 ${col.color} shadow-sm max-h-full transition-colors ${draggedLeadId ? 'bg-opacity-70 border-dashed' : ''} ${isBlacklistCol ? 'bg-gray-100' : 'bg-gray-50'}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.status)}
              >
                {/* Column Header */}
                <div className={`p-4 border-b border-gray-200/50 flex justify-between items-center ${col.bg}`}>
                  <div className="flex items-center gap-2 font-bold text-gray-700">
                    <Icon size={18} className={isBlacklistCol ? "text-gray-800" : "opacity-70"} />
                    {col.label}
                  </div>
                  <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-gray-500 shadow-sm">
                    {columnLeads.length}
                  </span>
                </div>

                {/* Cards Area */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                    {isBlacklistCol && columnLeads.length === 0 && (
                         <div className="p-4 text-center text-xs text-gray-500 italic bg-gray-50 border border-dashed border-gray-300 rounded mb-2">
                             Arraste leads para cá para desligar a IA e bloquear o número.
                         </div>
                    )}

                    {columnLeads.map((lead) => (
                        <div
                            key={lead.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, lead.id)}
                            className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-all relative group ${lead.requiresAttention ? 'ring-2 ring-red-400 ring-offset-1' : ''}`}
                            onClick={() => openChat(lead.id)} // Click to open chat
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-gray-800 text-sm">{lead.name}</h4>
                                {lead.requiresAttention && (
                                    <span className="text-red-500 animate-pulse" title="Requer Atenção">
                                        <AlertCircle size={16} />
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                                <Phone size={12} />
                                {lead.phone}
                            </div>

                            <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded mb-3 line-clamp-2 border border-gray-100 italic">
                                "{lead.messages[lead.messages.length - 1]?.text || '...'}"
                            </p>

                            <div className="flex justify-between items-center border-t border-gray-50 pt-2">
                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <Clock size={12} />
                                    {new Date(lead.lastContact).toLocaleDateString('pt-BR')}
                                </div>
                                <button 
                                    className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-full transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openChat(lead.id);
                                    }}
                                >
                                    <MessageSquare size={16} />
                                </button>
                            </div>
                            
                            {/* Drag Handle Visual Hint */}
                            <div className="absolute top-0 left-0 w-full h-1 rounded-t-lg opacity-0 group-hover:opacity-100 bg-gray-200/50 transition-opacity" />
                        </div>
                    ))}
                    {!isBlacklistCol && columnLeads.length === 0 && (
                        <div className="text-center py-10 text-gray-400 text-xs italic border-2 border-dashed border-gray-200 rounded-lg">
                            Arraste leads para cá
                        </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Pipeline;