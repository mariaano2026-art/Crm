import { WhatsAppConfig } from "../types";

const GRAPH_API_VERSION = 'v20.0'; // Versão estável da API

export const sendToWhatsApp = async (
    config: WhatsAppConfig, 
    to: string, 
    type: 'text' | 'image' | 'video' | 'audio', 
    content: string, 
    caption?: string
): Promise<boolean> => {
    
    if (!config.accessToken || !config.phoneNumberId) {
        console.warn("WhatsApp: Credenciais não configuradas.");
        return false;
    }

    // Limpeza do número de telefone (apenas números)
    const cleanPhone = to.replace(/\D/g, '');

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
        // Verifica se é URL ou Base64 (A API prefere URLs públicas, mas aceita ID de mídia se feito upload antes. 
        // Para simplificar neste frontend, assumimos URLs. Se for base64, precisaria de upload session, 
        // o que é complexo para front-only. Vamos assumir URL para media links.)
        if (content.startsWith('http')) {
            body.image = { link: content, caption: caption || '' };
        } else {
            console.warn("WhatsApp API: Envio direto de Base64 não suportado diretamente no endpoint de mensagens sem upload prévio. Use URLs públicas.");
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
};