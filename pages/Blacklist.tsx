import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { ShieldAlert, Plus, Trash2, StopCircle } from 'lucide-react';

const Blacklist: React.FC = () => {
  const { blacklist, addToBlacklist, removeFromBlacklist } = useCRM();
  const [newBlacklistNumber, setNewBlacklistNumber] = useState('');

  const handleAddBlacklist = () => {
      if (newBlacklistNumber.trim()) {
          addToBlacklist(newBlacklistNumber.trim());
          setNewBlacklistNumber('');
      }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="bg-red-100 p-2 rounded-lg text-red-700">
                    <ShieldAlert size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Blacklist / Bloqueios</h2>
                    <p className="text-sm text-gray-500">Gerencie os números que não devem ser atendidos pela IA.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-red-600 text-white p-6 border-b border-red-700">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <ShieldAlert size={20} className="text-white" /> 
                        Bloqueio de Inteligência Artificial
                    </h3>
                    <p className="text-red-100 text-sm mt-1">
                        Números nesta lista nunca receberão respostas automáticas. 
                        <br/>
                        Ao adicionar um número, ele é movido automaticamente para a coluna "IA Desligada" no Pipeline.
                    </p>
                </div>

                <div className="p-6 bg-gray-50 border-b border-gray-200">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none text-gray-800 bg-white"
                            placeholder="Digite o número (Ex: +55 11 99999-9999)"
                            value={newBlacklistNumber}
                            onChange={(e) => setNewBlacklistNumber(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddBlacklist()}
                        />
                        <button 
                            onClick={handleAddBlacklist}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-2"
                        >
                            <Plus size={18} /> Adicionar
                        </button>
                    </div>
                </div>

                <div className="p-0">
                    {blacklist.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <ShieldAlert size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Nenhum número bloqueado atualmente.</p>
                            <p className="text-xs mt-2">Adicione um número acima ou arraste um card para a coluna "IA Desligada" no Pipeline.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto custom-scrollbar">
                            {blacklist.map((phone, idx) => (
                                <li key={idx} className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                                            <StopCircle size={16} />
                                        </div>
                                        <span className="font-mono text-gray-800 font-medium">{phone}</span>
                                    </div>
                                    <button 
                                        onClick={() => removeFromBlacklist(phone)}
                                        className="text-gray-400 hover:text-emerald-600 p-2 rounded-full hover:bg-emerald-50 transition-all group"
                                        title="Remover da Blacklist (Reativar IA)"
                                    >
                                        <Trash2 size={18} />
                                        <span className="hidden group-hover:inline ml-2 text-xs font-medium">Desbloquear</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="bg-gray-50 p-3 text-center text-xs text-gray-500 border-t border-gray-200">
                    Total de bloqueios: {blacklist.length}
                </div>
            </div>
        </div>
    </div>
  );
};

export default Blacklist;
