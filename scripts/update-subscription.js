import { env } from "../src/config/env.js";

async function testUpdateSubscription() {
  console.log("Testing updating WABA subscribed_apps callback...");
  console.log("Target URL:", env.WHATSAPP_WEBHOOK_URL);
  console.log("Verify Token:", env.WHATSAPP_VERIFY_TOKEN);

  const res = await fetch(`https://graph.facebook.com/v21.0/${env.WHATSAPP_WABA_ID}/subscribed_apps`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      override_callback_uri: env.WHATSAPP_WEBHOOK_URL,
      verify_token: env.WHATSAPP_VERIFY_TOKEN
    })
  });

  const data = await res.json();
  console.log("Response status:", res.status);
  console.log("Response body:", data);
}

testUpdateSubscription();
