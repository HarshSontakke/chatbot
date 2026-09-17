async function testConversation() {
  console.log("\n==================================================");
  console.log("TEST 1: HIGH-INTENT GENUINE BUYER");
  console.log("==================================================");

  const res1 = await fetch("http://localhost:3002/api/chat/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: "+91 98200 11223",
      name: "Aditya Malhotra",
      message: "I am looking for a 3-BHK luxury apartment in Goregaon East under ₹1.85 Crore. My home loan is pre-approved with HDFC Bank, and I want to move in within 30 days."
    })
  });

  const data1 = await res1.json();
  console.log("Bot Response:\n", data1.replyText);
  console.log("\nPugh Matrix Score:", data1.pughResult?.normalizedScore + "%");
  console.log("Classification:", data1.pughResult?.classification);
  console.log("Sales Handover Triggered:", data1.isSalesHandoverTriggered);

  console.log("\n==================================================");
  console.log("TEST 2: CASUAL WINDOW SHOPPER");
  console.log("==================================================");

  const res2 = await fetch("http://localhost:3002/api/chat/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: "+91 99300 44556",
      name: "Karan Verma",
      message: "Just browsing for fun, no budget right now maybe in 2 years haha. Don't call me please."
    })
  });

  const data2 = await res2.json();
  console.log("Bot Response:\n", data2.replyText);
  console.log("\nPugh Matrix Score:", data2.pughResult?.normalizedScore + "%");
  console.log("Classification:", data2.pughResult?.classification);
  console.log("Sales Handover Triggered:", data2.isSalesHandoverTriggered);
}

testConversation().catch(console.error);
