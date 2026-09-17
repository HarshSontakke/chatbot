async function testMetaWebhook() {
  const payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "166900666499914",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "+91 97023 42038",
                phone_number_id: "108241432250276"
              },
              contacts: [
                {
                  profile: { name: "Harshvardhan Joshi" },
                  wa_id: "919876543210"
                }
              ],
              messages: [
                {
                  from: "919876543210",
                  id: "wamid.TEST_" + Date.now(),
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  text: { body: "Hi, I am looking for a 3-BHK apartment in Mumbai Goregaon East under ₹1.85 Cr. My loan is pre-approved." },
                  type: "text"
                }
              ]
            },
            field: "messages"
          }
        ]
      }
    ]
  };

  console.log("Sending simulated Meta Webhook POST to live ngrok URL...");
  const res = await fetch("https://pencil-scarf-gills.ngrok-free.dev/api/webhook/meta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  console.log("Status:", res.status, await res.text());
}

testMetaWebhook().catch(console.error);
