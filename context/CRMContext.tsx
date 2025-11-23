
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Lead, Property, Message, View, LeadStatus, FollowUpConfig, MessageTimerSettings, VoiceSettings } from '../types';
import { MOCK_LEADS, MOCK_PROPERTIES, DEFAULT_FOLLOWUP_CONFIG, DEFAULT_TIMER_SETTINGS, VOICE_PRESETS } from '../constants';
import { generateAIResponse, generateFollowUp, classifyLeadTemperature, generateAudioFromText, isAIConfigured, transcribeAudio } from '../services/geminiService';

export const DEFAULT_SYSTEM_PROMPT = `🚀 PROMPT FINAL – IA CORRETOR HUMANIZADA (VERSÃO COMPLETA + LEADS + ULTRA-HUMANA)

Você é uma IA que atua como um corretor HUMANO experiente, especializada em atendimento via WhatsApp para uma construtora.
Seu foco principal é simples:

👉 Levar o cliente ao ESTANDE DE VENDAS
👉 Endereço: Rua Isabel, nº 507 – Vila Esperança

Seja natural, leve e humano. Nunca pareça robô.

--- REGRAS DE INTEGRAÇÃO DO SISTEMA (TÉCNICO) ---
1. USAR DADOS REAIS: Consulte a seção "LISTA DE IMÓVEIS ATUALIZADA" (que será fornecida abaixo) para preços, tipologias e specs. Não invente dados.
2. ENVIO DE MÍDIA (OBRIGATÓRIO QUANDO SOLICITADO):
   - Se o cliente pedir fotos/imagens -> Responda o texto e, em uma NOVA LINHA, adicione a tag: [SEND_PHOTO]
   - Se o cliente pedir vídeo/tour -> Responda o texto e, em uma NOVA LINHA, adicione a tag: [SEND_VIDEO]
   - Se o cliente pedir planta/layout -> Responda o texto e, em uma NOVA LINHA, adicione a tag: [SEND_PLAN]
   *Nota: Use essas tags apenas se a mídia estiver marcada como DISPONÍVEL nos dados do imóvel.*

---

🟦 REGRAS DE HUMANIZAÇÃO (APLICAR SEMPRE)

1. Use o nome do cliente sempre que possível.
2. Mensagens curtas e separadas por ENTER (cada linha = um balão).
3. Não faça textões.
4. Seja simpático, mas sem exagerar.
5. Use frases naturais, como um corretor conversando no WhatsApp.
6. Sempre terminar com uma pergunta.
7. Construir conexão: mostrar atenção, comentar o que o cliente perguntou, responder com naturalidade.
8. Se a IA não souber responder algo:
→ Não responder ao cliente.
→ Retornar ao CRM: “ACIONAR CORRETOR HUMANO – IA SEM DADOS SUFICIENTES”

---

🟩 REGRAS ESPECIAIS PARA LEADS

1. Sempre agradecer o interesse no anúncio, formulário ou site.
2. Identificar rapidamente o objetivo do cliente:
   - Preço
   - Quartos
   - Localização
   - Visita
3. Convidar o cliente para visitar o estande SEMPRE que houver chance.
4. Falar do decorado (forte conversão).
5. Sempre reforçar o endereço:
👉 Rua Isabel, 507 – Vila Esperança

---

💬 SCRIPTS GERAIS (ULTRA-HUMANIZADOS)

(mensagens curtas, naturais e extremamente humanas)

1. Abertura padrão (lead vindo de anúncio / site / formulário)
"Oi, {nome}! Tudo bem? 😊"
"Vi aqui seu interesse no {empreendimento} e vim te ajudar."
"No nosso estande na Rua Isabel, 507 – Vila Esperança, a gente tem o decorado certinho pra você ver ao vivo."
"Você já conhece o estande ou seria sua primeira vez?"

2. Abertura ULTRA-humanizada (a mais natural possível)
"Oi, {nome}! Tudo certinho por aí? 👋😊"
"Vi seu interesse aqui no {empreendimento} e já vim te atender rapidinho."
"Lá no nosso estande, na Rua Isabel, 507 – Vila Esperança, tem um decorado bem legal pra você ver pessoalmente."
"Você costuma passar por essa região?"

3. Lead que pediu preço
"Claro, {nome}! Te passo sim 😄"
"Você tá olhando mais 2 ou 3 quartos?"
(Depois da resposta)
"Show! Essas opções você consegue ver direitinho no decorado lá na Rua Isabel, 507 – Vila Esperança."
"Quer passar lá hoje ou te encaixo amanhã?"

4. Lead que só está “curioso”
"Totalmente normal, {nome} 😄"
"A gente sempre recomenda dar uma passada lá no estande na Rua Isabel, 507 – Vila Esperança."
"Vendo o decorado, tudo fica mais claro na cabeça."
"Você consegue ir lá essa semana?"

---

🔥 SCRIPTS DE OBJECÕES – VERSÃO ULTRA HUMANIZADA

Objeção: “Só tô olhando mesmo”
"Tranquilo demais, {nome} 😄"
"Mas olha… passar 10 min no estande já te dá uma visão real do projeto."
"E fica ali na Rua Isabel, 507 – Vila Esperança."
"Quer conhecer sem compromisso?"

Objeção: “Tô sem tempo agora”
"Te entendo total, {nome} 😅"
"A visita é bem rapidinha mesmo, coisa de 10 min."
"E o decorado ajuda muito a entender o valor do projeto."
"Qual horário te ajudaria mais nos próximos dias?"

Objeção: “Achei caro”
"Super entendo você, {nome}."
"Mas no estande a gente consegue te mostrar outras plantas, metragens e condições presenciais."
"Às vezes tem opções que não dá pra explicar por aqui."
"Você consegue passar na Rua Isabel, 507 pra dar uma olhadinha?"

Objeção: “Preciso ver com meu marido/esposa”
"Perfeito, {nome}, faz todo sentido 😊"
"Que tal vocês irem juntos no estande na Rua Isabel, 507 – Vila Esperança?"
"O decorado ajuda muito na decisão."
"Qual dia seria melhor pros dois?"

---

🌱 SCRIPTS DE NUTRIÇÃO – PARA LEADS QUE DEMORAM A RESPONDER

Nutrição leve
"Oi, {nome}! Tudo bem por aí?"
"Só passando pra ver se ainda tem interesse no {empreendimento} 😊"
"No estande da Rua Isabel, 507 – Vila Esperança o decorado tá disponível pra visita."
"Quer dar uma passadinha?"

Nutrição com novidade
"{nome}, entrou novidade no empreendimento 👀"
"Se quiser, posso te mostrar tudo no estande lá na Rua Isabel, 507."
"Quando você consegue ir?"

Nutrição com gatilho de oportunidade
"{nome}, algumas unidades estão com condições especiais essa semana."
"No estande consigo te mostrar exatamente quais são."
"Você prefere ir hoje ou amanhã?"

---

🏆 SCRIPTS 100% FOCADOS EM LEVAR O CLIENTE AO ESTANDE

Durante a conversa, o foco sempre volta para a visita:
"Você consegue passar no estande da Rua Isabel, 507 – Vila Esperança?"
"Posso te esperar lá hoje."
"A visita é rapidinha, vale a pena."
"O decorado te ajuda muito a visualizar."
"Quer que eu já deixe você agendado?"

---

🚫 REGRAS FINAIS IMPORTANTES

Se o cliente perguntar algo que a IA não possui dados suficientes →
Retornar ao CRM: “ACIONAR CORRETOR HUMANO – IA SEM DADOS SUFICIENTES”

Nunca inventar informações.
Nunca dizer que é IA.
Sempre parecer um corretor humano experiente.`;

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
  addLead: (name: string, phone: string, interestId?: string) => void;
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
        'não sei', 'não consigo', 'ajuda', 'acionar corretor humano'
      ];
  });
  
  const [aiAttentionTriggers, setAiAttentionTriggers] = useState<string[]>(() => {
      const saved = localStorage.getItem('crm_ai_triggers');
      return saved ? JSON.parse(saved) : [
        'vou chamar', 'transferir', 'um momento', 'não tenho essa informação', 'agendada', 'visita confirmada', 'acionar corretor humano'
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
  useEffect(() => {
      try {
          localStorage.setItem('crm_leads', JSON.stringify(leads));
      } catch (e) {
          console.error("Error saving leads to localStorage (Quota exceeded?)", e);
      }
  }, [leads]);

  useEffect(() => {
      try {
          const json = JSON.stringify(properties);
          localStorage.setItem('crm_properties', json);
      } catch (e: any) {
          if (e.name === 'QuotaExceededError' || e.toString().includes('Quota')) {
              alert("⛔ LIMITE DE ARMAZENAMENTO ATINGIDO\n\nO navegador não tem mais espaço para salvar novos dados. A última alteração foi desfeita para garantir que você não perca informações ao atualizar a página.\n\nDica: Remova imóveis antigos ou use imagens menores/comprimidas.");
              const saved = localStorage.getItem('crm_properties');
              if (saved) setProperties(JSON.parse(saved));
              else setProperties(MOCK_PROPERTIES);
          }
          console.error("Error saving properties to localStorage", e);
      }
  }, [properties]);

  useEffect(() => { localStorage.setItem('crm_system_instruction', systemInstruction); }, [systemInstruction]);
  useEffect(() => { localStorage.setItem('crm_blacklist', JSON.stringify(blacklist)); }, [blacklist]);
  useEffect(() => { localStorage.setItem('crm_user_triggers', JSON.stringify(userAttentionTriggers)); }, [userAttentionTriggers]);
  useEffect(() => { localStorage.setItem('crm_ai_triggers', JSON.stringify(aiAttentionTriggers)); }, [aiAttentionTriggers]);
  useEffect(() => { localStorage.setItem('crm_followup_config', JSON.stringify(followUpConfig)); }, [followUpConfig]);
  useEffect(() => { localStorage.setItem('crm_timers', JSON.stringify(timerSettings)); }, [timerSettings]);
  useEffect(() => { localStorage.setItem('crm_voice', JSON.stringify(voiceSettings)); }, [voiceSettings]);
  useEffect(() => { localStorage.setItem('crm_ai_pause', aiPauseDuration.toString()); }, [aiPauseDuration]);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.volume = 0.5;
    audioRef.current.load();
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const leadsRequiringAttention = leads.some(l => l.requiresAttention);
    if (leadsRequiringAttention) {
        if (!intervalRef.current) {
            let toggle = false;
            intervalRef.current = window.setInterval(() => {
                document.title = toggle ? "🔔 ATENÇÃO NECESSÁRIA" : "ConstrutoraGPT CRM";
                toggle = !toggle;
            }, 1000);
        }
        if (!soundLoopRef.current) {
            playNotificationSound();
            soundLoopRef.current = window.setInterval(() => {
                playNotificationSound();
            }, 3000);
        }
    } else {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            document.title = "ConstrutoraGPT CRM";
        }
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

  const addLead = (name: string, phone: string, interestId?: string) => {
      const newLead: Lead = {
          id: `l_${Date.now()}`,
          name,
          phone,
          status: LeadStatus.NEW,
          lastContact: new Date(),
          interestedInId: interestId,
          messages: [],
          unreadCount: 0,
          requiresAttention: false
      };
      setLeads(prev => [newLead, ...prev]);
  };

  const resolveAttention = (leadId: string) => {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, requiresAttention: false } : l));
  };

  const updateLeadStatus = (leadId: string, newStatus: LeadStatus) => {
      const lead = leads.find(l => l.id === leadId);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      if (lead) {
          if (newStatus === LeadStatus.NO_AI) {
              setBlacklist(prev => {
                  if (!prev.includes(lead.phone)) {
                      return [...prev, lead.phone];
                  }
                  return prev;
              });
          } else {
              setBlacklist(prev => prev.filter(phone => phone !== lead.phone));
          }
      }
  };

  const addToBlacklist = (phone: string) => {
      const cleanPhone = phone.trim();
      if (!blacklist.includes(cleanPhone)) {
          setBlacklist(prev => [...prev, cleanPhone]);
          setLeads(prev => prev.map(l => l.phone === cleanPhone ? { ...l, status: LeadStatus.NO_AI } : l));
      }
  };

  const removeFromBlacklist = (phone: string) => {
      setBlacklist(prev => prev.filter(p => p !== phone));
      setLeads(prev => prev.map(l => l.phone === phone && l.status === LeadStatus.NO_AI ? { ...l, status: LeadStatus.NEW } : l));
  };

  const updateApiKey = (key: string) => {
      if (key) localStorage.setItem('crm_gemini_api_key', key);
      else localStorage.removeItem('crm_gemini_api_key');
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
          if (!data.leads || !data.properties) throw new Error("Arquivo inválido");
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
              const isValid = data.every(p => p.id && p.name);
              if (!isValid) throw new Error("Formato inválido.");
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

  const sendMessage = useCallback(async (text: string, sender: 'user' | 'agent', isMedia = false, mediaUrl?: string, mediaType: 'image' | 'video' | 'audio' = 'image') => {
    if (!selectedLeadId) return;
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

    // Atualiza estado com a nova mensagem
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

    if (sender === 'user') {
        const currentLead = leads.find(l => l.id === selectedLeadId);
        if (currentLead && checkAttentionTriggers(text, 'user')) {
             setLeads(prev => prev.map(l => l.id === selectedLeadId ? { ...l, requiresAttention: true } : l));
        }
        if (currentLead) {
            if (blacklist.includes(currentLead.phone) || currentLead.status === LeadStatus.NO_AI) return;
            if (currentLead.aiPausedUntil && new Date() < currentLead.aiPausedUntil) return;

            if (timerSettings.thinkingTime > 0) {
                await new Promise(resolve => setTimeout(resolve, timerSettings.thinkingTime * 1000));
            }
             const freshLead = leads.find(l => l.id === selectedLeadId); 
             if(!freshLead) return;

             // --- LÓGICA DE TRANSCRIÇÃO E CONTEXTO DE ÁUDIO ---
             let contextText = text;
             
             // Se o usuário mandou áudio, transcrevemos para o contexto da IA
             if (mediaType === 'audio' && mediaUrl) {
                setAiActivity('typing'); // Mostra que a IA está "ouvindo"/processando
                try {
                    const transcription = await transcribeAudio(mediaUrl);
                    if (transcription) {
                        contextText = transcription;
                        // Atualiza a mensagem original no estado com a transcrição
                        setLeads(prev => prev.map(l => {
                            if (l.id === selectedLeadId) {
                                return {
                                    ...l,
                                    messages: l.messages.map(m => m.id === newMessage.id ? { ...m, transcription } : m)
                                };
                            }
                            return l;
                        }));
                    }
                } catch (e) {
                    console.error("Erro na transcrição automática", e);
                }
                setAiActivity('idle');
             }

             // Monta o histórico incluindo a mensagem atual já com contexto de texto (seja transcrito ou original)
             const historyForAI = [...freshLead.messages, { ...newMessage, transcription: mediaType === 'audio' ? contextText : undefined, text: contextText }];
             
             const rawResponseText = await generateAIResponse(freshLead, properties, historyForAI, systemInstruction);
             
             // --- EXTRAÇÃO DE TAGS DE MÍDIA (Movido para antes da decisão de envio) ---
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
                    if (interestedProp.floorPlans && interestedProp.floorPlans.length > 0) {
                        mediaToSend = { url: interestedProp.floorPlans[0], type: 'image', caption: `📐 Planta Baixa: ${interestedProp.name}` };
                    } else if (interestedProp.units && interestedProp.units.some(u => u.image)) {
                        const unitWithPlan = interestedProp.units.find(u => u.image);
                        if (unitWithPlan) {
                             mediaToSend = { url: unitWithPlan.image!, type: 'image', caption: `📐 Planta: ${unitWithPlan.name}` };
                        }
                    }
                    finalText = rawResponseText.replace('[SEND_PLAN]', '').trim();
                }
             }

             // --- ENVIO DE MÍDIA SE EXISTIR ---
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

             // --- LÓGICA DE MODALIDADE DE RESPOSTA (ESPELHAMENTO) ---
             // Se o usuário mandou áudio, a IA responde com áudio. Se texto, texto.
             
             let audioSent = false;

             if (mediaType === 'audio') {
                 setAiActivity('recording');
                 // Remove asteriscos do markdown para o TTS falar melhor
                 const textForTTS = finalText.replace(/\*/g, '');
                 const audioUrl = await generateAudioFromText(textForTTS, voiceSettings.voiceName);
                 
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
                                     mediaUrl: audioUrl,
                                     mediaType: 'audio',
                                     transcription: finalText // Salvar o texto original como transcrição para visualização
                                 }],
                                 unreadCount: 0
                             };
                         }
                         return l;
                     }));
                     audioSent = true;
                 }
                 setAiActivity('idle');
             }

             // Se não foi enviado áudio (porque a entrada era texto OU falha na geração de áudio), envia texto
             if (!audioSent) {
                const textChunks = finalText.split(/\n+/).filter(chunk => chunk.trim().length > 0);
                let attentionNeeded = false;
                for (const chunk of textChunks) {
                    setAiActivity('typing');
                    const typingDuration = Math.min(chunk.length * timerSettings.charDelay, timerSettings.maxDelay);
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
                    if (checkAttentionTriggers(chunk, 'ai')) attentionNeeded = true;
                    setAiActivity('idle');
                    await new Promise(resolve => setTimeout(resolve, 600)); 
                }
                if (attentionNeeded) {
                    setLeads(prev => prev.map(l => l.id === selectedLeadId ? { ...l, requiresAttention: true } : l));
                }
             }

             const newTemp = await classifyLeadTemperature([...historyForAI, { id: 'temp', sender: 'agent', text: finalText, timestamp: new Date() }]);
             if (newTemp) setLeads(prev => prev.map(l => l.id === selectedLeadId ? { ...l, status: newTemp } : l));
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
      currentView, setCurrentView, leads, properties, selectedLeadId, setSelectedLeadId, sendMessage, updateProperty, addProperty, addLead,
      generateAIFollowUp, aiActivity, systemInstruction, setSystemInstruction, whatsappStatus, setWhatsappStatus, resolveAttention,
      userAttentionTriggers, setUserAttentionTriggers, aiAttentionTriggers, setAiAttentionTriggers, updateLeadStatus,
      followUpConfig, setFollowUpConfig, resetFollowUpConfig, aiPauseDuration, setAiPauseDuration, timerSettings, setTimerSettings,
      voiceSettings, setVoiceSettings, blacklist, addToBlacklist, removeFromBlacklist, updateApiKey, isAiReady,
      exportData, importData, exportProperties, importProperties, clearAllData
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
