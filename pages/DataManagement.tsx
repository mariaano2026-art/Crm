
import React, { useRef } from 'react';
import { useCRM } from '../context/CRMContext';
import { Database, Download, Upload, FileJson, Shield, AlertTriangle, Trash2, CheckCircle } from 'lucide-react';

const DataManagement: React.FC = () => {
  const { exportData, importData, exportProperties, importProperties, clearAllData } = useCRM();
  
  const fullBackupInputRef = useRef<HTMLInputElement>(null);
  const propertiesInputRef = useRef<HTMLInputElement>(null);

  const handleFullImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const content = event.target?.result as string;
              if (importData(content)) {
                  alert("Backup completo restaurado com sucesso!");
              } else {
                  alert("Erro ao restaurar arquivo. Verifique se é um backup válido.");
              }
          };
          reader.readAsText(file);
      }
      e.target.value = '';
  };

  const handlePropertiesImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const content = event.target?.result as string;
              if (importProperties(content)) {
                  alert("Lista de imóveis importada com sucesso!");
              } else {
                  alert("Erro ao importar imóveis. Verifique o formato do arquivo.");
              }
          };
          reader.readAsText(file);
      }
      e.target.value = '';
  };

  const handleResetAll = () => {
      if (confirm("⚠️ PERIGO: Tem certeza que deseja APAGAR TODOS OS DADOS?\n\nIsso removerá:\n- Todos os Imóveis\n- Todos os Leads e Conversas\n- Configurações da IA\n\nEsta ação não pode ser desfeita.")) {
          clearAllData();
      }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700">
                <Database size={28} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Central de Dados e Backup</h2>
                <p className="text-sm text-gray-500">Salve suas informações ou carregue dados de outro dispositivo.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CARD 1: FULL SYSTEM BACKUP */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                            <Shield size={24} />
                        </div>
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-1 rounded uppercase">Recomendado</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Backup Completo do Sistema</h3>
                    <p className="text-sm text-gray-500 mb-6 min-h-[40px]">
                        Salva <strong>TUDO</strong> o que você configurou:
                        <ul className="list-disc pl-4 mt-2 space-y-1 text-xs">
                            <li>Diretrizes da IA e Prompts de Treinamento</li>
                            <li>Personalidade e Configurações de Voz</li>
                            <li>Imóveis, Leads e Histórico de Conversas</li>
                            <li>Blacklist e Regras de Follow-up</li>
                        </ul>
                    </p>

                    <div className="space-y-3">
                        <button 
                            onClick={exportData}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                            <Download size={18} /> Baixar Backup Completo
                        </button>
                        
                        <div className="relative">
                             <input 
                                type="file" 
                                ref={fullBackupInputRef}
                                className="hidden"
                                accept=".json"
                                onChange={handleFullImport}
                             />
                             <button 
                                onClick={() => fullBackupInputRef.current?.click()}
                                className="w-full bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                             >
                                <Upload size={18} /> Restaurar Backup
                             </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* CARD 2: PROPERTIES ONLY */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-emerald-50 p-3 rounded-full text-emerald-600">
                            <FileJson size={24} />
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Apenas Imóveis (Inventário)</h3>
                    <p className="text-sm text-gray-500 mb-6 min-h-[40px]">
                        Salva apenas a lista de imóveis e fotos. Útil para compartilhar seu catálogo com outros corretores ou atualizar apenas o estoque.
                    </p>

                    <div className="space-y-3">
                        <button 
                            onClick={exportProperties}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                            <Download size={18} /> Baixar Lista de Imóveis
                        </button>
                        
                        <div className="relative">
                             <input 
                                type="file" 
                                ref={propertiesInputRef}
                                className="hidden"
                                accept=".json"
                                onChange={handlePropertiesImport}
                             />
                             <button 
                                onClick={() => propertiesInputRef.current?.click()}
                                className="w-full bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                             >
                                <Upload size={18} /> Importar Lista
                             </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        {/* DANGER ZONE */}
        <div className="mt-10 border-t border-gray-200 pt-8">
            <div className="bg-red-50 border border-red-100 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="bg-white p-3 rounded-full text-red-500 shadow-sm">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-red-800">Zona de Perigo</h3>
                        <p className="text-sm text-red-600 max-w-lg">
                            Esta ação apaga todos os dados armazenados no navegador e restaura o sistema para o estado inicial. Use apenas se necessário.
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handleResetAll}
                    className="whitespace-nowrap bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-2 shadow-sm"
                >
                    <Trash2 size={18} /> Resetar Fábrica
                </button>
            </div>
        </div>

        <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
                <CheckCircle size={12} /> Seus dados são salvos automaticamente no navegador enquanto você usa o sistema.
            </p>
        </div>

      </div>
    </div>
  );
};

export default DataManagement;
