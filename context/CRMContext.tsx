
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Lead, Property, Message, View, LeadStatus, FollowUpConfig, MessageTimerSettings, VoiceSettings, QuickReply, Tag, WhatsAppConfig } from '../types';
import { MOCK_LEADS, MOCK_PROPERTIES, DEFAULT_FOLLOWUP_CONFIG, DEFAULT_TIMER_SETTINGS, VOICE_PRESETS, DEFAULT_TAGS } from '../constants';
import { generateAIResponse, generateFollowUp, classifyLeadTemperature, generateAudioFromText, isAIConfigured, transcribeAudio } from '../services/geminiService';

export const DEFAULT_SYSTEM_PROMPT = `🚀 PROMPT FINAL – IA CORRETOR HUMANIZADA (VERSÃO DE ALTA CONVERSÃO)

Você é uma IA que atua como um corretor HUMANO experiente, especializada em atendimento via WhatsApp para uma construtora.
Seu objetivo é criar conexão e levar o cliente ao ESTANDE DE VENDAS de forma natural, usando psicologia de vendas (Soft Sell).

📍 ENDEREÇO DO DECORADO: Rua Isabel, nº 507 – Vila Esperança.

--- 🧠 PSICOLOGIA DE VENDAS (COMO AGIR) ---
1. NÃO PAREÇA UM ROBÔ. Seja leve, use emojis moderados e linguagem coloquial.
2. NÃO force a visita. Crie o desejo. Faça o cliente sentir que ir ao decorado é a melhor decisão para ELE.
3. A TÉCNICA DO "SOFT SELL":
   - Em vez de: "Venha visitar agora." (Agressivo)
   - Use: "O decorado tá lindo, vendo pessoalmente você consegue ter noção exata do espaço. O que acha de dar um pulo na Rua Isabel essa semana?" (Consultivo)
4. VARIE AS RESPOSTAS. Não repita sempre a mesma frase de encerramento.

--- 💬 SCRIPTS E MODELOS DE RESPOSTA ---

1. ABERTURA (Lead Novo / Vindo de Anúncio)
"Oi, {nome}! Tudo certinho por aí? 👋😊"
"Vi seu interesse aqui no {empreendimento} e vim te atender."
"Lá no nosso estande, na Rua Isabel, 507 – Vila Esperança, tem um decorado incrível pra você ver pessoalmente."
"Você costuma passar por essa região ou seria sua primeira vez lá?"

2. QUANDO O CLIENTE PEDE PREÇO (Gatilho de Valor)
"Claro, {nome}! O valor parte de R$ X. Mas temos condições diferentes dependendo do andar e da entrada."
"Essas opções de planta você consegue visualizar direitinho no decorado lá na Rua Isabel, 507."
"Quer que eu veja se tem horário vago pra amanhã ou prefere no fim de semana?"

3. TRATAMENTO DE OBJEÇÕES (COM EMPATIA)

- "Só estou olhando/Curioso":
"Tranquilo demais, {nome}! 😄 É bom pesquisar mesmo pra fazer a escolha certa."
"Mas olha… passar 10 min no estande já te dá uma visão real do projeto que foto nenhuma mostra."
"Fica ali na Rua Isabel, 507. Se quiser conhecer sem compromisso, me avisa."

- "Achei caro":
"Super entendo você, {nome}. O mercado deu uma subida mesmo."
"Mas no estande consigo te mostrar na ponta do lápis o potencial de valorização desse projeto."
"Você consegue passar na Rua Isabel, 507 pra gente simular sem compromisso?"

- "Estou sem tempo":
"Imagino, a correria tá grande pra todo mundo 😅"
"A visita é bem rapidinha mesmo, coisa de 15 min."
"Qual horário ficaria mais leve pra você nos próximos dias?"

4. NUTRIÇÃO (LEADS QUE PARARAM DE RESPONDER)
"Oi, {nome}! Tudo bem?"
"Só passando pra avisar que o decorado na Rua Isabel, 507 tá disponível pra visita e ficou lindo."
"Ainda tem interesse nesse perfil de imóvel?"

--- ⚙️ INTEGRAÇÃO COM O SISTEMA (TÉCNICO - OBRIGATÓRIO) ---
1. INVENTÁRIO: Você receberá uma lista de imóveis no final deste prompt. Use EXATAMENTE os preços, metragens e nomes de lá.
2. MÍDIA: Se o cliente pedir fotos, vídeos ou plantas, ou se você achar que vai ajudar a convencer:
   - Responda o texto e pule uma linha.
   - Escreva a tag correspondente: [SEND_PHOTO], [SEND_VIDEO] ou [SEND_PLAN].
3. LIMITES: Se o cliente perguntar algo muito específico que não está nos dados (ex: jurídico, permuta complexa), não invente.
   - Responda: "ACIONAR CORRETOR HUMANO – IA SEM DADOS SUFICIENTES" (Isso notificará a equipe real).

--- OBJETIVO FINAL ---
O sucesso da conversa é o cliente concordar em ir à Rua Isabel, 507.
Toda sua conversa deve, sutilmente, guiar para isso.`;

export const DEFAULT_QUICK_REPLIES: QuickReply[] = [
    { id: 'qr_1', label: "Agendar Visita", text: "Que tal agendarmos uma visita para você conhecer pessoalmente? Qual horário fica bom para você?" },
    { id: 'qr_2', label: "Pedir Proposta", text: "Gostaria de fazer uma proposta? Consigo verificar condições especiais hoje." },
    { id: 'qr_3', label: "Enviar Localização", text: "Vou te enviar a localização exata pelo Google Maps." },
    { id: 'qr_4', label: "Financiamento", text: "Trabalhamos com todos os bancos. Gostaria de uma simulação?" }
];

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
  quickReplies: QuickReply[];
  setQuickReplies: (replies: QuickReply[]) => void;
  updateApiKey: (key: string) => void;
  isAiReady: boolean;
  exportData: () => void;
  importData: (jsonData: string) => boolean;
  exportProperties: () => void;
  importProperties: (jsonData: string) => boolean;
  clearAllData: () => void;
  
  // WhatsApp Config
  whatsappConfig: WhatsAppConfig;
  setWhatsappConfig: (config: WhatsAppConfig) => void;

  // Tag System
  tags: Tag[];
  addTag: (name: string, color: string) => void;
  removeTag: (id: string) => void;
  assignTagToLead: (leadId: string, tagId: string) => void;
  removeTagFromLead: (leadId: string, tagId: string) => void;

  // Chat Actions
  clearChat: (leadId: string) => void;
  deleteLead: (leadId: string) => void;
  archiveLead: (leadId: string) => void;
  unarchiveLead: (leadId: string) => void;
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

  // Quick Replies State
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>(() => {
      try {
          const saved = localStorage.getItem('crm_quick_replies');
          return saved ? JSON.parse(saved) : DEFAULT_QUICK_REPLIES;
      } catch (e) {
          return DEFAULT_QUICK_REPLIES;
      }
  });

  // Tags State
  const [tags, setTags] = useState<Tag[]>(() => {
      try {
          const saved = localStorage.getItem('crm_tags');
          return saved ? JSON.parse(saved) : DEFAULT_TAGS;
      } catch (e) {
          return DEFAULT_TAGS;
      }
  });

  // WhatsApp Config State
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>(() => {
      try {
          const saved = localStorage.getItem('crm_whatsapp_config');
          return saved ? JSON.parse(saved) : { accessToken: '', phoneNumberId: '', wabaId: '' };
      } catch (e) {
          return { accessToken: '', phoneNumberId: '', wabaId: '' };
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
  useEffect(() => { localStorage.setItem('crm_quick_replies', JSON.stringify(quickReplies)); }, [quickReplies]);
  useEffect(() => { localStorage.setItem('crm_tags', JSON.stringify(tags)); }, [tags]);
  useEffect(() => { localStorage.setItem('crm_whatsapp_config', JSON.stringify(whatsappConfig)); }, [whatsappConfig]);
  useEffect(() => { localStorage.setItem('crm_user_triggers', JSON.stringify(userAttentionTriggers)); }, [userAttentionTriggers]);
  useEffect(() => { localStorage.setItem('crm_ai_triggers', JSON.stringify(aiAttentionTriggers)); }, [aiAttentionTriggers]);
  useEffect(() => { localStorage.setItem('crm_followup_config', JSON.stringify(followUpConfig)); }, [followUpConfig]);
  useEffect(() => { localStorage.setItem('crm_timers', JSON.stringify(timerSettings)); }, [timerSettings]);
  useEffect(() => { localStorage.setItem('crm_voice', JSON.stringify(voiceSettings)); }, [voiceSettings]);
  useEffect(() => { localStorage.setItem('crm_ai_pause', aiPauseDuration.toString()); }, [aiPauseDuration]);

  // Sync WhatsApp Connection Status based on tokens
  useEffect(() => {
      if (whatsappConfig.accessToken && whatsappConfig.phoneNumberId) {
          setWhatsappStatus('connected');
      } else {
          setWhatsappStatus('disconnected');
      }
  }, [whatsappConfig]);

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
          requiresAttention: false,
          tags: [],
          archived: false
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

  // --- TAG MANAGEMENT FUNCTIONS (REAL WHATSAPP SYNC) ---
  const syncTagToWhatsApp = async (tag: Tag) => {
      // Stub function: This would effectively call the Meta API to create a Label
      if (whatsappConfig.accessToken && whatsappConfig.phoneNumberId) {
          console.log(`[REAL SYNC] Creating/Updating Label on WhatsApp: ${tag.name}`);
          // const response = await fetch(`https://graph.facebook.com/v18.0/${whatsappConfig.phoneNumberId}/...`);
      }
  };

  const addTag = (name: string, color: string) => {
      const newTag: Tag = { id: Date.now().toString(), name, color };
      setTags(prev => [...prev, newTag]);
      syncTagToWhatsApp(newTag);
  };

  const removeTag = (id: string) => {
      setTags(prev => prev.filter(t => t.id !== id));
      // Clean up deleted tag from leads
      setLeads(prev => prev.map(l => ({
          ...l,
          tags: l.tags?.filter(tId => tId !== id)
      })));
  };

  const assignTagToLead = (leadId: string, tagId: string) => {
      setLeads(prev => prev.map(l => {
          if (l.id === leadId) {
              const currentTags = l.tags || [];
              if (!currentTags.includes(tagId)) {
                  // Stub: Sync user label to WhatsApp
                  if (whatsappConfig.accessToken) {
                      console.log(`[REAL SYNC] Assigning Label ${tagId} to User ${l.phone}`);
                  }
                  return { ...l, tags: [...currentTags, tagId] };
              }
          }
          return l;
      }));
  };

  const removeTagFromLead = (leadId: string, tagId: string) => {
      setLeads(prev => prev.map(l => {
          if (l.id === leadId) {
              // Stub: Remove user label from WhatsApp
              if (whatsappConfig.accessToken) {
                  console.log(`[REAL SYNC] Removing Label ${tagId} from User ${l.phone}`);
              }
              return { ...l, tags: l.tags?.filter(t => t !== tagId) || [] };
          }
          return l;
      }));
  };

  // --- CHAT ACTIONS ---
  const clearChat = (leadId: string) => {
      if(confirm("Tem certeza que deseja apagar todas as mensagens desta conversa?")) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, messages: [] } : l));
      }
  };

  const deleteLead = (leadId: string) => {
      if(confirm("Tem certeza que deseja excluir este contato permanentemente?")) {
          setLeads(prev => prev.filter(l => l.id !== leadId));
          if(selectedLeadId === leadId) setSelectedLeadId(null);
      }
  };

  const archiveLead = (leadId: string) => {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, archived: true, requiresAttention: false, unreadCount: 0 } : l));
      if (selectedLeadId === leadId) {
          setSelectedLeadId(null);
      }
  };

  const unarchiveLead = (leadId: string) => {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, archived: false } : l));
  }

  const checkAttentionTriggers = (text: string, source: 'user' | 'ai'): boolean => {
      const lowerText = text.toLowerCase();
      const currentTriggers = source === 'user' ? userAttentionTriggers : aiAttentionTriggers;
      return currentTriggers.some(t => lowerText.includes(t.toLowerCase()));
  };

  const detectPropertyFromContext = (text: string): Property | undefined => {
      const lower = text.toLowerCase();
      // Simple logic: check if property name is inside the text
      return properties.find(p => lower.includes(p.name.toLowerCase()));
  };

  const exportData = () => {
      const data = {
          leads,
          properties,
          blacklist,
          quickReplies,
          tags,
          whatsappConfig,
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
          if (data.quickReplies) setQuickReplies(data.quickReplies);
          if (data.tags) setTags(data.tags);
          if (data.whatsappConfig) setWhatsappConfig(data.whatsappConfig);
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
            aiPausedUntil: sender === 'agent' ? newPausedUntil : lead.aiPausedUntil,
            archived: false // Sempre desarquiva se chegar mensagem nova
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
             
             if (mediaType === 'audio' && mediaUrl) {
                setAiActivity('typing'); 
                try {
                    const transcription = await transcribeAudio(mediaUrl);
                    if (transcription) {
                        contextText = transcription;
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

             const historyForAI = [...freshLead.messages, { ...newMessage, transcription: mediaType === 'audio' ? contextText : undefined, text: contextText }];
             
             const rawResponseText = await generateAIResponse(freshLead, properties, historyForAI, systemInstruction);
             
             const photoRegex = /\[SEND[-_\s]?PHOTO\]/i;
             const videoRegex = /\[SEND[-_\s]?VIDEO\]/i;
             const planRegex = /\[SEND[-_\s]?PLAN\]/i;

             let finalText = rawResponseText;
             let mediaToSend: { url: string, type: 'image' | 'video', caption: string } | null = null;
             
             let interestedProp = properties.find(p => p.id === freshLead.interestedInId);
             
             if (!interestedProp) {
                 const combinedText = contextText + " " + rawResponseText;
                 interestedProp = detectPropertyFromContext(combinedText);
                 
                 if (!interestedProp && properties.length > 0) {
                     interestedProp = properties[0];
                 }
             }

             if (interestedProp) {
                if (interestedProp.id !== freshLead.interestedInId) {
                    setLeads(prev => prev.map(l => l.id === selectedLeadId ? { ...l, interestedInId: interestedProp!.id } : l));
                }

                if (photoRegex.test(rawResponseText)) {
                    let imgUrl = null;
                    let caption = `📸 Foto: ${interestedProp.name}`;

                    if (interestedProp.images && interestedProp.images.length > 0) {
                        imgUrl = interestedProp.images[0];
                    } else if (interestedProp.imageUrl && !interestedProp.imageUrl.includes('placeholder')) {
                        imgUrl = interestedProp.imageUrl;
                    }

                    if (imgUrl) {
                        mediaToSend = { url: imgUrl, type: 'image', caption: caption };
                    } else if (interestedProp.externalLink) {
                         finalText = rawResponseText.replace(photoRegex, `\n\nVocê pode ver as fotos no site oficial: ${interestedProp.externalLink}`).trim();
                    }
                    
                    if (imgUrl) finalText = rawResponseText.replace(photoRegex, '').trim();
                }
                
                else if (videoRegex.test(rawResponseText)) {
                    if (interestedProp.videos && interestedProp.videos.length > 0) {
                        mediaToSend = { 
                            url: interestedProp.videos[0], 
                            type: 'video', 
                            caption: `🎥 Vídeo: ${interestedProp.name}` 
                        };
                        finalText = rawResponseText.replace(videoRegex, '').trim();
                    } 
                    else if (interestedProp.videoLink) {
                         finalText = rawResponseText.replace(videoRegex, `\n\n🎥 Assista ao vídeo do imóvel aqui: ${interestedProp.videoLink}`).trim();
                    } 
                    else if (interestedProp.externalLink) {
                         finalText = rawResponseText.replace(videoRegex, `\n\nNão tenho o arquivo de vídeo aqui, mas você pode fazer um tour no site: ${interestedProp.externalLink}`).trim();
                    } 
                    else {
                         const imgFallback = (interestedProp.images && interestedProp.images.length > 0) ? interestedProp.images[0] : interestedProp.imageUrl;
                         mediaToSend = { url: imgFallback, type: 'image', caption: `🎥 Vídeo indisponível no momento. Veja esta foto do ${interestedProp.name}.` };
                         finalText = rawResponseText.replace(videoRegex, '').trim();
                    }
                }
                
                else if (planRegex.test(rawResponseText)) {
                    let bestPlanUrl: string | null = null;
                    let bestCaption = `📐 Planta Baixa: ${interestedProp.name}`;
                    
                    const searchContext = (contextText + " " + rawResponseText).toLowerCase();

                    if (interestedProp.units && interestedProp.units.length > 0) {
                        const matchedUnit = interestedProp.units.find(u => {
                            if (!u.image) return false;
                            const keywords = [
                                u.name.toLowerCase(), 
                                `${u.bedrooms} quartos`, 
                                `${u.bedrooms} dorms`,
                                `${u.bedrooms} dormitórios`
                            ];
                            return keywords.some(k => searchContext.includes(k));
                        });

                        if (matchedUnit) {
                            bestPlanUrl = matchedUnit.image!;
                            bestCaption = `📐 Planta: ${matchedUnit.name} (${matchedUnit.size})`;
                        }
                    }

                    if (!bestPlanUrl && interestedProp.floorPlans && interestedProp.floorPlans.length > 0) {
                        bestPlanUrl = interestedProp.floorPlans[0];
                    }

                    if (!bestPlanUrl && interestedProp.units && interestedProp.units.some(u => u.image)) {
                        const anyUnit = interestedProp.units.find(u => u.image);
                        if (anyUnit) {
                            bestPlanUrl = anyUnit.image!;
                            bestCaption = `📐 Planta: ${anyUnit.name}`;
                        }
                    }

                    if (bestPlanUrl) {
                        mediaToSend = { url: bestPlanUrl, type: 'image', caption: bestCaption };
                        finalText = rawResponseText.replace(planRegex, '').trim();
                    } else if (interestedProp.floorPlanLink) {
                        finalText = rawResponseText.replace(planRegex, `\n\nVocê pode ver a planta detalhada neste link: ${interestedProp.floorPlanLink}`).trim();
                    } else {
                        const fallbackImg = (interestedProp.images && interestedProp.images.length > 0) ? interestedProp.images[0] : interestedProp.imageUrl;
                        mediaToSend = { url: fallbackImg, type: 'image', caption: `⚠️ Planta indisponível. Veja uma foto ilustrativa do ${interestedProp.name}.` };
                        finalText = rawResponseText.replace(planRegex, '').trim();
                    }
                }
             }

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

             let audioSent = false;

             if (mediaType === 'audio') {
                 setAiActivity('recording');
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
                                     transcription: finalText 
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
  }, [selectedLeadId, leads, properties, systemInstruction, userAttentionTriggers, aiAttentionTriggers, aiPauseDuration, timerSettings, voiceSettings, playNotificationSound, blacklist, whatsappConfig]);

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
      voiceSettings, setVoiceSettings, blacklist, addToBlacklist, removeFromBlacklist, 
      quickReplies, setQuickReplies,
      updateApiKey, isAiReady,
      exportData, importData, exportProperties, importProperties, clearAllData,
      // TAGS
      tags, addTag, removeTag, assignTagToLead, removeTagFromLead,
      // CHAT ACTIONS
      clearChat, deleteLead, archiveLead, unarchiveLead,
      // WHATSAPP CONFIG
      whatsappConfig, setWhatsappConfig
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
