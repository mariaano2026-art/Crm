
import { WhatsAppConfig, Message } from "../types";

const GRAPH_API_VERSION = 'v20.0'; // Versão estável da API Meta

// --- TYPES FOR EVOLUTION/BAILEYS PARSING ---
interface EvolutionMessage {
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

export const fetchChats = async (config: WhatsAppConfig): Promise<any[]> => {
    if (config.provider !== 'uazapi' || !config.uazapiBaseUrl || !config.uazapiKey || !config.uazapiInstance) {
        return [];
    }

    const baseUrl = config.uazapiBaseUrl.replace(/\/$/, '');
    // Endpoint comum da Evolution para buscar chats
    const url = `${baseUrl}/chat/findChats/${config.uazapiInstance}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'apikey': config.uazapiKey }
        });
        
        if (!response.ok) return [];
        
        const data = await response.json();
        // Evolution pode retornar array direto ou dentro de um objeto
        return Array.isArray(data) ? data : (data.chats || []);
    } catch (error) {
        console.error("Erro ao buscar chats Uazapi:", error);
        return [];
    }
};

export const fetchMessages = async (config: WhatsAppConfig, remoteJid: string, count = 50): Promise<Message[]> => {
    if (config.provider !== 'uazapi' || !config.uazapiBaseUrl || !config.uazapiKey || !config.uazapiInstance) {
        return [];
    }

    const baseUrl = config.uazapiBaseUrl.replace(/\/$/, '');
    // Endpoint para buscar mensagens de uma conversa
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
                    order: "DESC" // Buscar as mais recentes
                }
            })
        });

        if (!response.ok) return [];

        const rawData = await response.json();
        const messages: EvolutionMessage[] = Array.isArray(rawData) ? rawData : (rawData.messages || []);

        // Parse e conversão para o formato do CRM
        return messages.map(msg => parseEvolutionMessage(msg)).filter((m): m is Message => !!m).reverse(); // Reverter para ordem cronológica (antiga -> nova)

    } catch (error) {
        console.error("Erro ao buscar mensagens Uazapi:", error);
        return [];
    }
};

// Função auxiliar para converter formato da Evolution para formato CRM
const parseEvolutionMessage = (msg: EvolutionMessage): Message | null => {
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

    // Media
    if (msg.message.imageMessage) {
        isMedia = true;
        mediaType = 'image';
        text = msg.message.imageMessage.caption || 'Imagem';
        // Nota: URL da Evolution pode precisar de autenticação ou proxy.
        // Aqui assumimos que a Evolution retorna uma URL acessível ou Base64.
        // Se não retornar URL direta, pode ser necessário usar endpoint de download de mídia.
        mediaUrl = msg.message.imageMessage.url; 
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

    // --- UAZAPI / EVOLUTION API LOGIC ---
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
            // Nota: Uazapi geralmente espera URL ou Base64.
            // Se o conteúdo for URL local (Blob), não funcionará sem upload.
            // Assumimos aqui que 'content' é uma URL pública ou Base64 completa.
            body = {
                number: cleanPhone,
                options: {
                    delay: 1200,
                    presence: "composing"
                },
                mediaMessage: {
                    mediatype: type, // image, video, audio
                    caption: caption || '',
                    media: content 
                }
            };
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (!response.ok) {
                console.error("Erro Uazapi:", data);
                return false;
            }
            return true;
        } catch (error) {
            console.error("Erro de rede Uazapi:", error);
            return false;
        }
    }

    // --- META CLOUD API LOGIC ---
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
