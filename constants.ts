import { Lead, LeadStatus, Message, Property, FollowUpConfig, MessageTimerSettings, VoiceSettings } from './types';

export const MOCK_PROPERTIES: Property[] = [
  {
    id: 'p1',
    name: 'Edifício Horizonte Azul',
    type: 'Prédio',
    address: 'Rua das Flores, 123 - Centro',
    price: 450000,
    status: 'Em Construção',
    description: 'Apartamentos modernos com vista para o mar. Área de lazer completa na cobertura.',
    features: ['Piscina', 'Academia', 'Varanda Gourmet'],
    imageUrl: 'https://picsum.photos/800/600?random=1',
    specs: '2 e 3 Quartos',
    images: ['https://picsum.photos/800/600?random=1', 'https://picsum.photos/800/600?random=10'],
    videos: ['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'],
    floorPlans: ['https://via.placeholder.com/800x600.png?text=Planta+Geral'],
    units: [
        {
            id: 'u1',
            name: 'Tipo A - 2 Dormitórios',
            price: 450000,
            size: '65m²',
            bedrooms: 2,
            bathrooms: 1,
            image: 'https://via.placeholder.com/800x600.png?text=Planta+2+Dorms',
            description: 'Unidade compacta com varanda gourmet integrada.'
        },
        {
            id: 'u2',
            name: 'Tipo B - 3 Dormitórios (Suíte)',
            price: 620000,
            size: '85m²',
            bedrooms: 3,
            bathrooms: 2,
            image: 'https://via.placeholder.com/800x600.png?text=Planta+3+Dorms',
            description: 'Unidade espaçosa de frente para o mar.'
        }
    ]
  },
  {
    id: 'p2',
    name: 'Residencial Vista Verde',
    type: 'Prédio',
    address: 'Av. da Montanha, 880 - Jardim Alto',
    price: 320000,
    status: 'Na Planta',
    description: 'O melhor investimento da região. Condições facilitadas de pagamento.',
    features: ['Playground', 'Salão de Festas', 'Portaria 24h'],
    imageUrl: 'https://picsum.photos/800/600?random=2',
    specs: '60m², 2 Quartos',
    images: ['https://picsum.photos/800/600?random=2'],
    videos: [],
    floorPlans: ['https://via.placeholder.com/800x600.png?text=Planta+Vista+Verde'],
    units: [
        {
            id: 'u3',
            name: 'Planta Padrão',
            price: 320000,
            size: '60m²',
            bedrooms: 2,
            bathrooms: 1,
            description: 'Ideal para investimento.'
        }
    ]
  },
  {
    id: 'c1',
    name: 'Casa Bosque I',
    type: 'Casa',
    address: 'Condomínio Real, Lote 4',
    price: 850000,
    status: 'Pronto',
    description: 'Casa de alto padrão com acabamento premium. Pronta para morar.',
    features: ['Pé direito duplo', 'Área Gourmet', '4 Vagas'],
    imageUrl: 'https://picsum.photos/800/600?random=3',
    specs: '220m², 4 Suítes',
    images: ['https://picsum.photos/800/600?random=3', 'https://picsum.photos/800/600?random=30'],
    videos: [],
    floorPlans: []
  },
  {
    id: 'c2',
    name: 'Casa Bosque II',
    type: 'Casa',
    address: 'Condomínio Real, Lote 5',
    price: 870000,
    status: 'Em Construção',
    description: 'Projeto arquitetônico moderno com integração total dos ambientes.',
    features: ['Piscina Privativa', 'Energia Solar', 'Automação'],
    imageUrl: 'https://picsum.photos/800/600?random=4',
    specs: '230m², 4 Suítes',
    images: ['https://picsum.photos/800/600?random=4'],
    videos: ['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'],
    floorPlans: ['https://via.placeholder.com/800x600.png?text=Planta+Casa+Bosque']
  },
  {
    id: 'c3',
    name: 'Sobrado Jardim Sul',
    type: 'Casa',
    address: 'Rua dos Ipês, 45',
    price: 550000,
    status: 'Pronto',
    description: 'Sobrado espaçoso em bairro tranquilo. Ótimo quintal.',
    features: ['Churrasqueira', 'Escritório', 'Cozinha Planejada'],
    imageUrl: 'https://picsum.photos/800/600?random=5',
    specs: '180m², 3 Quartos',
    images: ['https://picsum.photos/800/600?random=5'],
    videos: [],
    floorPlans: []
  },
  {
    id: 'c4',
    name: 'Casa Térrea Norte',
    type: 'Casa',
    address: 'Av. Norte, 200',
    price: 420000,
    status: 'Em Construção',
    description: 'Casa térrea prática e acessível. Entrega em 6 meses.',
    features: ['Jardim de Inverno', 'Garagem Coberta'],
    imageUrl: 'https://picsum.photos/800/600?random=6',
    specs: '110m², 2 Suítes',
    images: ['https://picsum.photos/800/600?random=6'],
    videos: [],
    floorPlans: ['https://via.placeholder.com/800x600.png?text=Planta+Casa+Norte']
  }
];

const generateMockMessages = (count: number): Message[] => {
  const msgs: Message[] = [];
  for (let i = 0; i < count; i++) {
    msgs.push({
      id: `m${i}`,
      sender: i % 2 === 0 ? 'user' : 'agent',
      text: i % 2 === 0 ? 'Olá, gostaria de saber mais sobre o preço.' : 'Olá! Tudo bem? O preço inicial é R$ 450.000.',
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
    interestedInId: 'p1',
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
    interestedInId: 'c1',
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
    interestedInId: 'p2',
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
    interestedInId: 'c2',
    messages: [
      { id: 'm0', sender: 'user', text: 'Boa tarde, vi a placa na frente da obra.', timestamp: new Date() }
    ],
    unreadCount: 1,
    requiresAttention: false
  }
];