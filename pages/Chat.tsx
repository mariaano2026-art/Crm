
import React, { useEffect, useRef, useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Send, Paperclip, MoreVertical, Search, Smile, Zap, MapPin, Home, Calendar, DollarSign, Phone, Tag, X, Bell, CheckCircle, ImageIcon, Film, Share, FileText, PauseCircle, Mic, Play, Pause, Trash2, Square, BarChart2, MessageSquareText, Loader2, Settings, Plus, Archive, ShieldAlert, Palette } from 'lucide-react';
import { LeadStatus, Property, Message, QuickReply, Tag as TagType } from '../types';
import { transcribeAudio } from '../services/geminiService';

// Custom Component for Audio Messages (Waveform + Transcription)
const AudioMessageBubble = ({ message, onUpdateMessage }: { message: Message, onUpdateMessage: (updatedMsg: Message) => void }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isTranscribing, setIsTranscribing] = useState(false);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const animationRef = useRef<number | null>(null);
    
    const barHeights = useRef<number[]>([]);
    if (barHeights.current.length === 0) {
        const seed = message.id.charCodeAt(message.id.length - 1);
        for (let i = 0; i < 20; i++) {
            const h = 30 + ((seed * i * 7) % 70); 
            barHeights.current.push(h);
        }
    }

    useEffect(() => {
        if (message.mediaUrl) {
            const audio = new Audio(message.mediaUrl);
            audioRef.current = audio;

            audio.addEventListener('loadedmetadata', () => {
                setDuration(audio.duration);
            });

            audio.addEventListener('ended', () => {
                setIsPlaying(false);
                setProgress(0);
                if (animationRef.current) cancelAnimationFrame(animationRef.current);
            });

            audio.addEventListener('timeupdate', () => {
                if (audio.duration) {
                    setProgress((audio.currentTime / audio.duration) * 100);
                }
            });

            return () => {
                audio.pause();
                audio.src = '';
            };
        }
    }, [message.mediaUrl]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleTranscribe = async () => {
        if (!message.mediaUrl) return;
        setIsTranscribing(true);
        const text = await transcribeAudio(message.mediaUrl);
        setIsTranscribing(false);
        if (text) {
            onUpdateMessage({ ...message, transcription: text });
        }
    };

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const isUser = message.sender === 'user';
    const waveColor = isUser ? 'bg-emerald-200' : 'bg-emerald-500';
    const activeWaveColor = isUser ? 'bg-white' : 'bg-emerald-700';
    const textColor = isUser ? 'text-emerald-100' : 'text-gray-500';
    const buttonColor = isUser ? 'text-white hover:bg-emerald-600' : 'text-emerald-600 hover:bg-gray-100';

    return (
        <div className="flex flex-col min-w-[240px]">
            <div className={`flex items-center gap-3 p-1 rounded-lg ${isUser ? 'bg-opacity-20' : ''}`}>
                <button 
                    onClick={togglePlay}
                    className={`p-2.5 rounded-full transition-colors flex-shrink-0 ${buttonColor} ${isUser ? 'bg-emerald-800' : 'bg-gray-100'}`}
                >
                    {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                </button>
                <div className="flex flex-col flex-1 min-w-0">
                    <div className="h-8 flex items-center gap-0.5 w-full">
                        {barHeights.current.map((h, i) => {
                            const barProgress = (i / barHeights.current.length) * 100;
                            const isPast = barProgress < progress;
                            return (
                                <div 
                                    key={i}
                                    className={`w-1.5 rounded-full transition-all duration-200 ${isPast ? activeWaveColor : waveColor}`}
                                    style={{ height: isPlaying ? `${Math.max(20, h + (Math.random() * 20 - 10))}%` : `${h}%`, opacity: isPast ? 1 : 0.6 }}
                                />
                            );
                        })}
                    </div>
                    <div className={`flex justify-between text-[10px] font-medium mt-1 ${textColor}`}>
                        <span>{isPlaying ? formatTime(audioRef.current?.currentTime || 0) : formatTime(duration)}</span>
                    </div>
                </div>
            </div>
            {!message.transcription && !isTranscribing && (
                <div className="mt-2 pl-1">
                    <button 
                        onClick={handleTranscribe}
                        className={`text-xs flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors border ${isUser ? 'border-emerald-500 text-emerald-100 hover:bg-emerald-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                        <MessageSquareText size={12} /> Transcrever áudio
                    </button>
                </div>
            )}
            {isTranscribing && (
                <div className={`mt-2 pl-1 flex items-center gap-2 text-xs ${textColor}`}>
                    <Loader2 size={12} className="animate-spin" /> Transcrevendo...
                </div>
            )}
            {message.transcription && (
                <div className={`mt-2 p-2 rounded-lg text-xs leading-relaxed border ${isUser ? 'bg-emerald-800 border-emerald-600 text-white' : 'bg-gray-50 border-gray-100 text-gray-700'}`}>
                    <span className="opacity-50 block text-[10px] uppercase font-bold mb-1">Transcrição:</span>
                    "{message.transcription}"
                </div>
            )}
        </div>
    );
};

const Chat: React.FC = () => {
  const { 
    leads, properties, selectedLeadId, setSelectedLeadId, sendMessage, generateAIFollowUp, aiActivity, 
    resolveAttention, quickReplies, setQuickReplies, tags, addTag, assignTagToLead, removeTagFromLead,
    clearChat, archiveLead, unarchiveLead, deleteLead, addToBlacklist
  } = useCRM();
  
  const [input, setInput] = useState('');
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showChatMenu, setShowChatMenu] = useState(false); // Menu dropdown state
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Filter state
  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Quick Reply Config Modal State
  const [isConfigRepliesOpen, setIsConfigRepliesOpen] = useState(false);
  const [newReplyLabel, setNewReplyLabel] = useState('');
  const [newReplyText, setNewReplyText] = useState('');

  // Tag Modal State
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');

  // Filter leads for sidebar
  const filteredLeads = leads.filter(l => {
      const isArchived = l.archived === true;
      const matchesArchive = showArchived ? isArchived : !isArchived;
      const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.phone.includes(searchTerm);
      return matchesArchive && matchesSearch;
  });

  const activeLead = leads.find(l => l.id === selectedLeadId);
  const isAiPaused = activeLead?.aiPausedUntil && new Date() < activeLead.aiPausedUntil;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeLead?.messages, aiActivity]);

  // Cleanup
  useEffect(() => {
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input, 'agent');
    setInput('');
  };

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                  audioChunksRef.current.push(event.data);
              }
          };

          mediaRecorder.onstop = () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              const audioUrl = URL.createObjectURL(audioBlob);
              const durationStr = formatDuration(recordingDuration);
              sendMessage(`Mensagem de Voz (${durationStr})`, 'user', true, audioUrl, 'audio');
              const tracks = stream.getTracks();
              tracks.forEach(track => track.stop());
          };

          mediaRecorder.start();
          setIsRecording(true);
          setRecordingDuration(0);
          timerRef.current = window.setInterval(() => {
              setRecordingDuration(prev => prev + 1);
          }, 1000);
      } catch (err) {
          console.error("Error accessing microphone:", err);
          alert("Erro ao acessar microfone.");
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
          }
      }
  };

  const cancelRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.onstop = null; 
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
          setRecordingDuration(0);
          if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
          }
      }
  };

  const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const sendQuickReply = (text: string) => {
    sendMessage(text, 'agent');
  };

  const handleResolveAttention = () => {
      if (selectedLeadId) {
          resolveAttention(selectedLeadId);
      }
  };

  const sendPropertyCard = (property: Property) => {
    const text = `🏢 *${property.name}*
📍 ${property.address}
💰 *R$ ${property.price.toLocaleString('pt-BR')}*
📝 ${property.specs}

${property.description.substring(0, 100)}...

Gostaria de ver mais fotos ou agendar uma visita?`;
    sendMessage(text, 'agent');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
          sendMessage(input, 'agent');
          setInput('');
      }
    }
  };

  // Quick Replies Management Functions
  const handleAddReply = () => {
      if(newReplyLabel.trim() && newReplyText.trim()) {
          const newReply: QuickReply = {
              id: Date.now().toString(),
              label: newReplyLabel,
              text: newReplyText
          };
          setQuickReplies([...quickReplies, newReply]);
          setNewReplyLabel('');
          setNewReplyText('');
      }
  };

  const handleDeleteReply = (id: string) => {
      setQuickReplies(quickReplies.filter(q => q.id !== id));
  };

  // Tag Management Functions
  const handleCreateTag = () => {
      if(newTagName.trim()) {
          addTag(newTagName, newTagColor);
          setNewTagName('');
          setNewTagColor('#3b82f6'); // Reset to default blue
          setIsTagModalOpen(false);
      }
  };

  const handleAddTagToLead = (tagId: string) => {
      if (activeLead) {
          assignTagToLead(activeLead.id, tagId);
      }
  };

  const PRESET_TAG_COLORS = [
      '#3b82f6', // Blue
      '#ef4444', // Red
      '#10b981', // Green
      '#f59e0b', // Yellow/Orange
      '#8b5cf6', // Purple
      '#ec4899', // Pink
      '#6b7280', // Gray
      '#000000'  // Black
  ];

  return (
    <div className="flex h-full bg-gray-100 overflow-hidden relative">
      {/* SIDEBAR: LEAD LIST */}
      <div className={`w-full md:w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 ${activeLead ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                    onClick={() => setShowArchived(false)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${!showArchived ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Conversas
                </button>
                <button 
                    onClick={() => setShowArchived(true)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${showArchived ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Arquivadas
                </button>
            </div>
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Buscar conversa..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-white border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all outline-none text-gray-800"
                />
            </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredLeads.map(lead => (
            <div
              key={lead.id}
              onClick={() => setSelectedLeadId(lead.id)}
              className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-all relative ${
                selectedLeadId === lead.id ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'
              }`}
            >
              <div className="flex justify-between mb-1">
                <h4 className={`font-semibold text-sm ${selectedLeadId === lead.id ? 'text-emerald-900' : 'text-gray-800'}`}>{lead.name}</h4>
                <div className="flex items-center gap-1">
                     {lead.requiresAttention && (
                         <Bell size={12} className="text-red-500 animate-bounce" fill="currentColor" />
                     )}
                    <span className="text-[10px] text-gray-400">
                    {new Date(lead.lastContact).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                </div>
              </div>
              
              {/* TAGS PREVIEW ON LIST */}
              {lead.tags && lead.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1">
                      {lead.tags.map(tagId => {
                          const tag = tags.find(t => t.id === tagId);
                          return tag ? (
                              <span key={tagId} className="w-2 h-2 rounded-full" style={{backgroundColor: tag.color}} title={tag.name}></span>
                          ) : null;
                      })}
                  </div>
              )}

              <div className="flex justify-between items-center">
                <p className={`text-xs truncate w-48 ${lead.requiresAttention ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                  {lead.messages[lead.messages.length - 1]?.mediaType === 'audio' ? '🎤 Mensagem de Voz' : (lead.requiresAttention ? "⚠️ Atenção necessária!" : (lead.messages[lead.messages.length - 1]?.text || "..."))}
                </p>
                {lead.unreadCount > 0 && (
                  <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {lead.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))}
          {filteredLeads.length === 0 && (
              <div className="text-center p-8 text-gray-400 text-sm italic">
                  Nenhuma conversa encontrada.
              </div>
          )}
        </div>
      </div>

      {/* CHAT AREA */}
      {activeLead ? (
        <div className={`flex-1 flex flex-col bg-[#e5ddd5] relative min-w-0 ${activeLead ? 'flex' : 'hidden md:flex'}`}>
          
          {activeLead.requiresAttention && (
              <div className="bg-red-500 text-white px-4 py-2 flex justify-between items-center shadow-md animate-pulse z-20">
                  <div className="flex items-center gap-2 font-bold text-sm truncate">
                      <Bell size={16} fill="currentColor" />
                      <span className="truncate">ATENÇÃO: Cliente solicita humano!</span>
                  </div>
                  <button 
                    onClick={handleResolveAttention}
                    className="bg-white text-red-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-red-50 flex items-center gap-1 shadow-sm transition-colors whitespace-nowrap"
                  >
                      <CheckCircle size={12} />
                      Assumir
                  </button>
              </div>
          )}

          <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm z-10 relative">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedLeadId(null)} className="md:hidden text-gray-500">
                  <X size={20} />
              </button>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${activeLead.requiresAttention ? 'bg-red-500' : 'bg-emerald-100 text-emerald-700'}`}>
                {activeLead.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm">{activeLead.name}</h3>
                <div className="flex items-center gap-2">
                    {activeLead.archived ? (
                         <p className="text-xs text-gray-500 flex items-center gap-1 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                            <Archive size={10} /> Arquivada
                         </p>
                    ) : isAiPaused ? (
                        <p className="text-xs text-purple-600 flex items-center gap-1 font-medium bg-purple-50 px-1.5 py-0.5 rounded">
                            <PauseCircle size={10} /> IA em Pausa
                        </p>
                    ) : (
                        <p className="text-xs text-emerald-600 flex items-center gap-1">
                           {aiActivity === 'typing' && <span className="flex items-center gap-1 animate-pulse">Digitando...</span>}
                           {aiActivity === 'recording' && <span className="flex items-center gap-1 animate-pulse text-red-500 font-bold"><Mic size={10}/> Gravando...</span>}
                           {aiActivity === 'idle' && <><span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Online</>}
                        </p>
                    )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 relative">
              {activeLead.status === LeadStatus.COLD && (
                  <button onClick={generateAIFollowUp} disabled={aiActivity !== 'idle'} className="hidden lg:flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-100 transition disabled:opacity-50">
                      <Zap size={14} /> Reativar (IA)
                  </button>
              )}
              
              {/* CHAT CONFIG MENU */}
              <div className="relative">
                  <button 
                    onClick={() => setShowChatMenu(!showChatMenu)} 
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                  >
                      <MoreVertical size={20} />
                  </button>
                  {showChatMenu && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 animate-fadeIn">
                          <button 
                            onClick={() => { clearChat(activeLead.id); setShowChatMenu(false); }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                          >
                              <Trash2 size={16} /> Limpar Conversa
                          </button>
                          
                          {activeLead.archived ? (
                               <button 
                                onClick={() => { unarchiveLead(activeLead.id); setShowChatMenu(false); }}
                                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                              >
                                  <Archive size={16} /> Desarquivar
                              </button>
                          ) : (
                               <button 
                                onClick={() => { archiveLead(activeLead.id); setShowChatMenu(false); }}
                                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                              >
                                  <Archive size={16} /> Arquivar
                              </button>
                          )}
                          
                           <button 
                            onClick={() => { addToBlacklist(activeLead.phone); setShowChatMenu(false); }}
                            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 border-t border-gray-100 transition-colors"
                          >
                              <ShieldAlert size={16} /> Bloquear / Sem IA
                          </button>
                          <button 
                            onClick={() => { deleteLead(activeLead.id); setShowChatMenu(false); }}
                            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                          >
                              <Trash2 size={16} /> Apagar Contato
                          </button>
                      </div>
                  )}
              </div>
              
              <button onClick={() => setShowRightPanel(!showRightPanel)} className={`p-2 rounded-full hover:bg-gray-100 transition-colors hidden xl:block ${showRightPanel ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500'}`}>
                <Tag size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar" style={{ backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
            {activeLead.messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] sm:max-w-[70%] p-1 rounded-xl shadow-sm relative text-sm ${msg.sender === 'user' ? 'bg-white text-gray-800 rounded-tl-none' : 'bg-emerald-600 text-white rounded-tr-none'}`}>
                  {msg.isMedia ? (
                      <div className="flex flex-col min-w-[200px]">
                          {msg.mediaType === 'audio' ? (
                               <div className={`p-2 rounded-lg ${msg.sender === 'user' ? 'bg-gray-50' : 'bg-emerald-700'}`}>
                                    <AudioMessageBubble message={msg} onUpdateMessage={(updated) => { msg.transcription = updated.transcription; }} />
                               </div>
                          ) : (
                            <div className="bg-black rounded-lg overflow-hidden min-h-[150px] flex items-center justify-center bg-gray-100">
                                {msg.mediaType === 'video' ? (
                                    <video src={msg.mediaUrl} controls className="max-h-80 w-full object-contain bg-black" />
                                ) : (
                                    <img 
                                        src={msg.mediaUrl} 
                                        alt="Media" 
                                        className="max-h-80 w-full object-cover" 
                                        onLoad={scrollToBottom}
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                )}
                            </div>
                          )}
                          <div className={`px-2 py-1.5 flex items-center gap-1.5 text-xs font-medium ${msg.sender === 'user' ? 'text-gray-600' : 'text-emerald-100'}`}>
                                {msg.mediaType === 'video' && <Film size={14}/>}
                                {msg.mediaType === 'image' && <ImageIcon size={14} />}
                                {msg.mediaType === 'audio' && <Mic size={14} />}
                                {msg.text}
                          </div>
                      </div>
                  ) : (
                      <div className="p-3"><p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p></div>
                  )}
                  <span className={`text-[10px] block text-right mr-2 mb-1 ${msg.sender === 'user' ? 'text-gray-400' : 'text-emerald-100/80'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-white px-4 py-2 flex gap-2 items-center overflow-x-auto border-t border-gray-100 scrollbar-hide">
             <button 
                onClick={() => setIsConfigRepliesOpen(true)}
                className="p-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-emerald-100 hover:text-emerald-600 transition-colors flex-shrink-0"
                title="Configurar Respostas Rápidas"
             >
                 <Settings size={14} />
             </button>
            {quickReplies.map((reply) => (
                <button key={reply.id} onClick={() => sendQuickReply(reply.text)} className="whitespace-nowrap px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200 hover:border-emerald-200 rounded-full text-xs font-medium transition-colors flex-shrink-0">
                    {reply.label}
                </button>
            ))}
          </div>

          <div className="bg-white p-3 flex items-end gap-2">
            {isRecording ? (
                <div className="flex-1 flex items-center gap-3 bg-red-50 rounded-2xl px-4 py-2.5 border border-red-200 animate-pulse transition-all">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
                    <span className="text-red-600 font-bold text-sm min-w-[60px]">{formatDuration(recordingDuration)}</span>
                    <span className="text-xs text-red-400 font-medium ml-2 flex-1">Gravando...</span>
                    <button onClick={cancelRecording} className="p-2 text-gray-500 hover:text-red-600"><Trash2 size={18} /></button>
                    <button onClick={stopRecording} className="p-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600"><Send size={18} /></button>
                </div>
            ) : (
                <>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors mb-1 hidden sm:block"><Smile size={22} /></button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors mb-1"><Paperclip size={22} /></button>
                    <div className="flex-1 bg-white border border-gray-300 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all shadow-sm">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Digite sua mensagem..."
                            className="w-full bg-white border-none focus:ring-0 text-gray-800 placeholder-gray-400 text-sm resize-none max-h-32 py-1"
                            rows={1}
                            style={{ minHeight: '24px' }}
                        />
                    </div>
                    {input.trim() ? (
                        <button onClick={handleSend} className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors shadow-md mb-0.5"><Send size={20} /></button>
                    ) : (
                        <button onClick={startRecording} className="p-3 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors shadow-sm border border-emerald-200 mb-0.5"><Mic size={20} /></button>
                    )}
                </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 border-b-8 border-emerald-500 hidden md:flex">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <Zap size={40} className="text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Selecione um Cliente</h2>
          <p className="text-gray-500 max-w-md text-center">Gerencie seus atendimentos, use a IA para responder mais rápido e feche mais vendas.</p>
        </div>
      )}

      {/* RIGHT PANEL - CLIENT DATA & TAGS */}
      {activeLead && showRightPanel && (
          <div className="hidden xl:flex w-80 bg-white border-l border-gray-200 flex-col h-full overflow-y-auto shadow-xl z-20">
              <div className="p-5 border-b border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4">Dados do Cliente</h3>
                  <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3 text-gray-600"><Phone size={16} /><span>{activeLead.phone}</span></div>
                      <div className="flex items-center gap-3 text-gray-600"><Tag size={16} /><span>Status: <strong className={activeLead.status === 'Quente' ? 'text-emerald-600' : ''}>{activeLead.status}</strong></span></div>
                      <div className="flex items-center gap-3 text-gray-600"><Calendar size={16} /><span>Criado em: 12/09/2024</span></div>
                  </div>
              </div>

              {/* TAGS SECTION */}
              <div className="p-5 border-b border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                          <Tag size={16} className="text-emerald-600"/> Etiquetas
                      </h3>
                      <button onClick={() => setIsTagModalOpen(true)} className="text-xs text-blue-600 hover:underline">Gerenciar</button>
                  </div>
                  
                  {/* Assigned Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                      {activeLead.tags?.map(tagId => {
                          const tag = tags.find(t => t.id === tagId);
                          return tag ? (
                              <span key={tagId} className="px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1 shadow-sm" style={{backgroundColor: tag.color}}>
                                  {tag.name}
                                  <button onClick={() => removeTagFromLead(activeLead.id, tagId)} className="hover:text-red-100"><X size={10}/></button>
                              </span>
                          ) : null;
                      })}
                      {(!activeLead.tags || activeLead.tags.length === 0) && <span className="text-xs text-gray-400 italic">Sem etiquetas.</span>}
                  </div>

                  {/* Add Tag Dropdown */}
                  <div className="relative group">
                      <button className="w-full py-1.5 border border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-emerald-500 hover:text-emerald-600 flex items-center justify-center gap-1 transition-colors">
                          <Plus size={12} /> Adicionar Etiqueta
                      </button>
                      <div className="absolute top-full left-0 w-full bg-white border border-gray-200 shadow-lg rounded-lg mt-1 hidden group-hover:block z-50 p-1">
                          {tags.map(tag => (
                              <button 
                                key={tag.id}
                                onClick={() => handleAddTagToLead(tag.id)}
                                className="w-full text-left px-2 py-1.5 hover:bg-gray-50 text-xs rounded flex items-center gap-2"
                              >
                                  <span className="w-2 h-2 rounded-full shadow-sm" style={{backgroundColor: tag.color}}></span>
                                  {tag.name}
                              </button>
                          ))}
                          {tags.length === 0 && <div className="text-center p-2 text-xs text-gray-400">Nenhuma tag criada.</div>}
                      </div>
                  </div>
              </div>

              <div className="flex-1 bg-gray-50/50 p-4">
                  <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider flex items-center gap-2"><Home size={16} className="text-emerald-600"/> Catálogo Rápido</h3>
                  <div className="space-y-3">
                      {properties.map(property => (
                          <div key={property.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
                              <div className="flex gap-3 mb-2">
                                  <img src={property.imageUrl} className="w-16 h-16 object-cover rounded-md bg-gray-200" alt="" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150'} />
                                  <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-gray-800 text-xs truncate">{property.name}</h4>
                                      <p className="text-xs font-bold text-emerald-600 mt-1">R$ {property.price.toLocaleString('pt-BR')}</p>
                                  </div>
                              </div>
                              <button onClick={() => sendPropertyCard(property)} className="w-full py-1.5 bg-gray-50 text-emerald-600 text-xs font-medium rounded border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-colors flex items-center justify-center gap-1">
                                  <Share size={12} /> Enviar Ficha
                              </button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* CONFIG QUICK REPLIES MODAL */}
      {isConfigRepliesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fadeIn max-h-[80vh] flex flex-col">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <Settings size={20} className="text-emerald-600"/> Respostas Rápidas
                      </h3>
                      <button onClick={() => setIsConfigRepliesOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-6 flex-1 overflow-y-auto">
                      {/* Add New */}
                      <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                          <h4 className="text-xs font-bold text-emerald-800 uppercase mb-3">Adicionar Nova</h4>
                          <div className="space-y-2">
                              <input 
                                  className="w-full text-sm p-2 border border-emerald-200 rounded focus:ring-2 focus:ring-emerald-500 outline-none" 
                                  placeholder="Título do Botão (ex: Oferta)"
                                  value={newReplyLabel}
                                  onChange={(e) => setNewReplyLabel(e.target.value)}
                              />
                              <textarea 
                                  className="w-full text-sm p-2 border border-emerald-200 rounded focus:ring-2 focus:ring-emerald-500 outline-none resize-none" 
                                  placeholder="Texto da mensagem..."
                                  rows={2}
                                  value={newReplyText}
                                  onChange={(e) => setNewReplyText(e.target.value)}
                              />
                              <button 
                                onClick={handleAddReply}
                                disabled={!newReplyLabel.trim() || !newReplyText.trim()}
                                className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-1"
                              >
                                  <Plus size={14} /> Adicionar
                              </button>
                          </div>
                      </div>

                      {/* List Existing */}
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Respostas Salvas</h4>
                      <div className="space-y-2">
                          {quickReplies.map(reply => (
                              <div key={reply.id} className="flex items-start justify-between p-3 bg-white border border-gray-200 rounded-lg group hover:border-gray-300">
                                  <div>
                                      <span className="block text-sm font-bold text-gray-800 mb-1">{reply.label}</span>
                                      <p className="text-xs text-gray-500 line-clamp-2">{reply.text}</p>
                                  </div>
                                  <button 
                                    onClick={() => handleDeleteReply(reply.id)}
                                    className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          ))}
                          {quickReplies.length === 0 && <p className="text-center text-xs text-gray-400 py-4">Nenhuma resposta configurada.</p>}
                      </div>
                  </div>

                  <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
                      <button onClick={() => setIsConfigRepliesOpen(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100">
                          Fechar
                      </button>
                  </div>
              </div>
          </div>
      )}

       {/* TAGS MODAL */}
       {isTagModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fadeIn">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <Tag size={20} className="text-emerald-600"/> Nova Etiqueta
                      </h3>
                      <button onClick={() => setIsTagModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-6">
                      <div className="mb-4">
                          <label className="block text-xs font-bold text-gray-700 mb-2">Nome da Etiqueta</label>
                          <input 
                              className="w-full text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none mb-4"
                              placeholder="Ex: Cliente VIP"
                              value={newTagName}
                              onChange={e => setNewTagName(e.target.value)}
                           />
                           
                           <label className="block text-xs font-bold text-gray-700 mb-2">Cor da Etiqueta</label>
                           <div className="flex flex-wrap gap-2 mb-4">
                               {PRESET_TAG_COLORS.map(color => (
                                   <button 
                                     key={color}
                                     onClick={() => setNewTagColor(color)}
                                     className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${newTagColor === color ? 'border-gray-600 scale-110' : 'border-transparent'}`}
                                     style={{backgroundColor: color}}
                                   />
                               ))}
                               <div className="relative">
                                   <input 
                                      type="color"
                                      value={newTagColor}
                                      onChange={e => setNewTagColor(e.target.value)}
                                      className="w-8 h-8 p-0 border-0 rounded-full overflow-hidden opacity-0 absolute top-0 left-0 cursor-pointer"
                                   />
                                   <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 bg-white hover:bg-gray-50 pointer-events-none">
                                       <Palette size={14} />
                                   </div>
                               </div>
                           </div>

                          <button 
                              onClick={handleCreateTag}
                              disabled={!newTagName.trim()}
                              className="w-full py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                          >
                              Criar Etiqueta
                          </button>
                          <p className="text-[10px] text-gray-400 text-center mt-2">
                              A etiqueta será criada no sistema e sincronizada com o WhatsApp se conectado.
                          </p>
                      </div>
                  </div>
              </div>
          </div>
       )}

    </div>
  );
};

export default Chat;
