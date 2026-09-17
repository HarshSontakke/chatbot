async function testGreetingAndQA() {
  console.log("\n=======================================================");
  console.log("TEST 1: USER SENDS 'Hi'");
  console.log("=======================================================");

  const phone = "+91 98205 77889";

  const res1 = await fetch("http://localhost:3002/api/chat/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone,
      name: "Rohit Sharma",
      message: "Hi"
    })
  });

  const data1 = await res1.json();
  console.log("Bot Response to 'Hi':\n", data1.replyText);

  console.log("\n=======================================================");
  console.log("TEST 2: USER ASKS PROPERTY QUESTION DURING CHAT");
  console.log("=======================================================");

  const res2 = await fetch("http://localhost:3002/api/chat/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone,
      name: "Rohit Sharma",
      message: "What is the typical price for a 3BHK in Mumbai Goregaon and do you provide home loan assistance?"
    })
  });

  const data2 = await res2.json();
  console.log("Bot Response to Property Question:\n", data2.replyText);
  console.log("\nPugh Matrix Score:", data2.pughResult?.normalizedScore + "%");
}

testGreetingAndQA().catch(console.error);
