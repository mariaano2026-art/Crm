
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Lead, Property, Message, View, LeadStatus, FollowUpConfig, MessageTimerSettings, VoiceSettings } from '../types';
import { MOCK_LEADS, MOCK_PROPERTIES, DEFAULT_FOLLOWUP_CONFIG, DEFAULT_TIMER_SETTINGS, VOICE_PRESETS } from '../constants';
import { generateAIResponse, generateFollowUp, classifyLeadTemperature, generateAudioFromText, isAIConfigured } from '../services/geminiService';

const DEFAULT_SYSTEM_PROMPT = `Você é uma IA de atendimento para uma construtora. Aja como um corretor humano experiente no WhatsApp.

REGRAS DE HUMANIZAÇÃO:
1. USE O NOME DO CLIENTE: Sempre que possível, inicie ou termine frases chamando o cliente pelo primeiro nome para criar conexão.
2. MENSAGENS FRACIONADAS: Não escreva blocos gigantes de texto. Divida suas ideias usando quebra de linha (ENTER). O sistema vai transformar cada linha em um balão de mensagem separado.
3. EXEMPLO:
   "Olá, João! Tudo bem?"
   "Vi que você gostou do Casa Bosque."
   "Ele é incrível mesmo, tem uma área gourmet ótima."
4. OBJETIVIDADE: Seja breve e direto.
5. CONTEXTO: Use os dados dos imóveis para ser preciso.
6. SEMPRE termine induzindo a uma resposta (pergunta).`;

export type AIActivityStatus = 'idle' | 'typing' | 'recording';

interface CRMContextType {
  currentView: View;
  setCurrentView: (view: View) => void;
  leads: Lead[];
  properties: Property[];
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  sendMessage: (text: string, sender: 'user' | 'agent', isMedia?: boolean, mediaUrl?: string, mediaType?: 'image' | 'video' | 'audio') => void;
  updateProperty: (property: Property) => void;
  generateAIFollowUp: () => Promise<void>;
  aiActivity: AIActivityStatus;
  addProperty: (property: Property) => void;
  systemInstruction: string;
  setSystemInstruction: (instruction: string) => void;
  whatsappStatus: 'connected' | 'disconnected';
  setWhatsappStatus: (status: 'connected' | 'disconnected') => void;
  resolveAttention: (leadId: string) => void;
  userAttentionTriggers: string[];
  setUserAttentionTriggers: (triggers: string[]) => void;
  aiAttentionTriggers: string[];
  setAiAttentionTriggers: (triggers: string[]) => void;
  updateLeadStatus: (leadId: string, newStatus: LeadStatus) => void;
  followUpConfig: FollowUpConfig;
  setFollowUpConfig: (config: FollowUpConfig) => void;
  resetFollowUpConfig: () => void;
  aiPauseDuration: number;
  setAiPauseDuration: (minutes: number) => void;
  timerSettings: MessageTimerSettings;
  setTimerSettings: (settings: MessageTimerSettings) => void;
  voiceSettings: VoiceSettings;
  setVoiceSettings: (settings: VoiceSettings) => void;
  blacklist: string[];
  addToBlacklist: (phone: string) => void;
  removeFromBlacklist: (phone: string) => void;
  updateApiKey: (key: string) => void;
  isAiReady: boolean;
  exportData: () => void;
  importData: (jsonData: string) => boolean;
  exportProperties: () => void;
  importProperties: (jsonData: string) => boolean;
  clearAllData: () => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

// Sonar Beep (Base64 WAV) - Short, pleasant notification sound
const NOTIFICATION_SOUND_B64 = "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; 
// Fallback simple beep if the above is truncated
const SIMPLE_BEEP = "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU";

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  // --- PERSISTENCE LOGIC START ---
  // Load initial state from LocalStorage or fallback to Mocks
  const [leads, setLeads] = useState<Lead[]>(() => {
      try {
          const saved = localStorage.getItem('crm_leads');
          return saved ? JSON.parse(saved) : MOCK_LEADS;
      } catch (e) {
          console.error("Failed to load leads from storage", e);
          return MOCK_LEADS;
      }
  });

  const [properties, setProperties] = useState<Property[]>(() => {
      try {
          const saved = localStorage.getItem('crm_properties');
          return saved ? JSON.parse(saved) : MOCK_PROPERTIES;
      } catch (e) {
          console.error("Failed to load properties from storage", e);
          return MOCK_PROPERTIES;
      }
  });

  // Blacklist State
  const [blacklist, setBlacklist] = useState<string[]>(() => {
      try {
          const saved = localStorage.getItem('crm_blacklist');
          return saved ? JSON.parse(saved) : [];
      } catch (e) {
          return [];
      }
  });
  // --- PERSISTENCE LOGIC END ---

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [aiActivity, setAiActivity] = useState<AIActivityStatus>('idle');

  // Load Settings from storage or default
  const [systemInstruction, setSystemInstruction] = useState(() => localStorage.getItem('crm_system_instruction') || DEFAULT_SYSTEM_PROMPT);
  const [whatsappStatus, setWhatsappStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [isAiReady, setIsAiReady] = useState<boolean>(isAIConfigured());
  
  const [userAttentionTriggers, setUserAttentionTriggers] = useState<string[]>(() => {
      const saved = localStorage.getItem('crm_user_triggers');
      return saved ? JSON.parse(saved) : [
        'humano', 'atendente', 'pessoa', 'falar com alguém', 
        'ligação', 'me liga', 'ligar', 
        'visita', 'agendar', 'marcar',
        'não sei', 'não consigo', 'ajuda'
      ];
  });
  
  const [aiAttentionTriggers, setAiAttentionTriggers] = useState<string[]>(() => {
      const saved = localStorage.getItem('crm_ai_triggers');
      return saved ? JSON.parse(saved) : [
        'vou chamar', 'transferir', 'um momento', 'não tenho essa informação', 'agendada', 'visita confirmada'
      ];
  });

  const [followUpConfig, setFollowUpConfig] = useState<FollowUpConfig>(() => {
      const saved = localStorage.getItem('crm_followup_config');
      return saved ? JSON.parse(saved) : DEFAULT_FOLLOWUP_CONFIG;
  });

  const [aiPauseDuration, setAiPauseDuration] = useState<number>(() => {
      const saved = localStorage.getItem('crm_ai_pause');
      return saved ? Number(saved) : 30;
  });

  const [timerSettings, setTimerSettings] = useState<MessageTimerSettings>(() => {
      const saved = localStorage.getItem('crm_timers');
      return saved ? JSON.parse(saved) : DEFAULT_TIMER_SETTINGS;
  });

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
      const saved = localStorage.getItem('crm_voice');
      return saved ? JSON.parse(saved) : VOICE_PRESETS[2]; // Default to Kore (Female/Calm)
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const soundLoopRef = useRef<number | null>(null);

  // --- SAVE TO LOCAL STORAGE EFFECTS ---
  
  // 1. Leads
  useEffect(() => {
      try {
          localStorage.setItem('crm_leads', JSON.stringify(leads));
      } catch (e) {
          console.error("Error saving leads to localStorage (Quota exceeded?)", e);
      }
  }, [leads]);

  // 2. Properties (Handle Quota)
  useEffect(() => {
      try {
          const json = JSON.stringify(properties);
          localStorage.setItem('crm_properties', json);
      } catch (e: any) {
          if (e.name === 'QuotaExceededError' || e.toString().includes('Quota')) {
              alert("⛔ LIMITE DE ARMAZENAMENTO ATINGIDO\n\nO navegador não tem mais espaço para salvar novos dados. A última alteração foi desfeita para garantir que você não perca informações ao atualizar a página.\n\nDica: Remova imóveis antigos ou use imagens menores/comprimidas.");
              
              // CRITICAL: Revert state to match localStorage so user doesn't see "ghost" data
              const saved = localStorage.getItem('crm_properties');
              if (saved) {
                  setProperties(JSON.parse(saved));
              } else {
                  // Fallback if nothing was ever saved
                  setProperties(MOCK_PROPERTIES);
              }
          }
          console.error("Error saving properties to localStorage", e);
      }
  }, [properties]);

  // 3. Other Settings
  useEffect(() => { localStorage.setItem('crm_system_instruction', systemInstruction); }, [systemInstruction]);
  useEffect(() => { localStorage.setItem('crm_blacklist', JSON.stringify(blacklist)); }, [blacklist]);
  useEffect(() => { localStorage.setItem('crm_user_triggers', JSON.stringify(userAttentionTriggers)); }, [userAttentionTriggers]);
  useEffect(() => { localStorage.setItem('crm_ai_triggers', JSON.stringify(aiAttentionTriggers)); }, [aiAttentionTriggers]);
  useEffect(() => { localStorage.setItem('crm_followup_config', JSON.stringify(followUpConfig)); }, [followUpConfig]);
  useEffect(() => { localStorage.setItem('crm_timers', JSON.stringify(timerSettings)); }, [timerSettings]);
  useEffect(() => { localStorage.setItem('crm_voice', JSON.stringify(voiceSettings)); }, [voiceSettings]);
  useEffect(() => { localStorage.setItem('crm_ai_pause', aiPauseDuration.toString()); }, [aiPauseDuration]);

  // -------------------------------------

  useEffect(() => {
    // Use Google's hosted sound if available, or fallback to local B64 if needed
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.volume = 0.5;
    audioRef.current.load();
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Auto-play was prevented. This is normal in browsers until user interacts.
                console.log("Audio play prevented (user interaction required):", error);
            });
        }
    }
  }, []);

  useEffect(() => {
    const leadsRequiringAttention = leads.some(l => l.requiresAttention);
    
    if (leadsRequiringAttention) {
        // 1. Title Flashing Logic
        if (!intervalRef.current) {
            let toggle = false;
            intervalRef.current = window.setInterval(() => {
                document.title = toggle ? "🔔 ATENÇÃO NECESSÁRIA" : "ConstrutoraGPT CRM";
                toggle = !toggle;
            }, 1000);
        }

        // 2. Sound Loop Logic (Repetitive Beep)
        if (!soundLoopRef.current) {
            playNotificationSound(); // Play immediately
            soundLoopRef.current = window.setInterval(() => {
                playNotificationSound();
            }, 3000); // Repeat every 3 seconds
        }

    } else {
        // Clear Title Interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            document.title = "ConstrutoraGPT CRM";
        }

        // Clear Sound Interval
        if (soundLoopRef.current) {
            clearInterval(soundLoopRef.current);
            soundLoopRef.current = null;
        }
    }

    return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (soundLoopRef.current) clearInterval(soundLoopRef.current);
    };
  }, [leads, playNotificationSound]);

  const updateProperty = (updatedProp: Property) => {
    setProperties(prev => prev.map(p => p.id === updatedProp.id ? updatedProp : p));
  };

  const addProperty = (newProp: Property) => {
    setProperties(prev => [...prev, newProp]);
  };

  const resolveAttention = (leadId: string) => {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, requiresAttention: false } : l));
  };

  // --- SYNC LOGIC: Pipeline <-> Blacklist ---
  const updateLeadStatus = (leadId: string, newStatus: LeadStatus) => {
      const lead = leads.find(l => l.id === leadId);
      
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));

      if (lead) {
          if (newStatus === LeadStatus.NO_AI) {
              // If moved to NO_AI column, add to blacklist if not already there
              setBlacklist(prev => {
                  if (!prev.includes(lead.phone)) {
                      return [...prev, lead.phone];
                  }
                  return prev;
              });
          } else {
              // If moved OUT of NO_AI column, optionally remove from blacklist?
              // Strategy: We remove it from blacklist so AI can work again.
              setBlacklist(prev => prev.filter(phone => phone !== lead.phone));
          }
      }
  };

  const addToBlacklist = (phone: string) => {
      const cleanPhone = phone.trim();
      if (!blacklist.includes(cleanPhone)) {
          setBlacklist(prev => [...prev, cleanPhone]);
          // Also update any existing lead with this phone to NO_AI status
          setLeads(prev => prev.map(l => l.phone === cleanPhone ? { ...l, status: LeadStatus.NO_AI } : l));
      }
  };

  const removeFromBlacklist = (phone: string) => {
      setBlacklist(prev => prev.filter(p => p !== phone));
      // Optionally move lead back to a generic status? Let's move to NEW or leave as NO_AI to be manually moved.
      // User likely wants AI to start working, so changing status is helpful.
      // We'll assume they stay in "NO_AI" until dragged out, OR we move them to "NEW" to signal they are active.
      // Let's move to NEW to visually confirm re-activation.
      setLeads(prev => prev.map(l => l.phone === phone && l.status === LeadStatus.NO_AI ? { ...l, status: LeadStatus.NEW } : l));
  };
  // ------------------------------------------

  const updateApiKey = (key: string) => {
      if (key) {
          localStorage.setItem('crm_gemini_api_key', key);
      } else {
          localStorage.removeItem('crm_gemini_api_key');
      }
      setIsAiReady(isAIConfigured());
  };

  const resetFollowUpConfig = () => {
      setFollowUpConfig(DEFAULT_FOLLOWUP_CONFIG);
  };

  const checkAttentionTriggers = (text: string, source: 'user' | 'ai'): boolean => {
      const lowerText = text.toLowerCase();
      const currentTriggers = source === 'user' ? userAttentionTriggers : aiAttentionTriggers;
      return currentTriggers.some(t => lowerText.includes(t.toLowerCase()));
  };

  // --- EXPORT / IMPORT / CLEAR DATA ---
  const exportData = () => {
      const data = {
          leads,
          properties,
          blacklist,
          systemInstruction,
          userAttentionTriggers,
          aiAttentionTriggers,
          followUpConfig,
          aiPauseDuration,
          timerSettings,
          voiceSettings,
          apiKey: localStorage.getItem('crm_gemini_api_key') || '',
          timestamp: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-crm-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const importData = (jsonString: string): boolean => {
      try {
          const data = JSON.parse(jsonString);
          
          // Validate basic structure
          if (!data.leads || !data.properties) {
              throw new Error("Arquivo inválido");
          }

          // Restore State
          setLeads(data.leads);
          setProperties(data.properties);
          setBlacklist(data.blacklist || []);
          setSystemInstruction(data.systemInstruction || DEFAULT_SYSTEM_PROMPT);
          setUserAttentionTriggers(data.userAttentionTriggers || []);
          setAiAttentionTriggers(data.aiAttentionTriggers || []);
          if (data.followUpConfig) setFollowUpConfig(data.followUpConfig);
          if (data.aiPauseDuration) setAiPauseDuration(data.aiPauseDuration);
          if (data.timerSettings) setTimerSettings(data.timerSettings);
          if (data.voiceSettings) setVoiceSettings(data.voiceSettings);
          if (data.apiKey) updateApiKey(data.apiKey);

          return true;
      } catch (e) {
          console.error("Import error:", e);
          return false;
      }
  };

  // --- PROPERTIES ONLY IMPORT/EXPORT ---
  const exportProperties = () => {
      const blob = new Blob([JSON.stringify(properties, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `imoveis-backup-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const importProperties = (jsonString: string): boolean => {
      try {
          const data = JSON.parse(jsonString);
          if (Array.isArray(data)) {
              // Basic validation to check if items look like properties
              const isValid = data.every(p => p.id && p.name);
              if (!isValid) throw new Error("Formato inválido. Esperava-se uma lista de imóveis.");
              
              setProperties(data);
              return true;
          }
          return false;
      } catch (e) {
          console.error("Properties Import error:", e);
          return false;
      }
  };

  const clearAllData = () => {
      localStorage.clear();
      window.location.reload();
  };
  // ------------------------------------

  const sendMessage = useCallback(async (text: string, sender: 'user' | 'agent', isMedia = false, mediaUrl?: string, mediaType: 'image' | 'video' | 'audio' = 'image') => {
    if (!selectedLeadId) return;

    // LOGIC FOR HUMAN INTERVENTION (Agent sends message)
    let newPausedUntil: Date | undefined = undefined;

    if (sender === 'agent') {
        resolveAttention(selectedLeadId);
        if (aiPauseDuration > 0) {
            newPausedUntil = new Date(Date.now() + aiPauseDuration * 60 * 1000);
        }
    }

    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      sender,
      text,
      timestamp: new Date(),
      isMedia,
      mediaUrl,
      mediaType
    };

    // Update State with User Message immediately
    setLeads(prevLeads => {
      return prevLeads.map(lead => {
        if (lead.id === selectedLeadId) {
          return {
            ...lead,
            messages: [...lead.messages, newMessage],
            lastContact: new Date(),
            unreadCount: sender === 'agent' ? 0 : lead.unreadCount + 1,
            aiPausedUntil: sender === 'agent' ? newPausedUntil : lead.aiPausedUntil
          };
        }
        return lead;
      });
    });

    // LOGIC FOR USER MESSAGE (Trigger AI)
    if (sender === 'user') {
        const currentLead = leads.find(l => l.id === selectedLeadId);
        
        // Check triggers immediately on user message to set alert
        if (currentLead && checkAttentionTriggers(text, 'user')) {
             setLeads(prev => prev.map(l => l.id === selectedLeadId ? { ...l, requiresAttention: true } : l));
        }

        if (currentLead) {
            // --- BLACKLIST / NO_AI CHECK ---
            if (blacklist.includes(currentLead.phone) || currentLead.status === LeadStatus.NO_AI) {
                console.log("AI skipped: Phone is blacklisted or status is NO_AI");
                return;
            }
            // -------------------------------

            if (currentLead.aiPausedUntil && new Date() < currentLead.aiPausedUntil) {
                console.log("AI is paused for this lead until:", currentLead.aiPausedUntil);
                return;
            }

            // --- HUMANIZATION LOGIC START ---
            
            // 1. Thinking Phase
            if (timerSettings.thinkingTime > 0) {
                await new Promise(resolve => setTimeout(resolve, timerSettings.thinkingTime * 1000));
            }

             const freshLead = leads.find(l => l.id === selectedLeadId); 
             if(!freshLead) return;
             
             const history = [...freshLead.messages, newMessage];

             // Call API
             const rawResponseText = await generateAIResponse(freshLead, properties, history, systemInstruction);
             
             // --- AUDIO RESPONSE LOGIC ---
             let audioUrl: string | null = null;
             if (mediaType === 'audio') {
                 setAiActivity('recording');
                 audioUrl = await generateAudioFromText(rawResponseText, voiceSettings.voiceName);
                 
                 if (audioUrl) {
                     setLeads(prev => prev.map(l => {
                         if (l.id === selectedLeadId) {
                             return {
                                 ...l,
                                 messages: [...l.messages, {
                                     id: Date.now().toString() + "audio",
                                     sender: 'agent',
                                     text: "Mensagem de Voz",
                                     timestamp: new Date(),
                                     isMedia: true,
                                     mediaUrl: audioUrl!,
                                     mediaType: 'audio'
                                 }],
                                 unreadCount: 0
                             };
                         }
                         return l;
                     }));
                     setAiActivity('idle');
                     return; 
                 }
             }

             setAiActivity('idle');

             // --- MEDIA LOGIC FIRST (Images/Video) ---
             let finalText = rawResponseText;
             let mediaToSend: { url: string, type: 'image' | 'video', caption: string } | null = null;

             const interestedProp = properties.find(p => p.id === freshLead.interestedInId) || properties[0];

             if (interestedProp) {
                if (rawResponseText.includes('[SEND_PHOTO]')) {
                    const imgUrl = (interestedProp.images && interestedProp.images.length > 0) 
                        ? interestedProp.images[0] 
                        : interestedProp.imageUrl;
                    mediaToSend = { url: imgUrl, type: 'image', caption: `📸 Foto: ${interestedProp.name}` };
                    finalText = rawResponseText.replace('[SEND_PHOTO]', '').trim();
                }
                else if (rawResponseText.includes('[SEND_VIDEO]')) {
                    if (interestedProp.videos && interestedProp.videos.length > 0) {
                        mediaToSend = { url: interestedProp.videos[0], type: 'video', caption: `🎥 Vídeo: ${interestedProp.name}` };
                    }
                    finalText = rawResponseText.replace('[SEND_VIDEO]', '').trim();
                }
                else if (rawResponseText.includes('[SEND_PLAN]')) {
                    // Check general floorPlans first, then fallback to units
                    if (interestedProp.floorPlans && interestedProp.floorPlans.length > 0) {
                        mediaToSend = { url: interestedProp.floorPlans[0], type: 'image', caption: `📐 Planta Baixa: ${interestedProp.name}` };
                    } else if (interestedProp.units && interestedProp.units.some(u => u.image)) {
                        // Fallback: Find first unit with a plan
                        const unitWithPlan = interestedProp.units.find(u => u.image);
                        if (unitWithPlan) {
                             mediaToSend = { url: unitWithPlan.image!, type: 'image', caption: `📐 Planta: ${unitWithPlan.name}` };
                        }
                    }
                    finalText = rawResponseText.replace('[SEND_PLAN]', '').trim();
                }
             }

             // Send Media Immediately if exists
             if (mediaToSend) {
                 setLeads(prev => prev.map(l => {
                     if (l.id === selectedLeadId) {
                         return {
                             ...l,
                             messages: [...l.messages, {
                                 id: Date.now().toString() + "media",
                                 sender: 'agent',
                                 text: mediaToSend!.caption,
                                 timestamp: new Date(),
                                 isMedia: true,
                                 mediaUrl: mediaToSend!.url,
                                 mediaType: mediaToSend!.type
                             }],
                             unreadCount: 0
                         };
                     }
                     return l;
                 }));
                 await new Promise(r => setTimeout(r, 1000));
             }

             // --- TEXT FRACTIONATION LOGIC ---
             const textChunks = finalText.split(/\n+/).filter(chunk => chunk.trim().length > 0);
             
             let attentionNeeded = false;

             for (const chunk of textChunks) {
                setAiActivity('typing');

                const typingDuration = Math.min(
                    chunk.length * timerSettings.charDelay, 
                    timerSettings.maxDelay
                );

                await new Promise(resolve => setTimeout(resolve, typingDuration));

                setLeads(prev => prev.map(l => {
                    if (l.id === selectedLeadId) {
                        return {
                            ...l,
                            messages: [...l.messages, {
                                id: Date.now().toString() + Math.random(),
                                sender: 'agent',
                                text: chunk.trim(),
                                timestamp: new Date()
                            }],
                            unreadCount: 0
                        };
                    }
                    return l;
                }));

                if (checkAttentionTriggers(chunk, 'ai')) {
                    attentionNeeded = true;
                }

                setAiActivity('idle');
                await new Promise(resolve => setTimeout(resolve, 600)); 
             }

             if (attentionNeeded) {
                 setLeads(prev => prev.map(l => l.id === selectedLeadId ? { ...l, requiresAttention: true } : l));
             }

             const newTemp = await classifyLeadTemperature([...history, { id: 'temp', sender: 'agent', text: finalText, timestamp: new Date() }]);
             if (newTemp) {
                setLeads(prev => prev.map(l => l.id === selectedLeadId ? { ...l, status: newTemp } : l));
             }
        }
    }
  }, [selectedLeadId, leads, properties, systemInstruction, userAttentionTriggers, aiAttentionTriggers, aiPauseDuration, timerSettings, voiceSettings, playNotificationSound, blacklist]);

  const generateAIFollowUp = async () => {
    if (!selectedLeadId) return;
    const lead = leads.find(l => l.id === selectedLeadId);
    if (!lead) return;

    if (timerSettings.thinkingTime > 0) {
        setAiActivity('idle'); 
        await new Promise(r => setTimeout(r, 1000)); 
    }

    const followUpText = await generateFollowUp(lead, properties, followUpConfig);
    
    const textChunks = followUpText.split(/\n+/).filter(chunk => chunk.trim().length > 0);

    for (const chunk of textChunks) {
        setAiActivity('typing');
        const typingDuration = Math.min(chunk.length * timerSettings.charDelay, timerSettings.maxDelay);
        await new Promise(r => setTimeout(r, typingDuration));
        
        sendMessage(chunk, 'agent'); 
        setAiActivity('idle');
        await new Promise(r => setTimeout(r, 600));
    }
  };

  return (
    <CRMContext.Provider value={{
      currentView,
      setCurrentView,
      leads,
      properties,
      selectedLeadId,
      setSelectedLeadId,
      sendMessage,
      updateProperty,
      addProperty,
      generateAIFollowUp,
      aiActivity,
      systemInstruction,
      setSystemInstruction,
      whatsappStatus,
      setWhatsappStatus,
      resolveAttention,
      userAttentionTriggers,
      setUserAttentionTriggers,
      aiAttentionTriggers,
      setAiAttentionTriggers,
      updateLeadStatus,
      followUpConfig,
      setFollowUpConfig,
      resetFollowUpConfig,
      aiPauseDuration,
      setAiPauseDuration,
      timerSettings,
      setTimerSettings,
      voiceSettings,
      setVoiceSettings,
      blacklist,
      addToBlacklist,
      removeFromBlacklist,
      updateApiKey,
      isAiReady,
      exportData,
      importData,
      exportProperties,
      importProperties,
      clearAllData
    }}>
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) throw new Error("useCRM must be used within CRMProvider");
  return context;
};
