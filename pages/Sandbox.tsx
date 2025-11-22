
import React, { useState, useRef, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import { generateAIResponse, transcribeAudio } from '../services/geminiService';
import { Message, Lead, LeadStatus } from '../types';
import { Send, Bot, User, RefreshCw, CheckCircle, AlertTriangle, Edit3, ArrowRight, Mic, Trash2, Play, Pause, ImageIcon, Film, Layout, Building2 } from 'lucide-react';

// --- Components Duplicated/Shared for Sandbox UI Consistency ---

// Custom Component for Audio Messages (Waveform + Transcription)
const AudioMessageBubble = ({ message }: { message: Message }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [transcription, setTranscription] = useState<string | undefined>(message.transcription);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const animationRef = useRef<number | null>(null);
    
    // Generate a "random" waveform visual based on message ID seed
    const barHeights = useRef<number[]>([]);
    if (barHeights.current.length === 0) {
        const seed = message.id.charCodeAt(message.id.length - 1);
        for (let i = 0; i < 20; i++) {
            const h = 30 + ((seed * i * 7) % 70); 
            barHeights.current.push(h);
        }
    }

    useEffect(() => {
        setTranscription(message.transcription);
    }, [message.transcription]);

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
            {/* Player UI */}
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
                                    style={{ 
                                        height: isPlaying ? `${Math.max(20, h + (Math.random() * 20 - 10))}%` : `${h}%`,
                                        opacity: isPast ? 1 : 0.6 
                                    }}
                                />
                            );
                        })}
                    </div>
                    <div className={`flex justify-between text-[10px] font-medium mt-1 ${textColor}`}>
                        <span>{isPlaying ? formatTime(audioRef.current?.currentTime || 0) : formatTime(duration)}</span>
                    </div>
                </div>
            </div>

            {/* Transcription Display */}
            {transcription && (
                <div className={`mt-2 p-2 rounded-lg text-xs leading-relaxed border ${isUser ? 'bg-emerald-800 border-emerald-600 text-white' : 'bg-gray-50 border-gray-100 text-gray-700'}`}>
                    <span className="opacity-50 block text-[10px] uppercase font-bold mb-1">Transcrição:</span>
                    "{transcription}"
                </div>
            )}
        </div>
    );
};

// --- Main Sandbox Component ---

const Sandbox: React.FC = () => {
  const { properties, systemInstruction } = useCRM();
  
  // Mock Lead for Context
  const [mockLead, setMockLead] = useState<Lead>({
      id: 'sandbox-lead',
      name: 'Cliente Teste',
      phone: '+55 11 99999-9999',
      status: LeadStatus.NEW,
      lastContact: new Date(),
      messages: [],
      unreadCount: 0
  });

  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'setup' | 'chat'>('setup');
  
  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isLoading]);

  // Cleanup recording on unmount
  useEffect(() => {
      return () => {
          if (timerRef.current) clearInterval(timerRef.current);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop();
          }
      };
  }, []);

  const startSimulation = () => {
      // If no property selected, default to the FIRST one (or the last added if we wanted, but let's be predictable)
      if (!mockLead.interestedInId && properties.length > 0) {
          setMockLead(prev => ({ ...prev, interestedInId: properties[0].id }));
      }
      setCurrentStep('chat');
      setHistory([{
          id: 'intro',
          sender: 'system',
          text: 'Simulação iniciada. Envie uma mensagem para testar.',
          timestamp: new Date()
      }]);
  };

  const resetSimulation = () => {
      setHistory([]);
      setCurrentStep('setup');
      setMockLead({ ...mockLead, name: 'Cliente Teste', interestedInId: undefined });
  };

  const handleSendMessage = async (text: string = input, isAudio: boolean = false, audioUrl?: string) => {
    if (!text.trim() && !isAudio) return;

    const newMessage: Message = {
        id: Date.now().toString(),
        sender: 'user',
        text: text,
        timestamp: new Date(),
        isMedia: isAudio,
        mediaUrl: audioUrl,
        mediaType: isAudio ? 'audio' : undefined
    };

    const newHistory = [...history, newMessage];
    setHistory(newHistory);
    setInput('');
    setIsLoading(true);

    try {
        // 1. If audio, transcribe first
        let processedHistory = [...newHistory];
        
        if (isAudio && audioUrl) {
             const transcription = await transcribeAudio(audioUrl);
             
             if (transcription) {
                 newMessage.transcription = transcription;
                 processedHistory = newHistory.map(m => m.id === newMessage.id ? newMessage : m);
                 setHistory(processedHistory);
             }
        }

        // 2. Generate Response
        const rawResponseText = await generateAIResponse(mockLead, properties, processedHistory, systemInstruction);

        // --- ROBUST MEDIA TAG DETECTION (Sandbox Version) ---
        // Regex to catch tags like [SEND_PHOTO], [SEND PHOTO], [SEND-PHOTO], case insensitive
        const photoRegex = /\[SEND[-_\s]?PHOTO\]/i;
        const videoRegex = /\[SEND[-_\s]?VIDEO\]/i;
        const planRegex = /\[SEND[-_\s]?PLAN\]/i;
        
        let finalText = rawResponseText;
        let mediaMessage: Message | null = null;

        // Determine which property to show media for
        const interestedProp = properties.find(p => p.id === mockLead.interestedInId) || properties[0];

        if (interestedProp) {
            // PHOTO LOGIC
            if (photoRegex.test(rawResponseText)) {
                const imgUrl = (interestedProp.images && interestedProp.images.length > 0) 
                    ? interestedProp.images[0] 
                    : interestedProp.imageUrl;
                
                mediaMessage = {
                    id: Date.now().toString() + 'media',
                    sender: 'agent',
                    text: `📸 Foto: ${interestedProp.name}`,
                    timestamp: new Date(),
                    isMedia: true,
                    mediaUrl: imgUrl,
                    mediaType: 'image'
                };
                finalText = rawResponseText.replace(photoRegex, '').trim();
            }
            // VIDEO LOGIC
            else if (videoRegex.test(rawResponseText)) {
                let videoUrl = interestedProp.videos && interestedProp.videos.length > 0 ? interestedProp.videos[0] : null;
                let mediaType: 'video' | 'image' = 'video';
                let caption = `🎥 Vídeo: ${interestedProp.name}`;

                // Fallback to Image if no video
                if (!videoUrl) {
                     videoUrl = (interestedProp.images && interestedProp.images.length > 0) ? interestedProp.images[0] : interestedProp.imageUrl;
                     mediaType = 'image';
                     caption = `🎥 Vídeo indisponível. Veja a foto de: ${interestedProp.name}`;
                }

                mediaMessage = {
                    id: Date.now().toString() + 'media',
                    sender: 'agent',
                    text: caption,
                    timestamp: new Date(),
                    isMedia: true,
                    mediaUrl: videoUrl!,
                    mediaType: mediaType
                };
                finalText = rawResponseText.replace(videoRegex, '').trim();
            }
            // PLAN LOGIC
            else if (planRegex.test(rawResponseText)) {
                let planUrl: string | null = null;
                let caption = `📐 Planta Baixa: ${interestedProp.name}`;

                // 1. Check General Floor Plans
                if (interestedProp.floorPlans && interestedProp.floorPlans.length > 0) {
                    planUrl = interestedProp.floorPlans[0];
                } 
                // 2. Check Units
                else if (interestedProp.units && interestedProp.units.some(u => u.image)) {
                    const unitWithPlan = interestedProp.units.find(u => u.image);
                    if (unitWithPlan) {
                        planUrl = unitWithPlan.image!;
                        caption = `📐 Planta: ${unitWithPlan.name}`;
                    }
                }

                // 3. Fallback to Main Image if absolutely no plan exists (Better than sending nothing)
                if (!planUrl) {
                    planUrl = interestedProp.imageUrl;
                    caption = "📐 Planta não disponível. Visualização do imóvel:";
                }

                mediaMessage = {
                    id: Date.now().toString() + 'media',
                    sender: 'agent',
                    text: caption,
                    timestamp: new Date(),
                    isMedia: true,
                    mediaUrl: planUrl!,
                    mediaType: 'image'
                };
                
                finalText = rawResponseText.replace(planRegex, '').trim();
            }
        }

        // 3. Update History (Text FIRST, then Media)
        const aiMessage: Message = {
            id: Date.now().toString() + 'ai',
            sender: 'agent',
            text: finalText,
            timestamp: new Date()
        };

        const nextMessages = [aiMessage];
        if (mediaMessage) {
            nextMessages.push(mediaMessage);
        }

        setHistory(prev => [...prev, ...nextMessages]);

    } catch (error) {
        setHistory(prev => [...prev, {
            id: Date.now().toString() + 'error',
            sender: 'system',
            text: 'Erro ao gerar resposta. Verifique sua API Key.',
            timestamp: new Date()
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  // --- Audio Recording Logic ---

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
              
              handleSendMessage(`Mensagem de Voz (${durationStr})`, true, audioUrl);
              
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

  const activePropertyName = properties.find(p => p.id === mockLead.interestedInId)?.name || "Nenhum (Geral)";

  return (
    <div className="p-8 bg-gray-50 min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700">
                <RefreshCw size={28} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Simulador de IA</h2>
                <p className="text-sm text-gray-500">Teste o comportamento da IA em um ambiente seguro antes de ativar.</p>
            </div>
        </div>
        
        {currentStep === 'chat' && (
            <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
                    <Building2 size={16} className="text-emerald-600" />
                    <span className="text-xs text-emerald-800">Imóvel Ativo: <strong>{activePropertyName}</strong></span>
                </div>
                <button 
                    onClick={resetSimulation}
                    className="text-gray-500 hover:text-red-600 flex items-center gap-2 text-sm font-medium px-4 py-2 bg-white rounded-lg border border-gray-200 hover:bg-red-50 transition-colors"
                >
                    <Trash2 size={16} /> Reiniciar Teste
                </button>
            </div>
        )}
      </div>

      {currentStep === 'setup' ? (
          <div className="max-w-2xl mx-auto w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-fadeIn mt-8">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Edit3 size={20} className="text-emerald-600" /> Configuração do Cenário
              </h3>
              
              <div className="space-y-6">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Cliente Fictício</label>
                      <input 
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={mockLead.name}
                        onChange={(e) => setMockLead({...mockLead, name: e.target.value})}
                      />
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Interesse em algum Imóvel?</label>
                      <select 
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                        onChange={(e) => setMockLead({...mockLead, interestedInId: e.target.value || undefined})}
                        value={mockLead.interestedInId || ''}
                      >
                          <option value="">Não, interesse geral (Usa o primeiro da lista)</option>
                          {properties.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                          ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Se você acabou de adicionar um imóvel, selecione-o aqui para testar suas fotos/plantas.</p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h4 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-2"><CheckCircle size={14}/> O que será testado:</h4>
                      <ul className="text-sm text-blue-700 space-y-1 list-disc pl-4">
                          <li>Personalidade definida nas configurações</li>
                          <li>Conhecimento sobre os imóveis cadastrados</li>
                          <li>Regras de envio de fotos/vídeos</li>
                          <li>Capacidade de entendimento de áudio (Transcrição)</li>
                      </ul>
                  </div>

                  <button 
                    onClick={startSimulation}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                      Iniciar Simulação <ArrowRight size={18} />
                  </button>
              </div>
          </div>
      ) : (
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden animate-fadeIn max-w-5xl mx-auto w-full h-[600px]">
              
              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#e5ddd5] custom-scrollbar" style={{ backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
                  {history.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${msg.sender === 'user' ? 'bg-emerald-600 text-white' : (msg.sender === 'system' ? 'bg-gray-400 text-white' : 'bg-white text-emerald-600 border border-gray-200')}`}>
                                    {msg.sender === 'user' ? <User size={14} /> : (msg.sender === 'system' ? <AlertTriangle size={14} /> : <Bot size={16} />)}
                                </div>
                                
                                <div className={`p-3 rounded-xl shadow-sm text-sm ${
                                    msg.sender === 'user' 
                                    ? 'bg-emerald-600 text-white rounded-tr-none' 
                                    : (msg.sender === 'system' ? 'bg-gray-200 text-gray-600 text-xs text-center w-full rounded-xl' : 'bg-white text-gray-800 rounded-tl-none')
                                }`}>
                                    {msg.sender === 'system' ? (
                                        <p className="italic">{msg.text}</p>
                                    ) : (
                                        <>
                                            {/* MEDIA DISPLAY LOGIC FOR SANDBOX */}
                                            {msg.isMedia ? (
                                                <div className="flex flex-col min-w-[200px]">
                                                    {msg.mediaType === 'audio' ? (
                                                        <div className={`p-1 ${msg.sender === 'user' ? '' : 'bg-gray-50 rounded'}`}>
                                                            <AudioMessageBubble message={msg} />
                                                        </div>
                                                    ) : (
                                                        <div className="bg-black rounded-lg overflow-hidden mb-1 relative min-h-[150px] flex items-center justify-center bg-gray-100">
                                                            {msg.mediaType === 'video' ? (
                                                                <video 
                                                                    src={msg.mediaUrl} 
                                                                    controls 
                                                                    className="max-h-60 w-full object-contain bg-black"
                                                                />
                                                            ) : (
                                                                <img 
                                                                    src={msg.mediaUrl} 
                                                                    alt="Media" 
                                                                    className="max-h-60 w-full object-cover"
                                                                    onError={(e) => {
                                                                        // Fallback for broken images
                                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="p-4 text-center text-gray-400 text-xs"><p>Imagem indisponível</p></div>';
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    {msg.text && msg.mediaType !== 'audio' && (
                                                        <div className={`flex items-center gap-1.5 font-medium ${msg.sender === 'user' ? 'text-white' : 'text-gray-800'}`}>
                                                            {msg.mediaType === 'video' && <Film size={14}/>}
                                                            {msg.mediaType === 'image' && <ImageIcon size={14} />}
                                                            {msg.text}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                            )}
                                            
                                            <div className={`text-[10px] mt-1 flex items-center gap-1 ${msg.sender === 'user' ? 'text-emerald-200 justify-end' : 'text-gray-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </>
                                    )}
                                </div>
                          </div>
                      </div>
                  ))}
                  
                  {isLoading && (
                      <div className="flex justify-start">
                           <div className="flex max-w-[80%] gap-2">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-200">
                                    <Bot size={16} className="text-emerald-600" />
                                </div>
                                <div className="bg-white p-4 rounded-xl rounded-tl-none shadow-sm border border-gray-100 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-150"></div>
                                </div>
                           </div>
                      </div>
                  )}
                  <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-100">
                 <div className="flex items-end gap-2">
                    {isRecording ? (
                        <div className="flex-1 flex items-center gap-3 bg-red-50 rounded-xl px-4 py-3 border border-red-200 animate-pulse">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
                            <div className="flex-1 flex items-center gap-2">
                                <span className="text-red-600 font-bold min-w-[60px]">{formatDuration(recordingDuration)}</span>
                                <div className="h-4 flex gap-0.5 items-center">
                                     {[...Array(10)].map((_, i) => (
                                         <div key={i} className="w-1 bg-red-400 rounded-full animate-bounce" style={{ height: `${Math.random() * 100}%`, animationDuration: `${0.5 + Math.random()}s` }}></div>
                                     ))}
                                </div>
                                <span className="text-xs text-red-400 font-medium ml-2">Gravando...</span>
                            </div>
                            <button 
                                onClick={cancelRecording}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                            >
                                <Trash2 size={20} />
                            </button>
                            <button 
                                onClick={stopRecording}
                                className="p-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors shadow-md"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="Digite sua mensagem de teste..."
                                    className="w-full bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 resize-none max-h-32"
                                    rows={1}
                                />
                            </div>
                            
                            {input.trim() ? (
                                <button 
                                    onClick={() => handleSendMessage()}
                                    className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-md"
                                >
                                    <Send size={20} />
                                </button>
                            ) : (
                                <button 
                                    onClick={startRecording}
                                    className="p-3 bg-gray-100 text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-50 transition-colors"
                                    title="Gravar Áudio"
                                >
                                    <Mic size={20} />
                                </button>
                            )}
                        </>
                    )}
                 </div>
                 <p className="text-xs text-center text-gray-400 mt-2">
                     A IA usará as configurações definidas na aba "Treinamento" para responder.
                 </p>
              </div>
          </div>
      )}
    </div>
  );
};

export default Sandbox;
