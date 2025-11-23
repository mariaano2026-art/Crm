import { GoogleGenAI, Modality } from "@google/genai";
import { Property, Lead, Message, LeadStatus, FollowUpConfig } from "../types";

const getAIClient = () => {
  // 1. Tenta pegar do .env.
  // Check explícito de tipo para evitar erro TS2322 no build (string | undefined)
  const envKey = process.env.API_KEY;
  let apiKey = typeof envKey === "string" ? envKey : "";
  
  // 2. Se não tiver no .env, tenta pegar do LocalStorage (configurado via UI)
  if (!apiKey) {
      const storedKey = localStorage.getItem('crm_gemini_api_key');
      if (storedKey) {
          apiKey = storedKey;
      }
  }

  if (!apiKey) {
    console.warn("API_KEY is missing. AI features will not work.");
    return null;
  }
  
  return new GoogleGenAI({ apiKey });
};

export const isAIConfigured = (): boolean => {
  const envKey = process.env.API_KEY;
  const apiKey = (typeof envKey === "string" ? envKey : "") || localStorage.getItem('crm_gemini_api_key');
  return !!apiKey;
};

/**
 * Utilitário para criar cabeçalho WAV para dados PCM crus
 * O Gemini retorna PCM 24kHz Mono (geralmente)
 */
function getWavHeader(dataLength: number, sampleRate: number) {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1 for Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  return buffer;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Helper to convert blob to base64 without the data prefix
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data:audio/xyz;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const transcribeAudio = async (audioUrl: string): Promise<string | null> => {
  const client = getAIClient();
  if (!client) return null;

  try {
    // 1. Fetch the audio content from the blob URL
    const response = await fetch(audioUrl);
    const audioBlob = await response.blob();
    
    // 2. Convert to Base64
    const base64Audio = await blobToBase64(audioBlob);

    // 3. Send to Gemini (Flash handles audio well)
    const modelResponse = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: audioBlob.type || "audio/wav", 
              data: base64Audio
            }
          },
          {
            text: "Transcreva o áudio a seguir exatamente como foi falado. Se houver silêncio ou ruído apenas, responda com '[Sem áudio compreensível]'."
          }
        ]
      }
    });

    return modelResponse.text || null;

  } catch (error) {
    console.error("Transcription error:", error);
    return null;
  }
};

export const generateAudioFromText = async (text: string, voiceName: string): Promise<string | null> => {
  const client = getAIClient();
  if (!client) return null;

  try {
    // Usamos o modelo gemini-2.5-flash-preview-tts para síntese de fala
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      console.error("No audio data returned");
      return null;
    }

    // Converter Base64 para Uint8Array
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Adicionar cabeçalho WAV (24kHz é padrão para esse modelo)
    const wavHeader = getWavHeader(bytes.length, 24000);
    const wavBytes = new Uint8Array(wavHeader.byteLength + bytes.byteLength);
    wavBytes.set(new Uint8Array(wavHeader), 0);
    wavBytes.set(bytes, wavHeader.byteLength);

    // Criar Blob URL
    const blob = new Blob([wavBytes], { type: 'audio/wav' });
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error("Error generating audio:", error);
    return null;
  }
};

export const generateAIResponse = async (
  lead: Lead,
  properties: Property[],
  history: Message[],
  systemInstructionRaw: string
): Promise<string> => {
  const client = getAIClient();
  if (!client) return "⚠️ Erro de Configuração: Chave da API Gemini não configurada. Vá em Configurações e insira sua API Key.";

  // Construct context about properties including detailed unit info
  const propertyContext = properties.map(p => {
      const hasPhotos = (p.images && p.images.length > 0) || p.imageUrl ? "SIM" : "NÃO";
      const hasVideo = p.videos && p.videos.length > 0 ? "SIM" : "NÃO";
      
      // Verificação robusta de planta: Checa se existe planta geral OU planta em alguma unidade específica
      const hasUnitPlan = p.units && p.units.some(u => u.image);
      const hasPlan = (p.floorPlans && p.floorPlans.length > 0) || hasUnitPlan ? "SIM" : "NÃO";
      
      let unitDetails = "";
      if (p.units && p.units.length > 0) {
          unitDetails = "\n  TIPOLOGIAS/PLANTAS DISPONÍVEIS NESTE PRÉDIO:\n" + p.units.map(u => 
              `  - ${u.name}: R$ ${u.price} (${u.bedrooms} quartos, ${u.size}). Descrição: ${u.description || ''} ${u.image ? '[PLANTA DISPONÍVEL]' : '[SEM PLANTA]'}`
          ).join('\n');
      }

      return `ID: ${p.id}
Nome: ${p.name}
Tipo: ${p.type}
Endereço: ${p.address}
Preço (A partir de): R$${p.price}
Status: ${p.status}
Specs Gerais: ${p.specs}
Descrição: ${p.description}
${unitDetails}
MÍDIA GERAL DISPONÍVEL: [Fotos: ${hasPhotos}, Vídeo: ${hasVideo}, Planta/Layout: ${hasPlan}]
-----------------------------------`;
  }).join('\n');

  // Convert Message history to Gemini Format
  const chatHistory = history.map(m => {
      const type = m.mediaType === 'audio' ? '[ÁUDIO]' : '';
      // If audio has transcription, use it for context!
      const content = m.transcription ? `[ÁUDIO TRANSCRITO: "${m.transcription}"]` : m.text;
      return `${m.sender === 'user' ? 'Cliente' : 'Vendedor'}: ${type} ${content}`
  }).join('\n');
  
  // Construção da Instrução de Sistema (Persona + Regras + Dados RAG)
  const fullSystemInstruction = `
    ${systemInstructionRaw}

    --- DADOS IMPORTANTES DO CLIENTE ---
    Nome do Cliente: ${lead.name} (USE ESTE NOME NA CONVERSA PARA HUMANIZAR)
    Interesse (ID): ${lead.interestedInId || 'Geral'}

    --- REGRAS DE TIPOLOGIAS ---
    Se o imóvel for um PRÉDIO com múltiplas plantas/tipologias:
    1. Não dê apenas o preço "a partir de". Explique as opções (ex: "Temos o final 1 de 3 dorms por X e o final 2 de 2 dorms por Y").
    2. Se o cliente perguntar de "3 quartos", ignore a planta de 2 quartos e foque na de 3.
    3. Seja consultivo: pergunte quantas pessoas vão morar para sugerir a melhor planta.

    --- REGRAS OBRIGATÓRIAS PARA ENVIO DE MÍDIA ---
    Se o usuário solicitar ver fotos, vídeos ou planta baixa, você DEVE usar as tags abaixo.
    O sistema identificará a tag e enviará o arquivo separadamente.
    
    1. Se pedir FOTOS/IMAGENS:
       - Verifique "MÍDIA DISPONÍVEL -> Fotos".
       - Se SIM: Adicione a tag "[SEND_PHOTO]" em uma linha separada.
    
    2. Se pedir VÍDEO/TOUR:
       - Verifique "MÍDIA DISPONÍVEL -> Vídeo".
       - Se SIM: Adicione a tag "[SEND_VIDEO]" em uma linha separada.
    
    3. Se pedir PLANTA/LAYOUT:
       - Verifique "MÍDIA DISPONÍVEL -> Planta".
       - Se SIM: Adicione a tag "[SEND_PLAN]" em uma linha separada.
       - DICA: Se não houver planta geral, mas uma unidade tiver '[PLANTA DISPONÍVEL]', use a tag mesmo assim.
    
    ------------------------------------

    --- LISTA DE IMÓVEIS ATUALIZADA (INVENTÁRIO) ---
    ${propertyContext}
  `;

  const userPrompt = `
    --- HISTÓRICO DA CONVERSA ---
    ${chatHistory}
    
    Sua resposta (simulando WhatsApp, use quebra de linha para separar mensagens):
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: 0.7, // Criatividade controlada
      }
    });
    return response.text || "Desculpe, não consegui processar sua resposta agora.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('permission denied') || error.toString().includes('403')) {
        return "⚠️ Erro de Permissão: Verifique se sua API Key é válida e tem acesso ao modelo gemini-2.5-flash.";
    }
    return "Erro técnico ao conectar com a IA. Tente novamente mais tarde.";
  }
};

export const generateFollowUp = async (
  lead: Lead,
  properties: Property[],
  config: FollowUpConfig
): Promise<string> => {
  const client = getAIClient();
  if (!client) return "Olá! Ainda tem interesse no imóvel?";

  const interestedProperty = properties.find(p => p.id === lead.interestedInId);
  const propertyDetails = interestedProperty 
    ? `Imóvel de interesse anterior: ${interestedProperty.name} (${interestedProperty.specs})` 
    : "Interesse geral em imóveis";

  // Calculate days since last contact
  const now = new Date().getTime();
  const lastContactTime = new Date(lead.lastContact).getTime();
  const diffTime = Math.abs(now - lastContactTime);
  const daysSinceContact = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isEarlyStage = daysSinceContact <= config.earlyStage.daysThreshold;
  const strategyPrompt = isEarlyStage ? config.earlyStage.prompt : config.lateStage.prompt;

  const prompt = `
    CONTEXTO ATUAL:
    - Cliente: ${lead.name}
    - Dias sem contato: ${daysSinceContact} dias.
    - ${propertyDetails}
    
    ESTRATÉGIA SELECIONADA (Siga rigorosamente):
    ${strategyPrompt}
    
    Tarefa: Gere a mensagem de texto para WhatsApp.
    Regra: Use o nome do cliente (${lead.name}). Seja breve. Se quiser dividir em dois balões, use quebra de linha.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: config.baseContext
      }
    });
    return response.text || "Olá! Vi que não nos falamos há um tempo. Ainda tem interesse?";
  } catch (error) {
    return "Olá! Vi que não nos falamos há um tempo. Ainda tem interesse?";
  }
};

export const classifyLeadTemperature = async (
  history: Message[]
): Promise<LeadStatus | null> => {
    const client = getAIClient();
    if (!client) return null;

    const lastMessages = history.slice(-8).map(m => {
        // Use transcribed text for classification if available
        const text = m.transcription ? `[Áudio: ${m.transcription}]` : m.text;
        return `${m.sender}: ${text}`;
    }).join('\n');

    const prompt = `
        Analise a conversa abaixo e classifique o status do lead em uma das seguintes categorias:

        - Visita Agendada: Se houve uma confirmação explícita de dia e horário para visita.
        - Quente: Quer visitar, pergunta preço/condições, demonstra urgência, mas ainda não agendou data fixa.
        - Morno: Faz perguntas sobre o imóvel, mas ainda está pesquisando ou tem objeções.
        - Frio: Desinteressado, parou de responder, ou disse que não quer mais.

        Responda APENAS com o termo exato: "Visita Agendada", "Quente", "Morno" ou "Frio".

        Conversa:
        ${lastMessages}
    `;

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        const text = response.text?.trim();
        
        if (text?.includes('Visita Agendada')) return LeadStatus.SCHEDULED;
        if (text?.includes('Quente')) return LeadStatus.HOT;
        if (text?.includes('Frio')) return LeadStatus.COLD;
        if (text?.includes('Morno')) return LeadStatus.WARM;
        
        return null; // Maintain current status if unsure
    } catch (error) {
        return null;
    }
};
