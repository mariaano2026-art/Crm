
import React, { useState, useEffect, useRef } from 'react';
import { useCRM } from '../context/CRMContext';
import { MessageSquare, Key, Server, CheckCircle, AlertCircle, Copy, ExternalLink, Zap, QrCode, Wifi, Eye, EyeOff, Save, Trash2, RefreshCw, Brain, CloudLightning, FileJson } from 'lucide-react';

const Settings: React.FC = () => {
  const { whatsappStatus, setWhatsappStatus, updateApiKey, isAiReady, properties, systemInstruction, blacklist } = useCRM();
  
  // Connection Method Toggle
  const [connectionMethod, setConnectionMethod] = useState<'api' | 'qrcode' | 'vercel'>('api');
  
  // API Key State
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // QR Code State
  const [qrStatus, setQrStatus] = useState<'idle' | 'generating' | 'ready' | 'expired'>('idle');
  
  // Config Export State
  const [configJson, setConfigJson] = useState('');

  // Mock state for form fields
  const [formData, setFormData] = useState({
    accessToken: '',
    phoneNumberId: '',
    wabaId: ''
  });

  const [isTesting, setIsTesting] = useState(false);
  
  useEffect(() => {
      // Load existing key from storage if available for the placeholder (don't show it fully)
      const stored = localStorage.getItem('crm_gemini_api_key');
      if (stored) {
          setApiKeyInput(stored);
      }
  }, []);

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
      alert("Chave API Salva com Sucesso! O sistema usará esta chave para se conectar à IA.");
  };

  const handleClearApiKey = () => {
      updateApiKey("");
      setApiKeyInput("");
      alert("Chave API Removida.");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleConnectAPI = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      if (formData.accessToken && formData.phoneNumberId) {
        setWhatsappStatus('connected');
      } else {
        alert("Por favor, preencha o Token de Acesso e o ID do Telefone.");
      }
    }, 1500);
  };

  const handleGenerateQR = () => {
    setQrStatus('generating');
    setTimeout(() => {
        setQrStatus('ready');
        setTimeout(() => {
            if (whatsappStatus !== 'connected') {
                // Just a visual feedback loop
            }
        }, 5000);
    }, 2000);
  };

  const handleSimulateScan = () => {
      setWhatsappStatus('connected');
  }

  const handleDisconnect = () => {
    setWhatsappStatus('disconnected');
    setFormData({ accessToken: '', phoneNumberId: '', wabaId: '' });
    setQrStatus('idle');
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
                title="Copiar"
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
            
            {/* Left Column: Forms */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* System Status Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Zap size={20} className="text-amber-500" />
                        Status dos Serviços
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* WhatsApp Status */}
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
                                {whatsappStatus === 'connected' ? 'Conectado e pronto.' : 'Desconectado. Configure abaixo.'}
                            </p>
                        </div>

                        {/* AI Status */}
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
                                {isAiReady 
                                    ? 'API Key detectada. IA pronta.' 
                                    : 'API Key ausente. Insira sua chave ao lado.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Connection Config Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="border-b border-gray-100 overflow-x-auto">
                        <div className="flex">
                            <button 
                                onClick={() => setConnectionMethod('api')}
                                className={`px-4 md:px-6 py-4 text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${connectionMethod === 'api' ? 'border-b-2 border-emerald-500 text-emerald-700 bg-emerald-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <Server size={18} />
                                API Oficial (Meta)
                            </button>
                             <button 
                                onClick={() => setConnectionMethod('vercel')}
                                className={`px-4 md:px-6 py-4 text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${connectionMethod === 'vercel' ? 'border-b-2 border-emerald-500 text-emerald-700 bg-emerald-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <CloudLightning size={18} />
                                Integração Vercel (24h)
                            </button>
                            <button 
                                onClick={() => setConnectionMethod('qrcode')}
                                className={`px-4 md:px-6 py-4 text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${connectionMethod === 'qrcode' ? 'border-b-2 border-emerald-500 text-emerald-700 bg-emerald-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <QrCode size={18} />
                                Conexão QR Code
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                         {/* VERCEL 24/7 MODE */}
                        {connectionMethod === 'vercel' && (
                            <div className="animate-fadeIn space-y-6">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <h4 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-2">
                                        <CloudLightning size={16} /> Automação 24h Garantida
                                    </h4>
                                    <p className="text-sm text-blue-700 mb-2">
                                        Para que a IA conheça seus imóveis atualizados e novas regras mesmo quando você fecha o site, precisamos enviar esses dados para o Vercel.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2"><CheckCircle size={16} className="text-emerald-600"/> Passo 1: Configure o Webhook na Meta</h4>
                                        <CopyField 
                                            label="Callback URL" 
                                            value={`https://${window.location.hostname}/api/webhook`} 
                                        />
                                        <CopyField 
                                            label="Verify Token" 
                                            value="construtoragpt_token_seguro" 
                                        />
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2"><CheckCircle size={16} className="text-emerald-600"/> Passo 2: Variáveis Básicas (Vercel)</h4>
                                        <div className="bg-gray-50 p-3 rounded text-xs font-mono text-gray-600 border border-gray-200 space-y-1">
                                            <p>API_KEY</p>
                                            <p>WHATSAPP_ACCESS_TOKEN</p>
                                            <p>VERIFY_TOKEN</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 pt-4">
                                        <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2"><FileJson size={16} className="text-emerald-600"/> Passo 3: Sincronizar Dados (CRÍTICO)</h4>
                                        <p className="text-xs text-gray-500 mb-4">
                                            Sempre que você alterar imóveis, preços ou prompts, clique no botão abaixo. Ele gerará um código. Copie esse código e atualize a variável <code>CRM_CONFIG_JSON</code> no painel do Vercel.
                                        </p>
                                        
                                        {!configJson ? (
                                            <button 
                                                onClick={generateConfigJson}
                                                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition shadow-sm flex items-center justify-center gap-2"
                                            >
                                                <RefreshCw size={16} /> Gerar Código de Sincronização
                                            </button>
                                        ) : (
                                            <div className="animate-fadeIn">
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Copie TUDO abaixo e cole na variável CRM_CONFIG_JSON no Vercel:</label>
                                                <textarea 
                                                    readOnly
                                                    className="w-full h-32 p-2 bg-gray-800 text-green-400 font-mono text-[10px] rounded border border-gray-700 resize-none focus:outline-none"
                                                    value={configJson}
                                                />
                                                <div className="flex gap-2 mt-2">
                                                    <button 
                                                        onClick={() => { navigator.clipboard.writeText(configJson); alert("Código copiado!"); }}
                                                        className="flex-1 py-2 bg-emerald-600 text-white rounded font-bold text-xs hover:bg-emerald-700 transition"
                                                    >
                                                        Copiar Código
                                                    </button>
                                                    <button 
                                                        onClick={() => setConfigJson('')}
                                                        className="px-4 py-2 bg-gray-200 text-gray-600 rounded font-bold text-xs hover:bg-gray-300 transition"
                                                    >
                                                        Fechar
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {connectionMethod === 'api' && (
                            <div className="space-y-4 animate-fadeIn">
                                <div className="mb-4">
                                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                        Credenciais da Meta (Teste Local)
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">Use esta aba para testar a conexão enquanto usa o navegador. Para automação 24h, use a aba "Integração Vercel".</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Token de Acesso</label>
                                    <input 
                                        type="password" 
                                        name="accessToken"
                                        value={formData.accessToken}
                                        onChange={handleChange}
                                        placeholder="EAAG..."
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all bg-white text-gray-800"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ID do Número</label>
                                        <input 
                                            type="text" 
                                            name="phoneNumberId"
                                            value={formData.phoneNumberId}
                                            onChange={handleChange}
                                            placeholder="1059..."
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all bg-white text-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ID da WABA</label>
                                        <input 
                                            type="text" 
                                            name="wabaId"
                                            value={formData.wabaId}
                                            onChange={handleChange}
                                            placeholder="1012..."
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all bg-white text-gray-800"
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
                                    {whatsappStatus === 'connected' ? (
                                        <button 
                                            onClick={handleDisconnect}
                                            className="px-6 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
                                        >
                                            Desconectar
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleConnectAPI}
                                            disabled={isTesting}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
                                        >
                                            {isTesting ? 'Validando...' : 'Salvar e Conectar'}
                                            {!isTesting && <CheckCircle size={18} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {connectionMethod === 'qrcode' && (
                            <div className="animate-fadeIn">
                                {whatsappStatus === 'connected' ? (
                                     <div className="text-center py-10">
                                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle size={40} className="text-green-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">WhatsApp Conectado!</h3>
                                        <p className="text-gray-500 mb-6">Seu aparelho está sincronizado e pronto para enviar mensagens.</p>
                                        <button 
                                            onClick={handleDisconnect}
                                            className="px-6 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
                                        >
                                            Desconectar Sessão
                                        </button>
                                     </div>
                                ) : (
                                    <div className="flex flex-col md:flex-row gap-8">
                                        <div className="flex-1 space-y-6">
                                            <div>
                                                <h3 className="font-semibold text-gray-800 mb-1">Conectar Novo Aparelho</h3>
                                                <p className="text-sm text-gray-500">Esta opção requer que o navegador fique aberto. Para automação 24h, use a opção "Integração Vercel".</p>
                                            </div>
                                            
                                            <ol className="space-y-4">
                                                <li className="flex items-start gap-3">
                                                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 mt-0.5">1</div>
                                                    <p className="text-sm text-gray-600">Abra o WhatsApp no celular.</p>
                                                </li>
                                                <li className="flex items-start gap-3">
                                                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 mt-0.5">2</div>
                                                    {/* FIX: Escaped greater-than symbol to prevent TS1382 */}
                                                    <p className="text-sm text-gray-600">Vá em <strong>Aparelhos Conectados</strong> &gt; <strong>Conectar Aparelho</strong>.</p>
                                                </li>
                                                <li className="flex items-start gap-3">
                                                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 mt-0.5">3</div>
                                                    <p className="text-sm text-gray-600">Escaneie o código ao lado.</p>
                                                </li>
                                            </ol>
                                        </div>

                                        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-xl p-6 border border-gray-200 min-h-[300px]">
                                            {qrStatus === 'idle' && (
                                                <div className="text-center">
                                                    <QrCode size={64} className="text-gray-300 mx-auto mb-4" />
                                                    <button 
                                                        onClick={handleGenerateQR}
                                                        className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition shadow-sm font-medium"
                                                    >
                                                        Gerar QR Code
                                                    </button>
                                                </div>
                                            )}

                                            {qrStatus === 'generating' && (
                                                <div className="text-center">
                                                    <RefreshCw size={40} className="text-emerald-500 animate-spin mx-auto mb-4" />
                                                    <p className="text-sm text-gray-500">Gerando sessão segura...</p>
                                                </div>
                                            )}

                                            {qrStatus === 'ready' && (
                                                <div className="flex flex-col items-center">
                                                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 mb-4 relative group cursor-pointer" onClick={handleSimulateScan}>
                                                        <img 
                                                            src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ConstrutoraGPT-Auth-Session" 
                                                            alt="Scan Me" 
                                                            className="w-48 h-48"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium animate-pulse">
                                                        <Wifi size={16} />
                                                        Aguardando leitura...
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Guide */}
            <div className="space-y-6">
                 {/* AI Configuration Input */}
                 <div className="bg-indigo-50 rounded-xl shadow-sm border border-indigo-100 p-6">
                    <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                        <Key size={18} />
                        Configuração da API Key
                    </h3>
                    
                    <p className="text-sm text-indigo-800 mb-4 leading-relaxed">
                        Insira sua chave Gemini aqui para usar o CRM no navegador. Para o modo 24h (Vercel), adicione também nas Variáveis de Ambiente.
                    </p>
                    
                    <div className="space-y-3">
                         <div>
                             <label className="block text-xs font-bold text-indigo-700 mb-1 uppercase">Google Gemini API Key</label>
                             <div className="relative">
                                 <input 
                                    type={showApiKey ? "text" : "password"}
                                    className="w-full pr-10 pl-3 py-2 rounded border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    placeholder="AIzaSy..."
                                    value={apiKeyInput}
                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                 />
                                 <button 
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600"
                                 >
                                     {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                 </button>
                             </div>
                         </div>
                         
                         <div className="flex gap-2 pt-2">
                             <button 
                                onClick={handleSaveApiKey}
                                className="flex-1 bg-indigo-600 text-white py-2 rounded text-sm font-bold hover:bg-indigo-700 flex items-center justify-center gap-2"
                             >
                                 <Save size={16} /> Salvar Chave
                             </button>
                             {apiKeyInput && (
                                 <button 
                                     onClick={handleClearApiKey}
                                     className="px-3 py-2 border border-red-200 text-red-500 rounded hover:bg-red-50"
                                     title="Remover Chave"
                                 >
                                     X
                                 </button>
                             )}
                         </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;
