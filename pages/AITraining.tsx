

import React, { useState, useEffect, useRef } from 'react';
import { useCRM, DEFAULT_SYSTEM_PROMPT } from '../context/CRMContext';
import { Save, Brain, RefreshCcw, Bell, MessageCircle, Calendar, Zap, PauseCircle, Timer, Mic, Volume2, Play, Loader2, Sparkles, Wand2, ArrowLeft, ArrowRight } from 'lucide-react';
import { VOICE_PRESETS } from '../constants';
import { generateAudioFromText, refineSystemPrompt } from '../services/geminiService';

const AITraining: React.FC = () => {
  const { 
      systemInstruction, setSystemInstruction,
      userAttentionTriggers, setUserAttentionTriggers,
      aiAttentionTriggers, setAiAttentionTriggers,
      followUpConfig, setFollowUpConfig, resetFollowUpConfig,
      aiPauseDuration, setAiPauseDuration,
      timerSettings, setTimerSettings,
      voiceSettings, setVoiceSettings
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'general' | 'followup' | 'timers' | 'voice'>('general');
  const [isSaved, setIsSaved] = useState(false);

  // Local States
  const [localInstruction, setLocalInstruction] = useState(systemInstruction);
  const [localUserTriggers, setLocalUserTriggers] = useState(userAttentionTriggers.join(', '));
  const [localAiTriggers, setLocalAiTriggers] = useState(aiAttentionTriggers.join(', '));
  const [localAiPause, setLocalAiPause] = useState(aiPauseDuration);
  const [localFollowUp, setLocalFollowUp] = useState(followUpConfig);
  const [localTimers, setLocalTimers] = useState(timerSettings);
  const [localVoice, setLocalVoice] = useState(voiceSettings);

  // AI Prompt Refiner State
  const [refinementInput, setRefinementInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refinedPrompt, setRefinedPrompt] = useState('');

  // Voice Preview State
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setLocalInstruction(systemInstruction);
    setLocalUserTriggers(userAttentionTriggers.join(', '));
    setLocalAiTriggers(aiAttentionTriggers.join(', '));
    setLocalAiPause(aiPauseDuration);
    setLocalFollowUp(followUpConfig);
    setLocalTimers(timerSettings);
    setLocalVoice(voiceSettings);
  }, [systemInstruction, userAttentionTriggers, aiAttentionTriggers, aiPauseDuration, followUpConfig, timerSettings, voiceSettings]);

  // Cleanup audio on unmount
  useEffect(() => {
      return () => {
          if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current = null;
          }
      };
  }, []);

  const handleSaveGeneral = () => {
    setSystemInstruction(localInstruction);
    
    const userTriggersArray = localUserTriggers.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const aiTriggersArray = localAiTriggers.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    setUserAttentionTriggers(userTriggersArray);
    setAiAttentionTriggers(aiTriggersArray);
    setAiPauseDuration(localAiPause);

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSaveFollowUp = () => {
    setFollowUpConfig(localFollowUp);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSaveTimers = () => {
      setTimerSettings(localTimers);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
  }

  const handleSaveVoice = () => {
      setVoiceSettings(localVoice);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
  }

  const handleResetGeneral = () => {
    setLocalInstruction(DEFAULT_SYSTEM_PROMPT); 
    setLocalAiPause(30);
  };

  const handleResetFollowUp = () => {
      resetFollowUpConfig();
      setTimeout(() => setLocalFollowUp(followUpConfig), 100); 
  };

  const handleRefinePrompt = async () => {
      if(!refinementInput.trim()) return;
      setIsRefining(true);
      try {
          const newPrompt = await refineSystemPrompt(localInstruction, refinementInput);
          setRefinedPrompt(newPrompt);
      } catch (e) {
          alert("Erro ao otimizar prompt. Verifique sua API Key.");
      } finally {
          setIsRefining(false);
      }
  };

  const handleApplyRefinement = () => {
      setLocalInstruction(refinedPrompt);
      setRefinedPrompt('');
      setRefinementInput('');
      alert("Prompt atualizado no editor! Lembre-se de clicar em SALVAR.");
  };

  const handleSelectAndPlayVoice = async (voice: typeof voiceSettings) => {
      setLocalVoice(voice);
      
      // Stop current audio
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
          setPlayingVoiceId(null);
      }

      // Don't play if clicking the same voice that is currently playing (toggle off)
      if (playingVoiceId === voice.voiceName) {
          return;
      }

      setLoadingVoiceId(voice.voiceName);

      // Standard preview text for fair comparison
      const previewText = "Olá. Esta é uma demonstração da minha voz. Como posso ajudar você com seu imóvel hoje?";
      
      const url = await generateAudioFromText(previewText, voice.voiceName);
      
      setLoadingVoiceId(null);

      if (url) {
          const audio = new Audio(url);
          audioRef.current = audio;
          setPlayingVoiceId(voice.voiceName);
          
          audio.play().catch(e => console.error("Playback failed", e));
          
          audio.onended = () => {
              setPlayingVoiceId(null);
          };
      }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700">
                <Brain size={28} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Treinamento da IA</h2>
                <p className="text-sm text-gray-500">Defina a personalidade, voz e gatilhos de atendimento.</p>
            </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200 overflow-x-auto">
        <button
            onClick={() => setActiveTab('general')}
            className={`px-6 py-3 font-medium text-sm rounded-t-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'general'
                ? 'bg-white text-emerald-600 border border-gray-200 border-b-transparent shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
        >
            <Brain size={16} /> Personalidade
        </button>
        <button
            onClick={() => setActiveTab('timers')}
            className={`px-6 py-3 font-medium text-sm rounded-t-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'timers'
                ? 'bg-white text-emerald-600 border border-gray-200 border-b-transparent shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
        >
            <Timer size={16} /> Humanização
        </button>
        <button
            onClick={() => setActiveTab('voice')}
            className={`px-6 py-3 font-medium text-sm rounded-t-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'voice'
                ? 'bg-white text-emerald-600 border border-gray-200 border-b-transparent shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
        >
            <Mic size={16} /> Voz
        </button>
        <button
            onClick={() => setActiveTab('followup')}
            className={`px-6 py-3 font-medium text-sm rounded-t-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'followup'
                ? 'bg-white text-emerald-600 border border-gray-200 border-b-transparent shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
        >
            <Zap size={16} /> Follow-up
        </button>
      </div>

      {/* CONTENT AREA */}
      {activeTab === 'general' && (
        <div className="space-y-8 animate-fadeIn">
            {/* GRID PRINCIPAL: EDITOR + AI HELPER */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* 1. EDITOR DE PROMPT (Lado Esquerdo/Topo) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[650px]">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                             <MessageCircle size={18} /> Instruções do Sistema
                        </h3>
                        <button onClick={handleResetGeneral} className="text-xs text-gray-500 hover:text-emerald-600 flex items-center gap-1"><RefreshCcw size={12} /> Restaurar Padrão</button>
                    </div>
                    <div className="flex-1 p-0 relative">
                        <textarea 
                            className="w-full h-full p-6 resize-none focus:outline-none font-mono text-sm text-gray-800 bg-white leading-relaxed"
                            value={localInstruction}
                            onChange={(e) => setLocalInstruction(e.target.value)}
                            placeholder="Digite aqui as instruções para a IA..."
                        />
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                        <button onClick={handleSaveGeneral} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${isSaved ? 'bg-green-500 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                            <Save size={18} /> {isSaved ? 'Salvo!' : 'Salvar Alterações'}
                        </button>
                    </div>
                </div>

                {/* 2. OTIMIZADOR DE PROMPT COM IA (Lado Direito/Baixo) */}
                <div className="flex flex-col h-[650px] bg-gradient-to-b from-indigo-50 to-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden">
                    <div className="bg-indigo-600 p-5 text-white flex justify-between items-center">
                         <div>
                             <h3 className="font-bold flex items-center gap-2 text-lg">
                                 <Sparkles size={20} className="text-yellow-300" /> Otimizador com IA
                             </h3>
                             <p className="text-indigo-200 text-xs mt-1">Dê uma ideia e a IA reescreve o prompt técnico para você.</p>
                         </div>
                         <Wand2 size={24} className="text-indigo-300 opacity-50" />
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                        {!refinedPrompt ? (
                             <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50 border-2 border-dashed border-indigo-200 rounded-xl">
                                 <Brain size={48} className="text-indigo-300 mb-4" />
                                 <h4 className="font-bold text-indigo-900 mb-2">Como posso melhorar seu corretor?</h4>
                                 <p className="text-sm text-indigo-700">Exemplos:</p>
                                 <ul className="text-xs text-indigo-500 mt-2 space-y-1">
                                     <li>"Deixe ele mais agressivo para fechar vendas"</li>
                                     <li>"Use gírias do Rio de Janeiro"</li>
                                     <li>"Faça ele ser extremamente formal e culto"</li>
                                 </ul>
                             </div>
                        ) : (
                             <div className="flex-1 flex flex-col animate-fadeIn">
                                 <div className="flex items-center gap-2 mb-2 text-indigo-900 font-bold text-sm">
                                     <Sparkles size={14} /> Sugestão da IA:
                                 </div>
                                 <div className="bg-white border border-indigo-100 rounded-xl p-4 shadow-sm text-sm font-mono text-gray-700 overflow-y-auto flex-1 mb-4 leading-relaxed whitespace-pre-wrap">
                                     {refinedPrompt}
                                 </div>
                                 <div className="flex gap-2">
                                     <button 
                                         onClick={() => setRefinedPrompt('')}
                                         className="flex-1 py-3 border border-gray-300 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50 transition"
                                     >
                                         <ArrowLeft size={16} className="inline mr-1" /> Voltar
                                     </button>
                                     <button 
                                         onClick={handleApplyRefinement}
                                         className="flex-1 py-3 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 shadow-md transition flex items-center justify-center gap-2"
                                     >
                                         Aplicar este Prompt <ArrowRight size={16} />
                                     </button>
                                 </div>
                             </div>
                        )}
                    </div>

                    <div className="p-4 bg-white border-t border-indigo-100">
                         <div className="relative">
                             <input 
                                 type="text" 
                                 value={refinementInput}
                                 onChange={(e) => setRefinementInput(e.target.value)}
                                 onKeyDown={(e) => e.key === 'Enter' && handleRefinePrompt()}
                                 placeholder="Ex: Deixe o tom mais amigável e use emojis..."
                                 className="w-full pl-4 pr-12 py-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm outline-none"
                                 disabled={isRefining || !!refinedPrompt}
                             />
                             <button 
                                 onClick={handleRefinePrompt}
                                 disabled={isRefining || !refinementInput.trim() || !!refinedPrompt}
                                 className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                             >
                                 {isRefining ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                             </button>
                         </div>
                    </div>
                </div>
            </div>

            {/* SEÇÃO INFERIOR: CONFIGS ADICIONAIS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                <div className="bg-white p-6 rounded-xl border border-purple-100 shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"><PauseCircle size={16} className="text-purple-500" /> Intervenção Humana</h4>
                    <p className="text-xs text-gray-500 mb-4">Pausa automática da IA após você responder manualmente.</p>
                    <div className="flex items-center gap-3 bg-purple-50 p-3 rounded-lg border border-purple-100">
                        <input type="number" min="0" value={localAiPause} onChange={(e) => setLocalAiPause(Number(e.target.value))} className="w-16 text-center p-1 rounded border border-purple-200 bg-white font-bold text-purple-700 outline-none" />
                        <span className="text-sm font-medium text-purple-800">minutos de pausa</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"><Bell size={16} className="text-red-500" /> Gatilhos de Urgência</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Cliente diz:</label>
                            <textarea className="w-full p-2 text-xs border border-gray-200 rounded outline-none bg-white text-gray-800" rows={2} value={localUserTriggers} onChange={e => setLocalUserTriggers(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">IA responde:</label>
                            <textarea className="w-full p-2 text-xs border border-gray-200 rounded outline-none bg-white text-gray-800" rows={2} value={localAiTriggers} onChange={e => setLocalAiTriggers(e.target.value)} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'timers' && (
        <div className="animate-fadeIn max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-900 text-white p-6 border-b border-gray-800"><h3 className="font-bold text-lg flex items-center gap-2"><Timer size={20} className="text-blue-400" /> Configurar Timers de Mensagens</h3></div>
                <div className="p-8 space-y-8">
                    <div>
                        <label className="flex justify-between items-center mb-2"><span className="font-bold text-gray-700">Aguardar Resposta (Segundos)</span><span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded text-sm">{localTimers.thinkingTime}s</span></label>
                        <input type="range" min="0" max="10" step="0.5" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" value={localTimers.thinkingTime} onChange={e => setLocalTimers({...localTimers, thinkingTime: Number(e.target.value)})} />
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <label className="block font-bold text-gray-700 mb-2">Delay por caractere (ms)</label>
                        <div className="flex gap-4 items-center"><input type="number" className="w-24 p-2 border border-gray-300 rounded text-center font-bold outline-none bg-white text-gray-800" value={localTimers.charDelay} onChange={e => setLocalTimers({...localTimers, charDelay: Number(e.target.value)})} /><span className="text-sm text-gray-500">ms por letra (Padrão: 60)</span></div>
                    </div>
                </div>
                <div className="p-6 border-t border-gray-100 flex justify-end bg-gray-50">
                    <button onClick={handleSaveTimers} className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold shadow-sm transition-all ${isSaved ? 'bg-green-500 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}><Save size={18} /> {isSaved ? 'Configuração Salva!' : 'Salvar'}</button>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'voice' && (
          <div className="animate-fadeIn max-w-4xl mx-auto">
             <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                 <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white p-6 border-b border-indigo-800">
                     <h3 className="font-bold text-lg flex items-center gap-2">
                         <Mic size={20} className="text-pink-400" /> Configuração de Voz e Áudio
                     </h3>
                     <p className="text-indigo-200 text-sm mt-1">Clique em uma voz para ouvir uma demonstração.</p>
                 </div>
                 
                 <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div>
                         <div className="flex justify-between items-end mb-4">
                            <h4 className="font-bold text-gray-800 flex items-center gap-2">Avatares de Voz</h4>
                            <span className="text-xs text-gray-400">5 opções disponíveis (Oficial Google)</span>
                         </div>
                         <div className="space-y-3">
                             {VOICE_PRESETS.map((voice) => (
                                 <div 
                                     key={voice.voiceName}
                                     onClick={() => handleSelectAndPlayVoice(voice)}
                                     className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center relative overflow-hidden ${
                                         localVoice.voiceName === voice.voiceName 
                                         ? 'bg-indigo-50 border-indigo-500 shadow-md ring-1 ring-indigo-500' 
                                         : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                                     }`}
                                 >
                                     <div className="flex items-center gap-3 z-10">
                                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${voice.gender === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                                             {loadingVoiceId === voice.voiceName ? (
                                                 <Loader2 size={20} className="animate-spin" />
                                             ) : playingVoiceId === voice.voiceName ? (
                                                 <Volume2 size={20} className="animate-pulse" />
                                             ) : (
                                                 <Play size={20} className="ml-1 opacity-60" />
                                             )}
                                         </div>
                                         <div>
                                             <p className="font-bold text-gray-800 text-sm">{voice.label}</p>
                                             <p className="text-xs text-gray-500 font-mono">{voice.gender === 'male' ? 'Masculino' : 'Feminino'}</p>
                                         </div>
                                     </div>
                                     
                                     <div className="flex items-center gap-3 z-10">
                                        {playingVoiceId === voice.voiceName && (
                                            <div className="flex gap-0.5 items-end h-4">
                                                <div className="w-1 bg-indigo-500 animate-bounce h-2"></div>
                                                <div className="w-1 bg-indigo-500 animate-bounce h-4 delay-75"></div>
                                                <div className="w-1 bg-indigo-500 animate-bounce h-3 delay-150"></div>
                                                <div className="w-1 bg-indigo-500 animate-bounce h-4 delay-100"></div>
                                            </div>
                                        )}
                                        {localVoice.voiceName === voice.voiceName && (
                                            <div className="w-4 h-4 bg-indigo-500 rounded-full border-2 border-white shadow-sm"></div>
                                        )}
                                     </div>
                                     
                                     {/* Progress Bar BG for Playing */}
                                     {playingVoiceId === voice.voiceName && (
                                        <div className="absolute bottom-0 left-0 h-1 bg-indigo-200 w-full">
                                            <div className="h-full bg-indigo-500 animate-width-progress" style={{width: '100%', animationDuration: '4s'}}></div>
                                        </div>
                                     )}
                                 </div>
                             ))}
                         </div>
                     </div>

                     <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 h-fit sticky top-6">
                         <h4 className="font-bold text-gray-800 mb-4">Status da Seleção</h4>
                         <div className="bg-white p-4 rounded-lg border border-gray-200 text-center py-8">
                             <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 relative">
                                 {playingVoiceId ? (
                                     <Volume2 size={32} className="animate-bounce" />
                                 ) : (
                                     <Mic size={32} />
                                 )}
                             </div>
                             <p className="text-gray-600 text-sm mb-2">Voz Selecionada:</p>
                             <p className="font-bold text-indigo-700 text-lg mb-4">{localVoice.label}</p>
                             <div className="bg-blue-50 p-3 rounded text-xs text-blue-800 italic">
                                 "Olá. Esta é uma demonstração da minha voz. Como posso ajudar você com seu imóvel hoje?"
                             </div>
                         </div>
                     </div>
                 </div>

                 <div className="p-6 border-t border-gray-100 flex justify-end bg-gray-50">
                     <button 
                         onClick={handleSaveVoice}
                         className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold shadow-sm transition-all ${
                             isSaved 
                             ? 'bg-green-500 text-white' 
                             : 'bg-indigo-600 text-white hover:bg-indigo-700'
                         }`}
                     >
                         <Save size={18} />
                         {isSaved ? 'Voz Atualizada!' : 'Salvar Preferência de Voz'}
                     </button>
                 </div>
             </div>
          </div>
      )}

      {activeTab === 'followup' && (
        <div className="animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-6">
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><MessageCircle size={18} className="text-emerald-600" /> Contexto Base</h3>
                        <textarea className="w-full h-48 p-3 text-sm border border-gray-200 rounded-lg outline-none resize-none bg-white text-gray-800" value={localFollowUp.baseContext} onChange={e => setLocalFollowUp({...localFollowUp, baseContext: e.target.value})} />
                     </div>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex justify-between items-center">
                            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2"><Zap size={18} className="text-emerald-600"/> Curto Prazo</h4>
                            <div className="flex items-center gap-2"><span className="text-xs font-bold">Até:</span><input type="number" className="w-12 text-center font-bold text-emerald-600 outline-none border-b border-emerald-300 bg-transparent" value={localFollowUp.earlyStage.daysThreshold} onChange={e => setLocalFollowUp({...localFollowUp, earlyStage: { ...localFollowUp.earlyStage, daysThreshold: parseInt(e.target.value) || 0 }})} /><span className="text-xs">dias</span></div>
                        </div>
                        <div className="p-4"><textarea className="w-full h-32 p-3 text-sm border border-gray-200 rounded-lg outline-none resize-none bg-white text-gray-800" value={localFollowUp.earlyStage.prompt} onChange={e => setLocalFollowUp({...localFollowUp, earlyStage: { ...localFollowUp.earlyStage, prompt: e.target.value }})} /></div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-blue-50 p-4 border-b border-blue-100"><h4 className="font-bold text-gray-800 text-sm flex items-center gap-2"><Calendar size={18} className="text-blue-600"/> Longo Prazo</h4></div>
                        <div className="p-4"><textarea className="w-full h-32 p-3 text-sm border border-gray-200 rounded-lg outline-none resize-none bg-white text-gray-800" value={localFollowUp.lateStage.prompt} onChange={e => setLocalFollowUp({...localFollowUp, lateStage: { ...localFollowUp.lateStage, prompt: e.target.value }})} /></div>
                    </div>
                    <div className="flex justify-end pt-4"><button onClick={handleSaveFollowUp} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${isSaved ? 'bg-green-500 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}><Save size={18} /> {isSaved ? 'Salvo!' : 'Salvar Configurações'}</button></div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AITraining;