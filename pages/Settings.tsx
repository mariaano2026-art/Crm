
import React, { useState, useEffect, useRef } from 'react';
import { useCRM } from '../context/CRMContext';
import { MessageSquare, Key, Server, CheckCircle, AlertCircle, Copy, ExternalLink, Zap, QrCode, Wifi, Eye, EyeOff, Save, Trash2, RefreshCw, Brain, CloudLightning, FileJson, Info, Smartphone, Printer, Hash, Loader2, XCircle, Link, Globe } from 'lucide-react';

const Settings: React.FC = () => {
  const { whatsappStatus, setWhatsappStatus, updateApiKey, isAiReady, properties, systemInstruction, blacklist, whatsappConfig, setWhatsappConfig } = useCRM();
  
  const [connectionMethod, setConnectionMethod] = useState<'api' | 'uazapi' | 'vercel'>('uazapi'); // Default to Uazapi now
  
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const [configJson, setConfigJson] = useState('');

  // Form synced with Context
  const [formData, setFormData] = useState({
    provider: whatsappConfig.provider || 'uazapi',
    accessToken: whatsappConfig.accessToken,
    phoneNumberId: whatsappConfig.phoneNumberId,
    wabaId: whatsappConfig.wabaId,
    uazapiBaseUrl: whatsappConfig.uazapiBaseUrl,
    uazapiKey: whatsappConfig.uazapiKey,
    uazapiInstance: whatsappConfig.uazapiInstance
  });

  // Uazapi QR State
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);

  useEffect(() => {
      const stored = localStorage.getItem('crm_gemini_api_key');
      if (stored) setApiKeyInput(stored);
      
      setFormData({
          provider: whatsappConfig.provider || 'uazapi',
          accessToken: whatsappConfig.accessToken,
          phoneNumberId: whatsappConfig.phoneNumberId,
          wabaId: whatsappConfig.wabaId,
          uazapiBaseUrl: whatsappConfig.uazapiBaseUrl,
          uazapiKey: whatsappConfig.uazapiKey,
          uazapiInstance: whatsappConfig.uazapiInstance
      });
      
      if (whatsappConfig.provider === 'meta') setConnectionMethod('api');
      else if (whatsappConfig.provider === 'uazapi') setConnectionMethod('uazapi');
  }, [whatsappConfig]);

  const generateConfigJson = () => {
      const config = {
          systemInstruction: systemInstruction,
          properties: properties.map(p => ({
              id: p.id,
              name: p.name,
              address: p.address,
              price: p.price,
              status: p.status,
              specs: p.specs,
              description: p.description,
              units: p.units ? p.units.map(u => ({
                  name: u.name,
                  price: u.price,
                  bedrooms: u.bedrooms,
                  size: u.size
              })) : []
          })),
          blacklist: blacklist
      };
      setConfigJson(JSON.stringify(config));
  };

  const handleSaveApiKey = () => {
      updateApiKey(apiKeyInput);
      alert("Chave API Salva!");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveConfig = () => {
      const newConfig = { ...formData, provider: connectionMethod === 'uazapi' ? 'uazapi' : 'meta' };
      setWhatsappConfig(newConfig as any);
      alert("Configurações salvas!");
  };

  const fetchUazapiQR = async () => {
      if (!formData.uazapiBaseUrl || !formData.uazapiKey || !formData.uazapiInstance) {
          alert("Preencha URL, API Key e Instância primeiro.");
          return;
      }
      
      setIsLoadingQr(true);
      setQrCodeBase64(null);

      try {
          const baseUrl = formData.uazapiBaseUrl.replace(/\/$/, '');
          const url = `${baseUrl}/instance/connect/${formData.uazapiInstance}`;
          
          const response = await fetch(url, {
              headers: { 'apikey': formData.uazapiKey }
          });
          
          const data = await response.json();
          
          if (data && data.base64) {
              setQrCodeBase64(data.base64);
          } else if (data && data.qrcode && data.qrcode.base64) {
               setQrCodeBase64(data.qrcode.base64);
          } else {
              alert("Não foi possível obter o QR Code. Verifique se a instância existe ou já está conectada.");
          }
      } catch (error) {
          console.error("Erro ao buscar QR:", error);
          alert("Erro ao conectar com a API Uazapi. Verifique a URL.");
      } finally {
          setIsLoadingQr(false);
      }
  };

  const CopyField = ({ label, value }: { label: string, value: string }) => (
    <div className="mb-4">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{label}</label>
        <div className="flex">
            <code className="flex-1 bg-gray-100 border border-gray-200 rounded-l-lg px-3 py-2 text-xs font-mono text-gray-600 overflow-hidden truncate">
                {value}
            </code>
            <button 
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-3 py-2 rounded-r-lg border border-l-0 border-gray-200 font-bold text-xs"
                onClick={() => {
                    navigator.clipboard.writeText(value);
                    alert("Copiado!");
                }}
            >
                COPIAR
            </button>
        </div>
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700">
                    <MessageSquare size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Configurações do Sistema</h2>
                    <p className="text-sm text-gray-500">Gerencie as conexões com WhatsApp e Inteligência Artificial.</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-6">
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Zap size={20} className="text-amber-500" />
                        Status dos Serviços
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`p-4 rounded-lg border ${whatsappStatus === 'connected' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 font-medium text-gray-800">
                                    <MessageSquare size={18} /> WhatsApp
                                </div>
                                {whatsappStatus === 'connected' 
                                    ? <CheckCircle size={18} className="text-green-600" />
                                    : <AlertCircle size={18} className="text-red-600" />
                                }
                            </div>
                            <p className={`text-xs ${whatsappStatus === 'connected' ? 'text-green-700' : 'text-red-700'}`}>
                                {whatsappStatus === 'connected' ? `Conectado via ${whatsappConfig.provider === 'uazapi' ? 'Uazapi' : 'Meta'}.` : 'Desconectado.'}
                            </p>
                        </div>

                        <div className={`p-4 rounded-lg border ${isAiReady ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 font-medium text-gray-800">
                                    <Brain size={18} /> Inteligência Artificial
                                </div>
                                {isAiReady 
                                    ? <CheckCircle size={18} className="text-green-600" />
                                    : <AlertCircle size={18} className="text-orange-600" />
                                }
                            </div>
                            <p className={`text-xs ${isAiReady ? 'text-green-700' : 'text-orange-800'}`}>
                                {isAiReady ? 'API Key detectada. IA pronta.' : 'API Key ausente.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="border-b border-gray-100 overflow-x-auto">
                        <div className="flex">
                            <button 
                                onClick={() => setConnectionMethod('uazapi')}
                                className={`px-4 md:px-6 py-4 text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${connectionMethod === 'uazapi' ? 'border-b-2 border-emerald-500 text-emerald-700 bg-emerald-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <Globe size={18} />
                                API Não Oficial (Uazapi)
                            </button>
                             <button 
                                onClick={() => setConnectionMethod('vercel')}
                                className={`px-4 md:px-6 py-4 text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${connectionMethod === 'vercel' ? 'border-b-2 border-emerald-500 text-emerald-700 bg-emerald-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <CloudLightning size={18} />
                                Integração Vercel
                            </button>
                            <button 
                                onClick={() => setConnectionMethod('api')}
                                className={`px-4 md:px-6 py-4 text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${connectionMethod === 'api' ? 'border-b-2 border-emerald-500 text-emerald-700 bg-emerald-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <Server size={18} />
                                API Oficial (Meta)
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        
                        {/* UAZAPI CONFIGURATION */}
                        {connectionMethod === 'uazapi' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                    <h3 className="font-bold text-blue-800 flex items-center gap-2 text-sm">
                                        <QrCode size={16} /> Conexão via QR Code (Uazapi/Evolution)
                                    </h3>
                                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                                        Use esta opção se você possui a Uazapi ou Evolution API rodando em um servidor. Isso permite conectar seu número atual via QR Code e usar o Vercel para as respostas da IA.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">URL da API</label>
                                        <input 
                                            type="text" 
                                            name="uazapiBaseUrl"
                                            value={formData.uazapiBaseUrl || ''}
                                            onChange={handleChange}
                                            placeholder="Ex: https://api.seudominio.com"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">API Key (Global)</label>
                                        <input 
                                            type="password" 
                                            name="uazapiKey"
                                            value={formData.uazapiKey || ''}
                                            onChange={handleChange}
                                            placeholder="Sua chave de segurança da API..."
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Instância</label>
                                        <input 
                                            type="text" 
                                            name="uazapiInstance"
                                            value={formData.uazapiInstance || ''}
                                            onChange={handleChange}
                                            placeholder="Ex: MinhaInstancia"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                    <button 
                                        onClick={fetchUazapiQR}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 flex items-center gap-2"
                                    >
                                        {isLoadingQr ? <Loader2 size={16} className="animate-spin"/> : <QrCode size={16}/>}
                                        Ler QR Code
                                    </button>
                                    <button 
                                        onClick={handleSaveConfig}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2"
                                    >
                                        <Save size={18} /> Salvar Configuração
                                    </button>
                                </div>

                                {qrCodeBase64 && (
                                    <div className="flex justify-center py-4 bg-white border border-gray-200 rounded-xl shadow-inner animate-fadeIn">
                                        <div className="text-center">
                                            <img src={qrCodeBase64} alt="QR Code" className="w-64 h-64 mx-auto mb-2" />
                                            <p className="text-xs text-gray-500">Escaneie com seu WhatsApp</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {connectionMethod === 'vercel' && (
                            <div className="animate-fadeIn space-y-6">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <h4 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-2">
                                        <CloudLightning size={16} /> Automação 24h
                                    </h4>
                                    <p className="text-sm text-blue-700 mb-2">
                                        Configure o Webhook no painel da sua Uazapi/Evolution para que as mensagens cheguem ao Vercel.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2"><CheckCircle size={16} className="text-emerald-600"/> URL do Webhook</h4>
                                        <CopyField 
                                            label="Cole isto na sua Instância Uazapi:" 
                                            value={`https://${window.location.hostname}/api/webhook`} 
                                        />
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2"><CheckCircle size={16} className="text-emerald-600"/> Variáveis de Ambiente no Vercel</h4>
                                        <div className="bg-gray-50 p-3 rounded text-xs font-mono text-gray-600 border border-gray-200 space-y-1">
                                            <p>API_KEY (Gemini)</p>
                                            <p>UAZAPI_URL</p>
                                            <p>UAZAPI_KEY</p>
                                            <p>UAZAPI_INSTANCE</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 pt-4">
                                        <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2"><FileJson size={16} className="text-emerald-600"/> Sincronizar Cérebro da IA</h4>
                                        
                                        {!configJson ? (
                                            <button 
                                                onClick={generateConfigJson}
                                                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition shadow-sm flex items-center justify-center gap-2"
                                            >
                                                <RefreshCw size={16} /> Gerar Código
                                            </button>
                                        ) : (
                                            <div className="animate-fadeIn">
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Copie para CRM_CONFIG_JSON no Vercel:</label>
                                                <textarea 
                                                    readOnly
                                                    className="w-full h-32 p-2 bg-gray-800 text-green-400 font-mono text-[10px] rounded border border-gray-700 resize-none focus:outline-none"
                                                    value={configJson}
                                                />
                                                <button 
                                                    onClick={() => { navigator.clipboard.writeText(configJson); alert("Copiado!"); }}
                                                    className="mt-2 w-full py-2 bg-emerald-600 text-white rounded font-bold text-xs hover:bg-emerald-700 transition"
                                                >
                                                    Copiar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {connectionMethod === 'api' && (
                            <div className="space-y-4 animate-fadeIn">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Token de Acesso (Meta)</label>
                                    <input 
                                        type="password" 
                                        name="accessToken"
                                        value={formData.accessToken || ''}
                                        onChange={handleChange}
                                        placeholder="EAAG..."
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone ID</label>
                                        <input 
                                            type="text" 
                                            name="phoneNumberId"
                                            value={formData.phoneNumberId || ''}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">WABA ID</label>
                                        <input 
                                            type="text" 
                                            name="wabaId"
                                            value={formData.wabaId || ''}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <button onClick={handleSaveConfig} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold transition-colors">
                                        Salvar Meta API
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                 <div className="bg-indigo-50 rounded-xl shadow-sm border border-indigo-100 p-6">
                    <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2"><Key size={18} /> Configuração da API Key</h3>
                    <div className="bg-white p-4 rounded-lg border border-indigo-200 mb-4 shadow-sm">
                        <h4 className="text-xs font-bold text-indigo-800 uppercase mb-2 flex items-center gap-1"><Info size={12} /> Onde pegar a chave?</h4>
                        <p className="text-xs text-indigo-700 mb-3 leading-relaxed">Você precisa de uma chave gratuita do Google Gemini.</p>
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors">
                            Gerar Chave API no Google AI Studio <ExternalLink size={12} />
                        </a>
                    </div>
                    <div className="space-y-3">
                         <div className="relative">
                             <input 
                                type={showApiKey ? "text" : "password"}
                                className="w-full pr-10 pl-3 py-2 rounded border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                placeholder="AIzaSy..."
                                value={apiKeyInput}
                                onChange={(e) => setApiKeyInput(e.target.value)}
                             />
                             <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600">{showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                         </div>
                         <button onClick={handleSaveApiKey} className="w-full bg-indigo-600 text-white py-2 rounded text-sm font-bold hover:bg-indigo-700 flex items-center justify-center gap-2"><Save size={16} /> Salvar Chave</button>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;