
import { WhatsAppConfig } from "../types";

const GRAPH_API_VERSION = 'v20.0'; // Versão estável da API Meta

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