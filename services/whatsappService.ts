
import { WhatsAppConfig, Message } from "../types";

const GRAPH_API_VERSION = 'v20.0'; // Versão estável da API Meta

// --- TYPES FOR UAZAPI PARSING ---
// Estrutura baseada em Baileys (usada pela Uazapi)
interface UazapiMessageData {
    key: {
        remoteJid: string;
        fromMe: boolean;
        id: string;
    };
    message?: {
        conversation?: string;
        extendedTextMessage?: { text: string };
        imageMessage?: { caption?: string; url?: string; jpegThumbnail?: string };
        videoMessage?: { caption?: string; url?: string };
        audioMessage?: { url?: string; seconds?: number };
    };
    messageTimestamp: number | string;
    pushName?: string;
}

// Função para logar erros de forma segura
const logError = (context: string, error: any) => {
    console.error(`[WhatsAppService] Erro em ${context}:`, error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.warn("⚠️ POSSÍVEL ERRO DE CORS OU URL INVÁLIDA. Verifique se o servidor da Uazapi aceita requisições deste domínio ou se a URL está correta (https).");
    }
};

export const fetchChats = async (config: WhatsAppConfig): Promise<any[]> => {
    if (config.provider !== 'uazapi' || !config.uazapiBaseUrl || !config.uazapiKey || !config.uazapiInstance) {
        return [];
    }

    const baseUrl = config.uazapiBaseUrl.replace(/\/$/, '');
    // Endpoint para buscar chats na Uazapi
    const url = `${baseUrl}/chat/findChats/${config.uazapiInstance}`;

    try {
        console.log(`[Uazapi] Buscando chats em: ${url}`);
        const response = await fetch(url, {
            method: 'GET',
            headers: { 
                'apikey': config.uazapiKey,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.error(`[Uazapi] Erro HTTP ao buscar chats: ${response.status} ${response.statusText}`);
            return [];
        }
        
        const data = await response.json();
        // Uazapi pode retornar array direto ou dentro de um objeto { chats: [] }
        const chats = Array.isArray(data) ? data : (data.chats || []);
        console.log(`[Uazapi] ${chats.length} chats encontrados.`);
        return chats;
    } catch (error) {
        logError('fetchChats', error);
        return [];
    }
};

export const fetchMessages = async (config: WhatsAppConfig, remoteJid: string, count = 50): Promise<Message[]> => {
    if (config.provider !== 'uazapi' || !config.uazapiBaseUrl || !config.uazapiKey || !config.uazapiInstance) {
        return [];
    }

    const baseUrl = config.uazapiBaseUrl.replace(/\/$/, '');
    // Endpoint para buscar mensagens na Uazapi
    const url = `${baseUrl}/chat/findMessages/${config.uazapiInstance}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'apikey': config.uazapiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                where: {
                    key: { remoteJid: remoteJid }
                },
                options: {
                    limit: count,
                    order: "DESC" // Buscar as mais recentes primeiro
                }
            })
        });

        if (!response.ok) {
            console.error(`[Uazapi] Erro HTTP ao buscar mensagens: ${response.status}`);
            return [];
        }

        const rawData = await response.json();
        const messages: UazapiMessageData[] = Array.isArray(rawData) ? rawData : (rawData.messages || []);

        // Parse e conversão para o formato do CRM
        const parsedMessages = messages
            .map(msg => parseUazapiMessage(msg))
            .filter((m): m is Message => !!m)
            .reverse(); // Reverter para ordem cronológica (antiga -> nova) para o Chat UI

        return parsedMessages;

    } catch (error) {
        logError('fetchMessages', error);
        return [];
    }
};

// Função auxiliar para converter formato da Uazapi (Baileys) para formato CRM
const parseUazapiMessage = (msg: UazapiMessageData): Message | null => {
    if (!msg.message) return null;

    const isMe = msg.key.fromMe;
    const id = msg.key.id;
    // Timestamp vem em segundos ou ms, garantir ms
    const timestamp = new Date(typeof msg.messageTimestamp === 'number' ? (msg.messageTimestamp > 9999999999 ? msg.messageTimestamp : msg.messageTimestamp * 1000) : Date.now());

    let text = '';
    let isMedia = false;
    let mediaType: 'image' | 'video' | 'audio' | undefined = undefined;
    let mediaUrl: string | undefined = undefined;

    // Text
    if (msg.message.conversation) {
        text = msg.message.conversation;
    } else if (msg.message.extendedTextMessage?.text) {
        text = msg.message.extendedTextMessage.text;
    }

    // Media handling
    // Nota: A Uazapi geralmente retorna a URL da mídia se ela estiver disponível publicamente ou base64.
    if (msg.message.imageMessage) {
        isMedia = true;
        mediaType = 'image';
        text = msg.message.imageMessage.caption || 'Imagem';
        mediaUrl = msg.message.imageMessage.url || msg.message.imageMessage.jpegThumbnail; 
    } else if (msg.message.videoMessage) {
        isMedia = true;
        mediaType = 'video';
        text = msg.message.videoMessage.caption || 'Vídeo';
        mediaUrl = msg.message.videoMessage.url;
    } else if (msg.message.audioMessage) {
        isMedia = true;
        mediaType = 'audio';
        text = 'Áudio';
        mediaUrl = msg.message.audioMessage.url;
    }

    // Se não achou texto nem mídia, pode ser mensagem de sistema ou status, ignorar por enquanto
    if (!text && !isMedia) return null;

    return {
        id,
        sender: isMe ? 'agent' : 'user',
        text,
        timestamp,
        isMedia,
        mediaType,
        mediaUrl
    };
};

export const sendToWhatsApp = async (
    config: WhatsAppConfig, 
    to: string, 
    type: 'text' | 'image' | 'video' | 'audio', 
    content: string, 
    caption?: string
): Promise<boolean> => {
    
    // Limpeza do número de telefone (apenas números)
    const cleanPhone = to.replace(/\D/g, '');

    // --- UAZAPI LOGIC ---
    if (config.provider === 'uazapi') {
        if (!config.uazapiBaseUrl || !config.uazapiKey || !config.uazapiInstance) {
            console.warn("Uazapi: Configuração incompleta.");
            return false;
        }

        // Remove trailing slash if exists
        const baseUrl = config.uazapiBaseUrl.replace(/\/$/, '');
        const instance = config.uazapiInstance;
        const headers = {
            'Content-Type': 'application/json',
            'apikey': config.uazapiKey
        };

        let url = '';
        let body: any = {};

        if (type === 'text') {
            url = `${baseUrl}/message/sendText/${instance}`;
            body = {
                number: cleanPhone,
                options: {
                    delay: 1200,
                    presence: "composing",
                    linkPreview: true
                },
                textMessage: {
                    text: content
                }
            };
        } else {
            // Media handling for Uazapi
            url = `${baseUrl}/message/sendMedia/${instance}`;
            body = {
                number: cleanPhone,
                options: {
                    delay: 1200,
                    presence: "composing"
                },
                mediaMessage: {
                    mediatype: type, // image, video, audio
                    caption: caption || '',
                    media: content // Espera URL ou Base64
                }
            };
        }

        try {
            console.log(`[Uazapi] Enviando mensagem para ${cleanPhone}...`);
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });
            
            const data = await response.json();
            if (!response.ok) {
                console.error("Erro Uazapi Response:", data);
                return false;
            }
            return true;
        } catch (error) {
            logError('sendToWhatsApp (Uazapi)', error);
            return false;
        }
    }

    // --- META CLOUD API LOGIC (Fallback) ---
    else if (config.provider === 'meta' || !config.provider) {
        if (!config.accessToken || !config.phoneNumberId) {
            console.warn("WhatsApp Meta: Credenciais não configuradas.");
            return false;
        }

        const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${config.phoneNumberId}/messages`;

        let body: any = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanPhone,
            type: type
        };

        if (type === 'text') {
            body.text = { body: content };
        } else if (type === 'image') {
            if (content.startsWith('http')) {
                body.image = { link: content, caption: caption || '' };
            } else {
                return false;
            }
        } else if (type === 'video') {
            if (content.startsWith('http')) {
                body.video = { link: content, caption: caption || '' };
            } else {
                return false;
            }
        } else if (type === 'audio') {
            if (content.startsWith('http')) {
                body.audio = { link: content };
            } else {
                return false;
            }
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Erro WhatsApp API:", data);
                return false;
            }

            return true;
        } catch (error) {
            console.error("Erro de rede WhatsApp:", error);
            return false;
        }
    }

    return false;
};
