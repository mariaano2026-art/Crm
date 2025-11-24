
import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Megaphone, Users, Play, Pause, Square, Clock, CheckCircle, AlertCircle, Tag, Filter, MessageCircle, RefreshCw } from 'lucide-react';
import { Lead, LeadStatus, Tag as TagType } from '../types';

const BulkSender: React.FC = () => {
  const { leads, tags, bulkCampaign, initBulkCampaign, startBulkCampaign, pauseBulkCampaign, stopBulkCampaign } = useCRM();
  
  // Step 1: Audience
  const [filterType, setFilterType] = useState<'status' | 'tag'>('status');
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  
  // Step 2: Message
  const [messageTemplate, setMessageTemplate] = useState('');
  const [minDelay, setMinDelay] = useState(13);
  const [maxDelay, setMaxDelay] = useState(27);

  // Filter Logic
  const targetAudience = leads.filter(l => {
      // Exclude blocked/blacklist
      if (l.status === LeadStatus.NO_AI) return false;
      
      if (filterType === 'status') {
          return selectedStatus === 'all' ? true : l.status === selectedStatus;
      } else {
          return selectedTag === 'all' ? true : l.tags?.includes(selectedTag);
      }
  });

  const handleInit = () => {
      if (!messageTemplate.trim()) {
          alert("Digite uma mensagem.");
          return;
      }
      if (targetAudience.length === 0) {
          alert("Nenhum lead selecionado.");
          return;
      }
      initBulkCampaign(targetAudience, messageTemplate, { minDelay, maxDelay });
  };

  // Preview
  const previewMessage = messageTemplate.replace(/{nome}/gi, "João");

  if (bulkCampaign) {
      // --- MONITORING VIEW ---
      const progressPercent = Math.round((bulkCampaign.processedCount / bulkCampaign.totalCount) * 100);
      const isRunning = bulkCampaign.status === 'running';
      const isCompleted = bulkCampaign.status === 'completed';
      
      // Timer Countdown Logic (Visual Only)
      const now = Date.now();
      const timeLeft = bulkCampaign.nextRunTime ? Math.max(0, Math.ceil((bulkCampaign.nextRunTime - now) / 1000)) : 0;

      return (
          <div className="p-8 bg-gray-50 min-h-screen">
              <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                          <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700">
                              <Megaphone size={28} className="animate-pulse" />
                          </div>
                          <div>
                              <h2 className="text-2xl font-bold text-gray-800">Campanha em Andamento</h2>
                              <p className="text-sm text-gray-500">Monitoramento em tempo real.</p>
                          </div>
                      </div>
                      <div className="flex gap-3">
                          {!isCompleted && (
                              isRunning ? (
                                  <button onClick={pauseBulkCampaign} className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-bold transition">
                                      <Pause size={18} /> Pausar
                                  </button>
                              ) : (
                                  <button onClick={startBulkCampaign} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold transition">
                                      <Play size={18} /> Continuar
                                  </button>
                              )
                          )}
                          <button onClick={stopBulkCampaign} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold transition">
                              <Square size={18} /> {isCompleted ? 'Fechar' : 'Cancelar'}
                          </button>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                          <h3 className="text-gray-500 text-sm font-bold uppercase">Progresso</h3>
                          <div className="text-3xl font-bold text-emerald-600 mt-2">{bulkCampaign.processedCount} / {bulkCampaign.totalCount}</div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                              <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                          </div>
                      </div>
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                          <h3 className="text-gray-500 text-sm font-bold uppercase">Status</h3>
                          <div className={`text-2xl font-bold mt-2 flex items-center gap-2 ${isRunning ? 'text-green-600' : 'text-amber-600'}`}>
                              {isRunning ? <RefreshCw size={24} className="animate-spin" /> : <Pause size={24} />}
                              {bulkCampaign.status === 'running' ? 'Enviando...' : (isCompleted ? 'Concluído' : 'Pausado')}
                          </div>
                          {isRunning && bulkCampaign.nextRunTime && (
                              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                  <Clock size={12} /> Próximo envio em ~{timeLeft}s
                              </p>
                          )}
                      </div>
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                          <h3 className="text-gray-500 text-sm font-bold uppercase">Estimativa</h3>
                          <div className="text-xl font-bold text-gray-800 mt-2">
                              ~{Math.ceil((bulkCampaign.queue.length * ((minDelay + maxDelay) / 2)) / 60)} min
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Delay aleatório: {minDelay}s - {maxDelay}s</p>
                      </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                          <h3 className="font-bold text-gray-700">Log de Envios</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto custom-scrollbar p-0">
                          {bulkCampaign.logs.length === 0 ? (
                              <div className="p-8 text-center text-gray-400 text-sm">Aguardando início...</div>
                          ) : (
                              <table className="w-full text-sm text-left">
                                  <thead className="bg-gray-50 text-gray-500 font-medium">
                                      <tr>
                                          <th className="px-4 py-2">Nome</th>
                                          <th className="px-4 py-2">Telefone</th>
                                          <th className="px-4 py-2">Status</th>
                                          <th className="px-4 py-2">Hora</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {bulkCampaign.logs.map((log, idx) => (
                                          <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                                              <td className="px-4 py-3">{log.leadName}</td>
                                              <td className="px-4 py-3 font-mono text-xs">{log.phone}</td>
                                              <td className="px-4 py-3">
                                                  {log.status === 'sent' ? (
                                                      <span className="text-green-600 flex items-center gap-1 font-bold text-xs"><CheckCircle size={12}/> Enviado</span>
                                                  ) : (
                                                      <span className="text-red-600 flex items-center gap-1 font-bold text-xs" title={log.error}><AlertCircle size={12}/> Falha</span>
                                                  )}
                                              </td>
                                              <td className="px-4 py-3 text-gray-400 text-xs">
                                                  {log.timestamp?.toLocaleTimeString()}
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- CONFIGURATION VIEW ---
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700">
                <Megaphone size={28} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Disparo em Massa (Bulk Sender)</h2>
                <p className="text-sm text-gray-500">Envie mensagens para múltiplos contatos com segurança e humanização.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT: AUDIENCE */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Users size={18} className="text-emerald-600"/> 1. Selecionar Público</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Filtrar Por:</label>
                            <div className="flex bg-gray-100 p-1 rounded-lg mb-3">
                                <button onClick={() => setFilterType('status')} className={`flex-1 py-1.5 text-xs font-bold rounded transition ${filterType === 'status' ? 'bg-white shadow text-emerald-700' : 'text-gray-500'}`}>Status</button>
                                <button onClick={() => setFilterType('tag')} className={`flex-1 py-1.5 text-xs font-bold rounded transition ${filterType === 'tag' ? 'bg-white shadow text-emerald-700' : 'text-gray-500'}`}>Etiqueta</button>
                            </div>
                        </div>

                        {filterType === 'status' ? (
                            <select 
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value as any)}
                            >
                                <option value="all">Todos os Status</option>
                                <option value={LeadStatus.NEW}>{LeadStatus.NEW}</option>
                                <option value={LeadStatus.HOT}>{LeadStatus.HOT}</option>
                                <option value={LeadStatus.WARM}>{LeadStatus.WARM}</option>
                                <option value={LeadStatus.COLD}>{LeadStatus.COLD}</option>
                            </select>
                        ) : (
                            <select 
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
                                value={selectedTag}
                                onChange={(e) => setSelectedTag(e.target.value)}
                            >
                                <option value="all">Todas as Etiquetas</option>
                                {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        )}

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center justify-between">
                            <span className="text-sm text-blue-800 font-medium">Contatos Selecionados:</span>
                            <span className="text-xl font-bold text-blue-700">{targetAudience.length}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Clock size={18} className="text-emerald-600"/> 3. Segurança (Anti-Ban)</h3>
                    <p className="text-xs text-gray-500 mb-4">Intervalo aleatório entre mensagens para simular digitação humana.</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Mínimo (seg)</label>
                            <input type="number" className="w-full p-2 border border-gray-300 rounded text-center font-bold" value={minDelay} onChange={e => setMinDelay(Number(e.target.value))} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Máximo (seg)</label>
                            <input type="number" className="w-full p-2 border border-gray-300 rounded text-center font-bold" value={maxDelay} onChange={e => setMaxDelay(Number(e.target.value))} />
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: MESSAGE */}
            <div className="lg:col-span-2 flex flex-col">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><MessageCircle size={18} className="text-emerald-600"/> 2. Mensagem da Campanha</h3>
                    
                    <div className="mb-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 border border-gray-200 mr-2">Dica:</span>
                        <span className="text-xs text-gray-500">Use <strong>{'{nome}'}</strong> para substituir pelo primeiro nome do cliente.</span>
                    </div>

                    <textarea 
                        className="w-full flex-1 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 text-sm mb-4"
                        placeholder="Olá {nome}, tudo bem? Tenho uma novidade..."
                        value={messageTemplate}
                        onChange={e => setMessageTemplate(e.target.value)}
                    />

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Pré-visualização:</h4>
                        <p className="text-sm text-gray-800 italic">"{previewMessage}"</p>
                    </div>

                    <button 
                        onClick={handleInit}
                        disabled={targetAudience.length === 0 || !messageTemplate.trim()}
                        className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md flex items-center justify-center gap-2"
                    >
                        <Play size={24} /> Iniciar Campanha
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default BulkSender;