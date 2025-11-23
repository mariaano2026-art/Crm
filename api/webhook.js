
import { GoogleGenAI } from "@google/genai";

// Configuração da IA
const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

export default async function handler(req, res) {
  // 1. VERIFICAÇÃO DO WEBHOOK (GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // O token de verificação deve ser igual ao que você definir no painel do Vercel
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "construtoragpt_token_seguro";

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log("Webhook verificado com sucesso!");
      return res.status(200).send(challenge);
    } else {
      return res.status(403).json({ error: "Token de verificação inválido" });
    }
  }

  // 2. RECEBIMENTO DE MENSAGENS (POST)
  if (req.method === 'POST') {
    try {
      const body = req.body;

      // Verifica se é uma mensagem do WhatsApp
      if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        if (message && message.type === 'text') {
          const from = message.from; // Número do cliente
          const textBody = message.text.body; // Texto da mensagem
          const businessPhoneNumberId = value.metadata.phone_number_id;

          console.log(`Mensagem recebida de ${from}: ${textBody}`);

          // --- CARREGAMENTO DE CONFIGURAÇÃO PERSISTENTE ---
          let crmConfig = {
            systemInstruction: "Você é um corretor de imóveis virtual. Seja breve e tente agendar uma visita.",
            properties: [],
            blacklist: []
          };

          // Tenta ler a configuração injetada via Variável de Ambiente (CRM_CONFIG_JSON)
          if (process.env.CRM_CONFIG_JSON) {
            try {
              const parsed = JSON.parse(process.env.CRM_CONFIG_JSON);
              crmConfig = { ...crmConfig, ...parsed };
              console.log("Configuração personalizada carregada com sucesso.");
            } catch (e) {
              console.error("Erro ao ler CRM_CONFIG_JSON:", e);
            }
          }

          // 1. Verifica Blacklist
          if (crmConfig.blacklist && crmConfig.blacklist.some(num => from.includes(num) || num.includes(from))) {
             console.log(`Número ${from} está na blacklist. Ignorando.`);
             return res.status(200).send('BLACKLISTED');
          }

          // 2. Monta o Contexto dos Imóveis (Mesma lógica do Frontend)
          const propertyContext = crmConfig.properties.map(p => {
             let unitDetails = "";
             if (p.units && p.units.length > 0) {
                 unitDetails = "\n  TIPOLOGIAS/PLANTAS:\n" + p.units.map(u => 
                     `  - ${u.name}: R$ ${u.price} (${u.bedrooms} quartos, ${u.size}).`
                 ).join('\n');
             }
             return `IMÓVEL: ${p.name}\nEndereço: ${p.address}\nPreço: R$${p.price}\nStatus: ${p.status}\nSpecs: ${p.specs}\nDescrição: ${p.description}${unitDetails}\n-------------------`;
          }).join('\n');

          // 3. Monta o Prompt Completo
          const fullSystemInstruction = `
            ${crmConfig.systemInstruction}

            --- INVENTÁRIO DE IMÓVEIS ATUALIZADO ---
            ${propertyContext || "Nenhum imóvel cadastrado no momento."}
            
            --- INSTRUÇÕES EXTRAS ---
            1. Se o cliente perguntar de um imóvel que está na lista acima, use os dados fornecidos.
            2. Se perguntar o preço, seja exato conforme a lista.
            3. Responda de forma curta e humanizada (estilo WhatsApp).
          `;

          // Chama o Gemini
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          
          const prompt = `
            HISTÓRICO RECENTE: (Sem histórico persistente nesta versão serverless)
            CLIENTE: "${textBody}"
            
            Responda como o corretor:
          `;

          const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: fullSystemInstruction }] }
          });
          
          const aiResponse = result.response.text();

          // --- ENVIA RESPOSTA PARA O WHATSAPP ---
          await sendWhatsAppMessage(businessPhoneNumberId, from, aiResponse);
        }

        return res.status(200).send('EVENT_RECEIVED');
      } else {
        return res.status(404).send('Not a WhatsApp API event');
      }
    } catch (error) {
      console.error("Erro no webhook:", error);
      return res.status(500).send("Internal Server Error");
    }
  }

  return res.status(405).send("Method Not Allowed");
}

// Função auxiliar para chamar a API da Meta
async function sendWhatsAppMessage(phoneId, to, text) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  
  if (!token) {
    console.error("ERRO: WHATSAPP_ACCESS_TOKEN não configurado no Vercel.");
    return;
  }

  const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to,
      text: { body: text }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Erro ao enviar mensagem WhatsApp:", JSON.stringify(errorData, null, 2));
  } else {
    console.log(`Resposta enviada para ${to}`);
  }
}
