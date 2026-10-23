import { env } from "../src/config/env.js";

async function run() {
  console.log("Checking OpenAI...");
  const cleanKey = env.OPENAI_API_KEY ? env.OPENAI_API_KEY.replace(/["']/g, "").trim() : "";
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${cleanKey}` }
    });
    const data = await res.json();
    console.log("OpenAI HTTP status:", res.status);
    if (!res.ok) {
      console.log("OpenAI Error details:", data);
    } else {
      console.log("OpenAI Key is valid!");
    }
  } catch (err) {
    console.error("OpenAI Fetch failed:", err.message);
  }

  console.log("\nChecking Meta WhatsApp API Subscription...");
  try {
    const wabaRes = await fetch(`https://graph.facebook.com/v21.0/${env.WHATSAPP_WABA_ID}/subscribed_apps`, {
      headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` }
    });
    const wabaData = await wabaRes.json();
    console.log("Subscribed Apps on WABA:", JSON.stringify(wabaData, null, 2));
  } catch (err) {
    console.error("WABA check failed:", err.message);
  }

  console.log("\nChecking Phone Number details...");
  try {
    const phoneRes = await fetch(`https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_NUMBER_ID}`, {
      headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` }
    });
    const phoneData = await phoneRes.json();
    console.log("Phone number data:", JSON.stringify(phoneData, null, 2));
  } catch (err) {
    console.error("Phone check failed:", err.message);
  }
}

run();
