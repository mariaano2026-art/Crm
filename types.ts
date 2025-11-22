
export enum LeadStatus {
  NEW = 'Novo',
  COLD = 'Frio',
  WARM = 'Morno',
  HOT = 'Quente',
  SCHEDULED = 'Visita Agendada',
  NO_AI = 'IA Desligada'
}

export interface PropertyUnit {
  id: string;
  name: string; // Ex: "Final 1 - 3 Dorms", "Garden", "Cobertura"
  price: number;
  size: string; // Ex: "85m²"
  bedrooms: number;
  bathrooms: number;
  image?: string; // Planta específica desta unidade
  description?: string;
}

export interface Property {
  id: string;
  name: string;
  type: 'Prédio' | 'Casa';
  address: string;
  price: number; // Preço "A partir de"
  status: 'Em Construção' | 'Pronto' | 'Na Planta';
  description: string;
  features: string[];
  imageUrl: string; // Thumbnail principal
  specs: string; // Resumo geral
  // Novos campos de mídia
  images: string[];
  videos: string[];
  floorPlans: string[];
  // Hierarquia de unidades
  units?: PropertyUnit[];
}

export interface Message {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: Date;
  isMedia?: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  transcription?: string; // Stores the AI text-to-speech result
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  status: LeadStatus;
  lastContact: Date;
  interestedInId?: string;
  messages: Message[];
  unreadCount: number;
  requiresAttention?: boolean;
  aiPausedUntil?: Date;
}

export interface FollowUpConfig {
  baseContext: string;
  earlyStage: {
    daysThreshold: number;
    prompt: string;
  };
  lateStage: {
    prompt: string;
  };
}

export interface MessageTimerSettings {
  thinkingTime: number;
  charDelay: number;
  maxDelay: number;
}

export interface VoiceSettings {
  voiceName: string;
  label: string;
  gender: 'male' | 'female';
}

export type View = 'dashboard' | 'leads' | 'pipeline' | 'chat' | 'properties' | 'settings' | 'training' | 'sandbox' | 'blacklist' | 'data-management';