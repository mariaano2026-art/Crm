
import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Tag, Phone, Clock, MessageSquare, AlertCircle, Plus, LayoutGrid, Palette } from 'lucide-react';

const TagsPipeline: React.FC = () => {
  const { leads, tags, assignTagToLead, removeTagFromLead, setSelectedLeadId, setCurrentView, addTag } = useCRM();
  const [draggedItem, setDraggedItem] = useState<{ leadId: string, sourceTagId: string | 'no-tag' } | null>(null);
  
  // Modal State for New Tag
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');

  // Helpers
  const handleDragStart = (e: React.DragEvent, leadId: string, sourceTagId: string | 'no-tag') => {
    setDraggedItem({ leadId, sourceTagId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTagId: string | 'no-tag') => {
    e.preventDefault();
    if (draggedItem && draggedItem.leadId) {
        // Prevent unnecessary updates
        if (draggedItem.sourceTagId === targetTagId) {
            setDraggedItem(null);
            return;
        }

        // Logic: 
        // 1. If coming from 'no-tag' to a tag -> Just Add Tag
        // 2. If coming from Tag A to 'no-tag' -> Remove Tag A
        // 3. If coming from Tag A to Tag B -> Remove Tag A AND Add Tag B (Move behavior)

        if (draggedItem.sourceTagId !== 'no-tag') {
            removeTagFromLead(draggedItem.leadId, draggedItem.sourceTagId);
        }

        if (targetTagId !== 'no-tag') {
            assignTagToLead(draggedItem.leadId, targetTagId);
        }
        
        setDraggedItem(null);
    }
  };

  const openChat = (id: string) => {
      setSelectedLeadId(id);
      setCurrentView('chat');
  };

  const handleCreateTag = () => {
    if(newTagName.trim()) {
        addTag(newTagName, newTagColor);
        setNewTagName('');
        setIsModalOpen(false);
    }
  };

  const PRESET_TAG_COLORS = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280', '#000000'
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <div className="px-8 py-6 flex justify-between items-center bg-white border-b border-gray-200">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Tag size={24} className="text-emerald-600"/> Pipeline de Etiquetas
            </h2>
            <p className="text-sm text-gray-500">Visualize seus contatos organizados pelas etiquetas do WhatsApp Business.</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-gray-900 transition-colors"
        >
            <Plus size={16} /> Nova Etiqueta
        </button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-8">
        <div className="flex gap-6 h-full min-w-max">
            
            {/* COLUMN: NO TAGS (UNLABELED) */}
            <div 
                className={`w-80 flex flex-col rounded-xl border-t-4 border-gray-300 shadow-sm max-h-full transition-colors bg-gray-50 ${draggedItem ? 'bg-opacity-80 border-dashed' : ''}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'no-tag')}
            >
                <div className="p-4 border-b border-gray-200/50 flex justify-between items-center bg-gray-100/50">
                    <div className="flex items-center gap-2 font-bold text-gray-600">
                        <LayoutGrid size={18} /> Sem Etiqueta
                    </div>
                    <span className="bg-gray-200 px-2 py-0.5 rounded-full text-xs font-bold text-gray-600">
                        {leads.filter(l => !l.tags || l.tags.length === 0).length}
                    </span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                    {leads.filter(l => !l.tags || l.tags.length === 0).map(lead => (
                        <div
                            key={lead.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, lead.id, 'no-tag')}
                            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group"
                            onClick={() => openChat(lead.id)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-gray-800 text-sm">{lead.name}</h4>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                                <Phone size={12} /> {lead.phone}
                            </div>
                            <div className="flex justify-between items-center border-t border-gray-50 pt-2">
                                <div className="flex items-center gap-1 text-[10px] text-gray-400"><Clock size={12}/> {new Date(lead.lastContact).toLocaleDateString()}</div>
                                <button className="text-emerald-600 p-1 rounded hover:bg-emerald-50"><MessageSquare size={16}/></button>
                            </div>
                        </div>
                    ))}
                    {leads.filter(l => !l.tags || l.tags.length === 0).length === 0 && (
                        <div className="text-center py-10 text-gray-400 text-xs italic border-2 border-dashed border-gray-200 rounded-lg">Lista vazia</div>
                    )}
                </div>
            </div>

            {/* DYNAMIC COLUMNS BASED ON TAGS */}
            {tags.map((tag) => {
                const columnLeads = leads.filter(l => l.tags && l.tags.includes(tag.id));
                
                return (
                    <div 
                        key={tag.id}
                        className={`w-80 flex flex-col rounded-xl border-t-4 shadow-sm max-h-full transition-colors bg-gray-50 ${draggedItem ? 'bg-opacity-80 border-dashed' : ''}`}
                        style={{ borderTopColor: tag.color }}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, tag.id)}
                    >
                        <div className="p-4 border-b border-gray-200/50 flex justify-between items-center" style={{backgroundColor: `${tag.color}10`}}>
                            <div className="flex items-center gap-2 font-bold text-gray-700">
                                <span className="w-3 h-3 rounded-full" style={{backgroundColor: tag.color}}></span>
                                {tag.name}
                            </div>
                            <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-gray-500 shadow-sm">
                                {columnLeads.length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                            {columnLeads.map((lead) => (
                                <div
                                    key={`${lead.id}-${tag.id}`} // Unique key for lead in this column
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, lead.id, tag.id)}
                                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-all relative group"
                                    onClick={() => openChat(lead.id)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-gray-800 text-sm">{lead.name}</h4>
                                        {lead.requiresAttention && <span className="text-red-500 animate-pulse"><AlertCircle size={16}/></span>}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-3"><Phone size={12}/> {lead.phone}</div>
                                    
                                    {/* Show other tags if exists */}
                                    {lead.tags && lead.tags.length > 1 && (
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {lead.tags.filter(tId => tId !== tag.id).map(tId => {
                                                const t = tags.find(x => x.id === tId);
                                                return t ? <span key={tId} className="w-2 h-2 rounded-full" style={{backgroundColor: t.color}} title={t.name}></span> : null;
                                            })}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center border-t border-gray-50 pt-2">
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400"><Clock size={12}/> {new Date(lead.lastContact).toLocaleDateString()}</div>
                                        <button className="text-emerald-600 p-1 rounded hover:bg-emerald-50"><MessageSquare size={16}/></button>
                                    </div>
                                </div>
                            ))}
                            {columnLeads.length === 0 && (
                                <div className="text-center py-10 text-gray-400 text-xs italic border-2 border-dashed border-gray-200 rounded-lg">Arraste para atribuir etiqueta</div>
                            )}
                        </div>
                    </div>
                );
            })}

        </div>
      </div>

       {/* CREATE TAG MODAL */}
       {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fadeIn">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2"><Tag size={20} className="text-emerald-600"/> Nova Etiqueta</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                  <div className="p-6">
                      <label className="block text-xs font-bold text-gray-700 mb-2">Nome</label>
                      <input className="w-full text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none mb-4" placeholder="Ex: Contrato Assinado" value={newTagName} onChange={e => setNewTagName(e.target.value)} />
                      
                      <label className="block text-xs font-bold text-gray-700 mb-2">Cor</label>
                      <div className="flex flex-wrap gap-2 mb-6">
                           {PRESET_TAG_COLORS.map(color => (
                               <button key={color} onClick={() => setNewTagColor(color)} className={`w-8 h-8 rounded-full border-2 transition-transform ${newTagColor === color ? 'border-gray-600 scale-110' : 'border-transparent'}`} style={{backgroundColor: color}} />
                           ))}
                           <div className="relative">
                               <input type="color" value={newTagColor} onChange={e => setNewTagColor(e.target.value)} className="w-8 h-8 p-0 border-0 rounded-full overflow-hidden opacity-0 absolute top-0 left-0 cursor-pointer" />
                               <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 bg-white"><Palette size={14} /></div>
                           </div>
                      </div>

                      <button onClick={handleCreateTag} disabled={!newTagName.trim()} className="w-full py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm">Criar Etiqueta</button>
                  </div>
              </div>
          </div>
       )}
    </div>
  );
};

export default TagsPipeline;