
import { GoogleGenAI } from "@google/genai";

// Configuração da IA
const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

export default async function handler(req, res) {
  
  // 1. VERIFICAÇÃO DO WEBHOOK (Meta Style - GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "construtoragpt_token_seguro";

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    } else {
      // Uazapi não usa validação GET geralmente, mas deixamos fallback
      return res.status(403).json({ error: "Token inválido" });
    }
  }

  // 2. RECEBIMENTO DE MENSAGENS (POST)
  if (req.method === 'POST') {
    try {
      const body = req.body;
      let messageData = null;
      let provider = 'meta';

      // --- DETECTAR SE É META OU UAZAPI/EVOLUTION ---
      
      // Caso 1: Meta (Official API)
      if (body.object === 'whatsapp_business_account') {
          const entry = body.entry?.[0];
          const changes = entry?.changes?.[0];
          const value = changes?.value;
          const message = value?.messages?.[0];
          
          if (message && message.type === 'text') {
              messageData = {
                  from: message.from,
                  text: message.text.body,
                  phoneId: value.metadata.phone_number_id
              };
              provider = 'meta';
          }
      } 
      
      // Caso 2: Uazapi / Evolution API (Payload geralmente tem 'data' ou 'message')
      else if (body.data && body.data.key && body.data.key.remoteJid) {
          // Estrutura comum Evolution v1/v2
          const msg = body.data;
          // Ignorar mensagens enviadas por mim (fromMe)
          if (!msg.key.fromMe && msg.message) {
              // Extrair texto (pode vir em conversation, extendedTextMessage, etc)
              let text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
              const remoteJid = msg.key.remoteJid;
              const from = remoteJid.split('@')[0];

              if (text) {
                  messageData = {
                      from: from,
                      text: text,
                      instance: body.instance || process.env.UAZAPI_INSTANCE
                  };
                  provider = 'uazapi';
              }
          }
      }

      // SE TIVER MENSAGEM VÁLIDA PARA PROCESSAR
      if (messageData) {
          console.log(`[${provider}] Mensagem de ${messageData.from}: ${messageData.text}`);

          // --- CONFIGURAÇÃO DINÂMICA (JSON) ---
          let crmConfig = {
            systemInstruction: "Você é um corretor. Agende uma visita.",
            properties: [],
            blacklist: []
          };

          if (process.env.CRM_CONFIG_JSON) {
            try {
              const parsed = JSON.parse(process.env.CRM_CONFIG_JSON);
              crmConfig = { ...crmConfig, ...parsed };
            } catch (e) { console.error("Erro config JSON", e); }
          }

          // Blacklist Check
          if (crmConfig.blacklist && crmConfig.blacklist.some(num => messageData.from.includes(num))) {
             return res.status(200).send('BLACKLISTED');
          }

          // Contexto dos Imóveis
          const propertyContext = crmConfig.properties.map(p => {
             let unitDetails = "";
             if (p.units && p.units.length > 0) {
                 unitDetails = "\n  TIPOLOGIAS:\n" + p.units.map(u => `  - ${u.name}: R$ ${u.price}`).join('\n');
             }
             return `IMÓVEL: ${p.name}\nEndereço: ${p.address}\nPreço: R$${p.price}\n${unitDetails}\n---`;
          }).join('\n');

          // Prompt
          const fullSystemInstruction = `
            ${crmConfig.systemInstruction}
            --- INVENTÁRIO ---
            ${propertyContext}
          `;

          // AI Generation
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: `Cliente: "${messageData.text}"` }] }],
            systemInstruction: { parts: [{ text: fullSystemInstruction }] }
          });
          const aiResponse = result.response.text();

          // --- ENVIAR RESPOSTA ---
          if (provider === 'meta') {
              await sendMetaMessage(messageData.phoneId, messageData.from, aiResponse);
          } else if (provider === 'uazapi') {
              await sendUazapiMessage(messageData.from, aiResponse);
          }
      }

      return res.status(200).send('OK');

    } catch (error) {
      console.error("Erro webhook:", error);
      return res.status(500).send("Error");
    }
  }
  return res.status(405).send("Method Not Allowed");
}

async function sendMetaMessage(phoneId, to, text) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) return;
  await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: "whatsapp", to: to, text: { body: text } })
  });
}

async function sendUazapiMessage(to, text) {
    const baseUrl = process.env.UAZAPI_URL;
    const apiKey = process.env.UAZAPI_KEY;
    const instance = process.env.UAZAPI_INSTANCE;

    if (!baseUrl || !apiKey || !instance) {
        console.error("Faltam variáveis UAZAPI no Vercel");
        return;
    }

    const cleanUrl = baseUrl.replace(/\/$/, '');
    const url = `${cleanUrl}/message/sendText/${instance}`;

    await fetch(url, {
        method: 'POST',
        headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            number: to,
            options: { delay: 1000, presence: "composing" },
            textMessage: { text: text }
        })
    });
}