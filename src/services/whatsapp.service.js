import { env } from "../config/env.js";

/**
 * WhatsApp Cloud API Integration Service
 * Complies with Meta Graph API v21.0 specs, message chunking, and 24h window guidelines.
 */
class WhatsAppService {
  constructor() {
    this.baseUrl = "https://graph.facebook.com/v21.0";
  }

  isConfigured() {
    return (
      Boolean(env.WHATSAPP_ACCESS_TOKEN) &&
      !env.WHATSAPP_ACCESS_TOKEN.includes("placeholder") &&
      !env.WHATSAPP_ACCESS_TOKEN.includes("your_system_user_token") &&
      Boolean(env.WHATSAPP_PHONE_NUMBER_ID)
    );
  }

  /**
   * Splits a long message into chunks under 4000 characters.
   */
  chunkText(text, maxChars = 4000) {
    if (!text || text.length <= maxChars) return [text];

    const chunks = [];
    let remaining = text;

    while (remaining.length > 0) {
      if (remaining.length <= maxChars) {
        chunks.push(remaining);
        break;
      }

      // Try to break at newline or period near maxChars
      let breakIndex = remaining.lastIndexOf("\n", maxChars);
      if (breakIndex === -1 || breakIndex < maxChars * 0.7) {
        breakIndex = remaining.lastIndexOf(". ", maxChars);
      }
      if (breakIndex === -1 || breakIndex < maxChars * 0.7) {
        breakIndex = maxChars;
      } else {
        breakIndex += 1;
      }

      chunks.push(remaining.slice(0, breakIndex).trim());
      remaining = remaining.slice(breakIndex).trim();
    }

    return chunks;
  }

  /**
   * Sends an outbound text message to a WhatsApp recipient.
   */
  async sendTextMessage(to, body) {
    if (!this.isConfigured()) {
      console.log(`[WHATSAPP MOCK SENDER] (Live token not configured) -> To: ${to}\nMessage:\n${body}\n`);
      return { success: true, mocked: true };
    }

    const cleanTo = to.replace(/[^\d+]/g, "").replace(/^\+/, "");
    const chunks = this.chunkText(body, 4000);

    for (const chunk of chunks) {
      const url = `${this.baseUrl}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanTo,
        type: "text",
        text: { preview_url: true, body: chunk }
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        const errCode = data?.error?.code;
        // Meta 24-hour window closed error codes: 131047 / 131049
        if (errCode === 131047 || errCode === 131049) {
          console.warn(`[WHATSAPP] 24-hour customer window closed for ${to}. Fallback to template message required.`);
          return { success: false, windowClosed: true, error: data.error };
        }
        console.error(`[WHATSAPP ERROR] Failed to send message to ${to}:`, data);
        throw new Error(`Meta API error: ${data?.error?.message || res.statusText}`);
      }

      // Small 300ms delay between multi-part chunks
      if (chunks.length > 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    console.log(`[WHATSAPP OUTBOUND DELIVERED] Successfully sent reply to ${cleanTo} (${chunks.length} chunk/s)`);
    return { success: true, chunksSent: chunks.length };
  }

  /**
   * Marks incoming message as read (blue ticks in WhatsApp).
   */
  async markAsRead(messageId) {
    if (!this.isConfigured() || !messageId) return;

    try {
      const url = `${this.baseUrl}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
      await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId
        })
      });
    } catch (err) {
      console.warn(`[WHATSAPP] Failed to mark ${messageId} as read:`, err.message);
    }
  }
}

export const whatsappService = new WhatsAppService();
