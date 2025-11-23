

import { Lead, LeadStatus, Message, Property, FollowUpConfig, MessageTimerSettings, VoiceSettings } from './types';

export const MOCK_PROPERTIES: Property[] = [
  // --- PRÉDIO 1: TEQUICI ---
  {
    id: 'p_tequici',
    name: 'Edifício Tequici',
    type: 'Prédio',
    address: 'Rua Tequici, 6',
    price: 380000, 
    status: 'Em Construção',
    description: 'Empreendimento em fase acelerada de obras na Rua Tequici, número 6. Localização privilegiada e acabamento de primeira.',
    features: ['Elevador', 'Varanda Gourmet', 'Vaga Coberta', 'Portaria Eletrônica'],
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800',
    specs: '5 Tipologias Disponíveis',
    images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800'
    ],
    videos: [],
    floorPlans: [],
    units: [
        {
            id: 'u_teq_1',
            name: 'Final 1 - Compacto',
            price: 380000,
            size: '42m²',
            bedrooms: 1,
            bathrooms: 1,
            description: 'Ideal para investidores ou solteiros.'
        },
        {
            id: 'u_teq_2',
            name: 'Final 2 - Casal',
            price: 450000,
            size: '55m²',
            bedrooms: 2,
            bathrooms: 1,
            description: 'Dois dormitórios com sacada.'
        },
        {
            id: 'u_teq_3',
            name: 'Final 3 - Família',
            price: 580000,
            size: '68m²',
            bedrooms: 2,
            bathrooms: 2,
            description: 'Com suíte e vista livre.'
        },
        {
            id: 'u_teq_4',
            name: 'Final 4 - Ampliado',
            price: 650000,
            size: '75m²',
            bedrooms: 3,
            bathrooms: 2,
            description: 'Três dormitórios para maior conforto.'
        },
        {
            id: 'u_teq_5',
            name: 'Final 5 - Garden',
            price: 720000,
            size: '90m²',
            bedrooms: 2,
            bathrooms: 2,
            description: 'Térreo com área externa privativa.'
        }
    ]
  },

  // --- PRÉDIO 2: SERRA DE BOTUCATU ---
  {
    id: 'p_botucatu',
    name: 'Residencial Serra de Botucatu',
    type: 'Prédio',
    address: 'Rua Serra de Botucatu, 1000',
    price: 490000, 
    status: 'Na Planta',
    description: 'Grande Lançamento! Oportunidade de comprar na planta na Rua Serra de Botucatu, 1000. Condições especiais de lançamento.',
    features: ['Lazer Completo', 'Piscina', 'Academia', 'Coworking'],
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800',
    specs: '3 Tipologias (Lançamento)',
    images: [
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800', 
        'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&q=80&w=800'
    ],
    videos: [],
    floorPlans: [],
    units: [
        {
            id: 'u_bot_1',
            name: 'Planta Smart',
            price: 490000,
            size: '50m²',
            bedrooms: 2,
            bathrooms: 1,
            description: 'Entrada facilitada.'
        },
        {
            id: 'u_bot_2',
            name: 'Planta Comfort',
            price: 680000,
            size: '72m²',
            bedrooms: 3,
            bathrooms: 2,
            description: 'Varanda gourmet integrada.'
        },
        {
            id: 'u_bot_3',
            name: 'Cobertura Duplex',
            price: 1100000,
            size: '130m²',
            bedrooms: 3,
            bathrooms: 3,
            description: 'Exclusividade no topo do prédio.'
        }
    ]
  },
  
  // --- CASAS ---
  {
    id: 'c_maria_clara',
    name: 'Casa Maria Clara',
    type: 'Casa',
    address: 'Rua Maria Clara',
    price: 750000,
    status: 'Pronto',
    description: 'Casa térrea aconchegante localizada na Rua Maria Clara.',
    features: ['Quintal', '2 Vagas', 'Cozinha Americana', 'Reformada'],
    imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?auto=format&fit=crop&q=80&w=800',
    specs: '3 Dormitórios',
    images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?auto=format&fit=crop&q=80&w=800'],
    videos: [],
    floorPlans: []
  },
  {
    id: 'c_padre',
    name: 'Casa Padre Lourenço',
    type: 'Casa',
    address: 'Rua Padre Lourenço',
    price: 890000,
    status: 'Em Construção',
    description: 'Sobrado moderno em construção na Rua Padre Lourenço. Arquitetura diferenciada.',
    features: ['Suíte Master', 'Área Gourmet', 'Porcelanato', 'Garagem Subterrânea'],
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-2750aa9412a9?auto=format&fit=crop&q=80&w=800',
    specs: '3 Suítes',
    images: ['https://images.unsplash.com/photo-1600596542815-2750aa9412a9?auto=format&fit=crop&q=80&w=800'],
    videos: [],
    floorPlans: []
  },
  {
    id: 'c_colatina',
    name: 'Casa Colatina',
    type: 'Casa',
    address: 'Rua Colatina',
    price: 620000,
    status: 'Pronto',
    description: 'Ótima oportunidade na Rua Colatina. Casa bem localizada e documentação OK.',
    features: ['Bairro Tranquilo', 'Documentação OK', 'Perto de Comércio'],
    imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36f89?auto=format&fit=crop&q=80&w=800',
    specs: '2 Dormitórios',
    images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36f89?auto=format&fit=crop&q=80&w=800'],
    videos: [],
    floorPlans: []
  },
  {
    id: 'c_alta_garca',
    name: 'Casa Alto Garças',
    type: 'Casa',
    address: 'Rua Alto Garça',
    price: 1200000,
    status: 'Em Construção',
    description: `Alto Garças - O Moderno ao seu alcance.

📐 146m² de Área Construída
🛏️ 3 Dormitórios (sendo 2 Suítes)
🚗 2 Vagas de Garagem

✨ Diferenciais Exclusivos:
- Área Gourmet completa com Churrasqueira
- Jacuzzi privativa para seus momentos de lazer
- Jardim de Inverno trazendo luz e natureza
- Acabamentos Premium em todo o imóvel
- Sala de estar integrada à sala de jantar
- Cozinha moderna e espaçosa

🏗️ Status da Obra (Atualizado: Out/2025):
- Terraplanagem, Fundação e Estrutura: 100%
- Fachada: 70%
- Acabamento e Paisagismo: 20%

📍 Localização Privilegiada próxima a transporte público, comércio e serviços.`,
    features: ['Jacuzzi', 'Área Gourmet', 'Jardim de Inverno', '2 Suítes', 'Acabamento Premium'],
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800',
    specs: '146m²',
    images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800'],
    videos: [],
    floorPlans: ['https://images.unsplash.com/photo-1599809272520-279778c75850?auto=format&fit=crop&q=80&w=800']
  }
];

const generateMockMessages = (count: number): Message[] => {
  const msgs: Message[] = [];
  for (let i = 0; i < count; i++) {
    msgs.push({
      id: `m${i}`,
      sender: i % 2 === 0 ? 'user' : 'agent',
      text: i % 2 === 0 ? 'Olá, gostaria de saber mais sobre o financiamento.' : 'Olá! Trabalhamos com todos os bancos. Qual seria o valor de entrada?',
      timestamp: new Date(Date.now() - (1000 * 60 * 60 * 24 * (count - i)))
    });
  }
  return msgs;
};

export const DEFAULT_FOLLOWUP_CONFIG: FollowUpConfig = {
  baseContext: `Você é um consultor imobiliário experiente. Seu objetivo é reengajar clientes que pararam de responder.
- Mantenha um tom profissional, porém casual e acessível (estilo WhatsApp).
- Nunca pareça desesperado ou culpe o cliente pelo silêncio.
- Sempre termine com uma pergunta fácil de responder (Sim/Não ou escolha simples).`,
  
  earlyStage: {
    daysThreshold: 10,
    prompt: `ESTRATÉGIA CURTO PRAZO (0 a 10 dias sem contato):
- O lead ainda está quente. Assuma que ele apenas esqueceu ou ficou ocupado.
- Gere valor imediato: mencione uma condição especial, uma nova unidade liberada, ou pergunte se ele conseguiu ver o material enviado.
- Foque em obter uma micro-confirmação. Ex: "Conseguiu abrir as fotos?", "Ainda prefere a unidade X?".`
  },
  
  lateStage: {
    prompt: `ESTRATÉGIA LONGO PRAZO (+10 dias sem contato):
- O lead esfriou. Não insista no mesmo assunto antigo.
- Mude o foco: Pergunte se a busca dele mudou, ou apresente uma novidade totalmente diferente (outro bairro, outro estilo).
- Use a técnica "Sentiu falta?": "Oi [Nome], vi aqui que não nos falamos mais. Ainda está buscando imóvel ou já resolveu?"
- Seja extremamente breve. Uma frase e uma pergunta.`
  }
};

export const DEFAULT_TIMER_SETTINGS: MessageTimerSettings = {
  thinkingTime: 3,      // 3 segundos "pensando" antes de digitar
  charDelay: 60,        // 60ms por letra (velocidade média humana)
  maxDelay: 10000       // Máximo 10s digitando
};

export const VOICE_PRESETS: VoiceSettings[] = [
  { voiceName: 'Puck', label: 'Jovem - Masculino (Casual)', gender: 'male' },
  { voiceName: 'Charon', label: 'Maduro - Masculino (Profundo)', gender: 'male' },
  { voiceName: 'Kore', label: 'Jovem - Feminina (Calma)', gender: 'female' },
  { voiceName: 'Fenrir', label: 'Maduro - Masculino (Energético)', gender: 'male' },
  { voiceName: 'Zephyr', label: 'Jovem - Feminina (Dinâmica)', gender: 'female' },
];

export const MOCK_LEADS: Lead[] = [
  {
    id: 'l1',
    name: 'Carlos Silva',
    phone: '+55 11 99999-1111',
    status: LeadStatus.HOT,
    lastContact: new Date(),
    interestedInId: 'p_tequici',
    messages: generateMockMessages(6),
    unreadCount: 1,
    requiresAttention: false
  },
  {
    id: 'l2',
    name: 'Mariana Costa',
    phone: '+55 11 99999-2222',
    status: LeadStatus.COLD,
    lastContact: new Date(Date.now() - 86400000 * 5), // 5 days ago
    interestedInId: 'c_maria_clara',
    messages: generateMockMessages(3),
    unreadCount: 0,
    requiresAttention: false
  },
  {
    id: 'l3',
    name: 'João Souza',
    phone: '+55 11 99999-3333',
    status: LeadStatus.WARM,
    lastContact: new Date(Date.now() - 86400000 * 1),
    interestedInId: 'p_botucatu',
    messages: generateMockMessages(10),
    unreadCount: 0,
    requiresAttention: false
  },
  {
    id: 'l4',
    name: 'Fernanda Lima',
    phone: '+55 21 98888-4444',
    status: LeadStatus.NEW,
    lastContact: new Date(),
    interestedInId: 'c_padre',
    messages: [
      { id: 'm0', sender: 'user', text: 'Boa tarde, gostaria de saber o valor.', timestamp: new Date() }
    ],
    unreadCount: 1,
    requiresAttention: false
  }
];