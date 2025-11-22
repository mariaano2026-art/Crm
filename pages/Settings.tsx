
import React, { useState, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import { MessageSquare, Shield, Key, Server, CheckCircle, AlertCircle, Copy, ExternalLink, Brain, Zap, Lock, QrCode, Smartphone, RefreshCw, Wifi, Eye, EyeOff, Save } from 'lucide-react';

const Settings: React.FC = () => {
  const { whatsappStatus, setWhatsappStatus, updateApiKey, isAiReady } = useCRM();
  
  // Connection Method Toggle
  const [connectionMethod, setConnectionMethod] = useState<'api' | 'qrcode'>('api');
  
  // API Key State
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // QR Code State
  const [qrStatus, setQrStatus] = useState<'idle' | 'generating' | 'ready' | 'expired'>('idle');
  
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
        // Simulate auto-connect after scan (mock behavior)
        setTimeout(() => {
            if (whatsappStatus !== 'connected') {
                // Just a visual feedback loop, actual connect happens via user action in this demo
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
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="flex">
            <code className="flex-1 bg-gray-100 border border-gray-200 rounded-l-lg px-3 py-2 text-sm font-mono text-gray-600 overflow-hidden truncate">
                {value}
            </code>
            <button 
                className="bg-gray-200 hover:bg-gray-300 text-gray-600 px-3 py-2 rounded-r-lg border border-l-0 border-gray-200"
                onClick={() => navigator.clipboard.writeText(value)}
                title="Copiar"
            >
                <Copy size={16} />
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
                    <div className="border-b border-gray-100">
                        <div className="flex">
                            <button 
                                onClick={() => setConnectionMethod('api')}
                                className={`px-6 py-4 text-sm font-medium flex items-center gap-2 transition-colors ${connectionMethod === 'api' ? 'border-b-2 border-emerald-500 text-emerald-700 bg-emerald-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <Server size={18} />
                                API Oficial (Meta)
                            </button>
                            <button 
                                onClick={() => setConnectionMethod('qrcode')}
                                className={`px-6 py-4 text-sm font-medium flex items-center gap-2 transition-colors ${connectionMethod === 'qrcode' ? 'border-b-2 border-emerald-500 text-emerald-700 bg-emerald-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <QrCode size={18} />
                                Conexão QR Code
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {connectionMethod === 'api' ? (
                            <div className="space-y-4 animate-fadeIn">
                                <div className="mb-4">
                                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                        Credenciais da Meta
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">Recomendado para grandes volumes e estabilidade máxima.</p>
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
                        ) : (
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
                                                <p className="text-sm text-gray-500">Escaneie o QR Code para sincronizar seu WhatsApp Business.</p>
                                            </div>
                                            
                                            <ol className="space-y-4">
                                                <li className="flex items-start gap-3">
                                                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 mt-0.5">1</div>
                                                    <p className="text-sm text-gray-600">Abra o WhatsApp no seu celular.</p>
                                                </li>
                                                <li className="flex items-start gap-3">
                                                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 mt-0.5">2</div>
                                                    <p className="text-sm text-gray-600">Toque em <strong>Mais opções</strong> (Android) ou <strong>Configurações</strong> (iPhone).</p>
                                                </li>
                                                <li className="flex items-start gap-3">
                                                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 mt-0.5">3</div>
                                                    <p className="text-sm text-gray-600">Selecione <strong>Aparelhos Conectados</strong> e depois <strong>Conectar Aparelho</strong>.</p>
                                                </li>
                                                <li className="flex items-start gap-3">
                                                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 mt-0.5">4</div>
                                                    <p className="text-sm text-gray-600">Aponte a câmera para o código ao lado.</p>
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
                                                        {/* Using a generic static QR for demo purposes */}
                                                        <img 
                                                            src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ConstrutoraGPT-Auth-Session" 
                                                            alt="Scan Me" 
                                                            className="w-48 h-48"
                                                        />
                                                        <div className="absolute inset-0 bg-white/90 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                                                            <span className="text-sm font-bold text-emerald-600">Simular Leitura</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium animate-pulse">
                                                        <Wifi size={16} />
                                                        Aguardando leitura...
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-2">O código expira em 45s</p>
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
                 {/* AI Configuration Input - NEW */}
                 <div className="bg-indigo-50 rounded-xl shadow-sm border border-indigo-100 p-6">
                    <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                        <Key size={18} />
                        Configuração da API Key
                    </h3>
                    
                    <p className="text-sm text-indigo-800 mb-4 leading-relaxed">
                        Como não foi detectada uma chave de ambiente (.env), você pode inserir sua chave pessoal aqui. Ela será salva no seu navegador.
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

                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="mt-4 block w-full text-center py-2 text-xs text-indigo-600 hover:underline flex items-center justify-center gap-1">
                        Obter chave gratuita no Google AI Studio <ExternalLink size={12}/>
                    </a>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Shield size={18} className="text-gray-400" />
                        Sobre os Métodos
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-sm text-gray-900 mb-1 flex items-center gap-2">
                                <Server size={14} /> API Oficial (Meta)
                            </h4>
                            <p className="text-xs text-gray-500">
                                Mais estável. Requer verificação da empresa no Facebook. Ideal para alto volume de mensagens.
                            </p>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-sm text-gray-900 mb-1 flex items-center gap-2">
                                <QrCode size={14} /> QR Code (Emulador)
                            </h4>
                            <p className="text-xs text-gray-500">
                                Conexão rápida simulando WhatsApp Web. Ideal para testes ou uso pessoal. Depende do celular estar ligado.
                            </p>
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
