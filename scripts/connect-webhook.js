import { env } from "../src/config/env.js";

/**
 * Automatically registers the webhook with Meta Graph API
 * Usage: node scripts/connect-webhook.js https://your-ngrok-domain.ngrok-free.app
 */

const publicUrl = process.argv[2] || env.WHATSAPP_WEBHOOK_URL;
const webhookEndpoint = publicUrl.endsWith("/api/webhook/meta")
  ? publicUrl
  : `${publicUrl.replace(/\/$/, "")}/api/webhook/meta`;

console.log(`\nRegistering WhatsApp Webhook with Meta Graph API...`);
console.log(`WABA ID:       ${env.WHATSAPP_WABA_ID}`);
console.log(`Callback URL:  ${webhookEndpoint}`);
console.log(`Verify Token:  ${env.WHATSAPP_VERIFY_TOKEN}\n`);

async function registerWebhook() {
  if (!env.WHATSAPP_ACCESS_TOKEN || env.WHATSAPP_ACCESS_TOKEN.includes("placeholder")) {
    console.error("❌ Error: Valid WHATSAPP_ACCESS_TOKEN must be set in your .env file.");
    process.exit(1);
  }

  const endpoint = `https://graph.facebook.com/v21.0/${env.WHATSAPP_WABA_ID}/subscribed_apps`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        subscribed_fields: ["messages", "statuses", "message_template_status_update"],
        override_callback_uri: webhookEndpoint,
        verify_token: env.WHATSAPP_VERIFY_TOKEN
      })
    });

    const data = await response.json();
    if (response.ok && data.success) {
      console.log("✅ Webhook subscribed successfully with Meta Graph API!");
      console.log(data);
    } else {
      console.error("❌ Meta API Subscription Failed:", data);
    }
  } catch (err) {
    console.error("❌ Network or fetch error:", err.message);
  }
}

registerWebhook();
