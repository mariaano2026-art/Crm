
import React, { useState, useEffect, useRef } from 'react';
import { useCRM } from '../context/CRMContext';
import { MessageSquare, Key, Server, CheckCircle, AlertCircle, Copy, ExternalLink, Zap, QrCode, Wifi, Eye, EyeOff, Save, Trash2, RefreshCw, Brain, CloudLightning, FileJson, Info, Smartphone, Printer, Hash, Loader2, XCircle } from 'lucide-react';

const Settings: React.FC = () => {
  const { whatsappStatus, setWhatsappStatus, updateApiKey, isAiReady, properties, systemInstruction, blacklist, whatsappConfig, setWhatsappConfig } = useCRM();
  
  // Connection Method Toggle
  const [connectionMethod, setConnectionMethod] = useState<'api' | 'pairing' | 'qrcode' | 'vercel'>('api');
  
  // API Key State
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // QR Code State (Now a Link Generator)
  const [qrPhoneNumber, setQrPhoneNumber] = useState('');
  const [generatedQrLink, setGeneratedQrLink] = useState('');
  
  // Pairing Code State
  const [pairingNumber, setPairingNumber] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // Config Export State
  const [configJson, setConfigJson] = useState('');

  // Form fields synced with Context
  const [formData, setFormData] = useState({
    accessToken: whatsappConfig.accessToken,
    phoneNumberId: whatsappConfig.phoneNumberId,
    wabaId: whatsappConfig.wabaId
  });

  const [isTesting, setIsTesting] = useState(false);
  
  useEffect(() => {
      // Load existing key from storage if available for the placeholder (don't show it fully)
      const stored = localStorage.getItem('crm_gemini_api_key');
      if (stored) {
          setApiKeyInput(stored);
      }
      // Sync form with context config
      setFormData({
          accessToken: whatsappConfig.accessToken,
          phoneNumberId: whatsappConfig.phoneNumberId,
          wabaId: whatsappConfig.wabaId
      });
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
    // Simulation of verification (In a real app, you would hit an endpoint to check validity)
    setTimeout(() => {
      setIsTesting(false);
      if (formData.accessToken && formData.phoneNumberId) {
        setWhatsappConfig(formData);
        alert("✅ Conectado! O CRM agora tem permissão para enviar mensagens via API Oficial.");
      } else {
        alert("❌ Erro: Por favor, preencha o Token de Acesso e o ID do Telefone.");
      }
    }, 1500);
  };

  const handleDisconnect = () => {
    setWhatsappConfig({ accessToken: '', phoneNumberId: '', wabaId: '' });
    setFormData({ accessToken: '', phoneNumberId: '', wabaId: '' });
  };

  // QR Code Generator Function
  const generateMyLink = () => {
      if (!qrPhoneNumber) return;
      // Clean number
      const clean = qrPhoneNumber.replace(/\D/g, '');
      const link = `https://wa.me/${clean}`;
      setGeneratedQrLink(link);
  };

  // Pairing Code Logic (Simulation)
  const generatePairingCode = () => {
      if (!pairingNumber || pairingNumber.length < 10) {
          alert("Por favor, digite um número válido com DDD e código do país (Ex: 5511999999999)");
          return;
      }
      setIsGeneratingCode(true);
      
      // Simulação de chamada ao backend para gerar código via Baileys/WWebJS
      setTimeout(() => {
          // Gerando um código aleatório estilo WhatsApp (ex: 4X5-B2A-99Z)
          const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
          let code = "";
          for(let i=0; i<8; i++) {
              code += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          // Formatando XXX-XXX-XX
          const formatted = `${code.substring(0,3)}-${code.substring(3,7)}-${code.substring(7)}`;
          
          setPairingCode(formatted);
          setIsGeneratingCode(false);
      }, 2500);
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
                                    <MessageSquare size={18} /> WhatsApp API
                                </div>
                                {whatsappStatus === 'connected' 
                                    ? <CheckCircle size={18} className="text-green-600" />
                                    : <AlertCircle size={18} className="text-red-600" />
                                }
                            </div>
                            <p className={`text-xs ${whatsappStatus === 'connected' ? 'text-green-700' : 'text-red-700'}`}>
                                {whatsappStatus === 'connected' ? 'Conectado via Cloud API.' : 'Desconectado. Configure a API.'}
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
                                Integração Vercel
                            </button>
                            <button 
                                onClick={() => setConnectionMethod('pairing')}
                                className={`px-4 md:px-6 py-4 text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${connectionMethod === 'pairing' ? 'border-b-2 border-emerald-500 text-emerald-700 bg-emerald-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <Hash size={18} />
                                Código de Pareamento
                            </button>
                            <button 
                                onClick={() => setConnectionMethod('qrcode')}
                                className={`px-4 md:px-6 py-4 text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${connectionMethod === 'qrcode' ? 'border-b-2 border-emerald-500 text-emerald-700 bg-emerald-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <QrCode size={18} />
                                Gerador de Link
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
                                        Para que a IA responda clientes 24h por dia (mesmo com o site fechado), configure o Webhook no Vercel.
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
                                        <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2"><CheckCircle size={16} className="text-emerald-600"/> Passo 2: Variáveis de Ambiente</h4>
                                        <p className="text-xs text-gray-500 mb-2">No painel da Vercel, adicione:</p>
                                        <div className="bg-gray-50 p-3 rounded text-xs font-mono text-gray-600 border border-gray-200 space-y-1">
                                            <p>API_KEY</p>
                                            <p>WHATSAPP_ACCESS_TOKEN</p>
                                            <p>VERIFY_TOKEN</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 pt-4">
                                        <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2"><FileJson size={16} className="text-emerald-600"/> Passo 3: Sincronizar Cérebro da IA</h4>
                                        <p className="text-xs text-gray-500 mb-4">
                                            Sempre que alterar imóveis ou prompts, gere este código e cole na variável <code>CRM_CONFIG_JSON</code> no Vercel.
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
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Copie TUDO abaixo e cole no Vercel:</label>
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
                                <div className="mb-4 bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                                    <h3 className="font-bold text-emerald-800 flex items-center gap-2 text-sm">
                                        <CheckCircle size={16} /> Método Recomendado
                                    </h3>
                                    <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                                        A API Oficial (Cloud API) é a única forma de garantir que seu CRM funcione nesta versão Web sem necessidade de servidores complexos.
                                    </p>
                                    <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" className="text-xs text-emerald-900 font-bold underline mt-2 block">
                                        Clique aqui para criar sua conta Meta Developers
                                    </a>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Token de Acesso (Permanente ou Temporário)</label>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ID do Número de Telefone</label>
                                        <input 
                                            type="text" 
                                            name="phoneNumberId"
                                            value={formData.phoneNumberId}
                                            onChange={handleChange}
                                            placeholder="Ex: 1059..."
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all bg-white text-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ID da Conta WhatsApp (WABA)</label>
                                        <input 
                                            type="text" 
                                            name="wabaId"
                                            value={formData.wabaId}
                                            onChange={handleChange}
                                            placeholder="Ex: 1012..."
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

                        {connectionMethod === 'pairing' && (
                            <div className="animate-fadeIn">
                                {/* TECHNICAL WARNING BANNER */}
                                <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-lg">
                                    <h3 className="font-bold text-red-800 text-sm mb-2 flex items-center gap-2">
                                        <XCircle size={18} /> Incompatível com Aplicação Web
                                    </h3>
                                    <p className="text-xs text-red-700 leading-relaxed mb-2">
                                        <strong>Esta opção não funcionará nesta versão.</strong>
                                    </p>
                                    <p className="text-xs text-red-700 leading-relaxed">
                                        O método "Pareamento" depende de uma conexão WebSocket constante (via biblioteca Baileys/Node.js) que não pode rodar em navegadores ou serverless functions simples. Para conectar este aplicativo agora, use a aba <strong>API Oficial</strong>.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-6 opacity-60 pointer-events-none grayscale">
                                    {!pairingCode ? (
                                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                                             <label className="block text-sm font-bold text-gray-700 mb-3">Digite seu número (com DDD e Código do País)</label>
                                             <input 
                                                type="text" 
                                                value={pairingNumber}
                                                onChange={(e) => setPairingNumber(e.target.value)}
                                                placeholder="Ex: 5511999999999"
                                                className="w-full max-w-sm text-center text-lg tracking-wider p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none mb-4"
                                             />
                                             <button 
                                                onClick={generatePairingCode}
                                                disabled={isGeneratingCode || !pairingNumber}
                                                className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2"
                                             >
                                                {isGeneratingCode ? <Loader2 size={18} className="animate-spin" /> : <Hash size={18} />}
                                                {isGeneratingCode ? 'Gerando...' : 'Gerar Código de Pareamento'}
                                             </button>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-800 text-white p-8 rounded-xl shadow-xl flex flex-col items-center justify-center animate-fadeIn text-center relative overflow-hidden">
                                            {/* Code Display Simulation */}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {connectionMethod === 'qrcode' && (
                            <div className="animate-fadeIn">
                                {/* TECHNICAL WARNING BANNER */}
                                <div className="mb-6 bg-orange-50 border border-orange-200 p-4 rounded-lg">
                                     <h3 className="font-bold text-orange-800 text-sm mb-1 flex items-center gap-2">
                                        <AlertCircle size={16} /> Apenas Gerador de Links
                                    </h3>
                                    <p className="text-xs text-orange-700 leading-relaxed">
                                        Assim como o Pareamento, o QR Code de conexão real (tipo WhatsApp Web) exige um servidor Node.js dedicado. 
                                        A ferramenta abaixo serve apenas para criar links "wa.me" para marketing, não para conectar o sistema.
                                    </p>
                                </div>

                                <div className="flex flex-col md:flex-row gap-8">
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Seu Número (com DDD)</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={qrPhoneNumber}
                                                    onChange={(e) => setQrPhoneNumber(e.target.value)}
                                                    placeholder="5511999999999"
                                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                                                />
                                                <button 
                                                    onClick={generateMyLink}
                                                    disabled={!qrPhoneNumber}
                                                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-700 disabled:opacity-50"
                                                >
                                                    Gerar
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-xl p-6 border border-gray-200 min-h-[300px]">
                                        {!generatedQrLink ? (
                                            <div className="text-center text-gray-400">
                                                <QrCode size={48} className="mx-auto mb-2 opacity-20" />
                                                <p className="text-sm">Digite seu número para gerar o código.</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center animate-fadeIn">
                                                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 mb-4">
                                                    <img 
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${generatedQrLink}`} 
                                                        alt="WhatsApp Link" 
                                                        className="w-40 h-40"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 font-mono mb-3 bg-white px-2 py-1 rounded border border-gray-200 truncate max-w-[200px]">
                                                    {generatedQrLink}
                                                </p>
                                                <div className="flex gap-2">
                                                     <button 
                                                        onClick={() => window.open(generatedQrLink, '_blank')}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded text-xs font-bold hover:bg-green-600"
                                                     >
                                                         <Smartphone size={14} /> Testar
                                                     </button>
                                                     <button 
                                                        onClick={() => window.print()}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-bold hover:bg-gray-300"
                                                     >
                                                         <Printer size={14} /> Imprimir
                                                     </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
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

                    {/* NEW: Instructions Box with Link */}
                    <div className="bg-white p-4 rounded-lg border border-indigo-200 mb-4 shadow-sm">
                        <h4 className="text-xs font-bold text-indigo-800 uppercase mb-2 flex items-center gap-1">
                            <Info size={12} /> Onde pegar a chave?
                        </h4>
                        <p className="text-xs text-indigo-700 mb-3 leading-relaxed">
                            Você precisa de uma chave gratuita do Google Gemini para que a IA funcione.
                        </p>
                        <a 
                            href="https://aistudio.google.com/app/apikey" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors"
                        >
                            Gerar Chave API no Google AI Studio <ExternalLink size={12} />
                        </a>
                    </div>
                    
                    <p className="text-xs text-indigo-800 mb-2 font-medium">
                        Cole a chave gerada no campo abaixo e clique em Salvar:
                    </p>
                    
                    <div className="space-y-3">
                         <div>
                             <div className="relative">
                                 <input 
                                    type={showApiKey ? "text" : "password"}
                                    className="w-full pr-10 pl-3 py-2 rounded border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
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
                                     <Trash2 size={16} />
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
