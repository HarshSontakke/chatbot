/**
 * Verification Test for Multi-City Expansion, Unlisted Fallback, and Timeline Urgency
 */

async function runMultiCityTests() {
  const phone = "+91 99887 66554";
  console.log("\n=======================================================");
  console.log("TEST: MULTI-CITY FLOW WITH UNLISTED LOCALITY & BUNGALOW");
  console.log("=======================================================");

  // Step 1: Initial Greeting
  console.log("\n--> STEP 1: Sending 'Hi' (Expecting 4 Cities)...");
  const res1 = await fetch("http://localhost:3002/api/chat/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, name: "Vikram Malhotra", message: "Hi" })
  });
  const data1 = await res1.json();
  console.log("Bot Response Step 1:\n", data1.replyText);

  // Step 2: Choose Pune
  console.log("\n--> STEP 2: Choosing '2 Pune'...");
  const res2 = await fetch("http://localhost:3002/api/chat/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, name: "Vikram Malhotra", message: "2 Pune" })
  });
  const data2 = await res2.json();
  console.log("Bot Response Step 2:\n", data2.replyText);

  // Step 3: Enter Unlisted Locality
  console.log("\n--> STEP 3: Sending unlisted area 'Pimpri Chinchwad'...");
  const res3 = await fetch("http://localhost:3002/api/chat/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, name: "Vikram Malhotra", message: "Looking in Pimpri Chinchwad" })
  });
  const data3 = await res3.json();
  console.log("Bot Response Step 3:\n", data3.replyText);
  
  const hasUnlistedNotice = data3.replyText.toLowerCase().includes("connect you back once we have property on that particular location");
  console.log("\n✅ Has Unlisted Location Notice:", hasUnlistedNotice);

  // Step 4: Choose Bungalow
  console.log("\n--> STEP 4: Choosing 'Bungalow / Independent Villa'...");
  const res4 = await fetch("http://localhost:3002/api/chat/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, name: "Vikram Malhotra", message: "5 Bungalow / Independent Villa" })
  });
  const data4 = await res4.json();
  console.log("Bot Response Step 4:\n", data4.replyText);

  // Step 5: Budget -> Timeline Question
  console.log("\n--> STEP 5: Providing Budget '₹3.5 Cr to ₹6.5 Cr'...");
  const res5 = await fetch("http://localhost:3002/api/chat/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, name: "Vikram Malhotra", message: "₹3.5 Crore - ₹6.5 Crore" })
  });
  const data5 = await res5.json();
  console.log("Bot Response Step 5:\n", data5.replyText);

  // Step 6: Timeline Urgency -> Closing
  console.log("\n--> STEP 6: Choosing '1 Immediate / Ready to Move (within 30-60 Days)'...");
  const res6 = await fetch("http://localhost:3002/api/chat/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, name: "Vikram Malhotra", message: "1 Ready to move within 30-60 days" })
  });
  const data6 = await res6.json();
  console.log("Bot Response Step 6:\n", data6.replyText);
  console.log("Pugh Score:", data6.pughResult?.normalizedScore + "%");
  console.log("Is Genuine Buyer:", data6.pughResult?.isGenuine);
}

runMultiCityTests().catch(console.error);
