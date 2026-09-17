import { CITIES, getLocalityPrompt, getDynamicBudgetPrompt, UNLISTED_LOCATION_NOTICE } from "./city-data.js";

/**
 * Curated Real Estate Qualification Question Bank
 * Covers 4 Major Metros (Mumbai, Pune, Bangalore, Delhi/NCR),
 * Locality Selection with Unlisted Location Handling,
 * Configuration (1 BHK, 2 BHK, 3 BHK, 4 BHK, Bungalow),
 * Dynamic Budget Range, and Purchase Timeline Urgency.
 */

export const QUALIFICATION_QUESTIONS = [
  {
    id: "city_selection",
    criterionId: "requirement_clarity",
    stage: 1,
    title: "City Selection",
    leadQuestion: "Which major city are you looking to buy property in?",
    fullPrompt: 
`Hello! 👋 Welcome to *HavenCraft Realty Advisors*! 🏡✨
I am your personal AI Property Dealer Bot.

To help me curate verified properties matching your goals, *which major city are you looking to buy property in?*

1️⃣ *Mumbai* 🏙️
2️⃣ *Pune* 🌳
3️⃣ *Bangalore* 💻
4️⃣ *Delhi / NCR* 🏛️

_(Feel free to reply with 1, 2, 3, 4 or type your city name!)_`,
    options: ["1️⃣ Mumbai", "2️⃣ Pune", "3️⃣ Bangalore", "4️⃣ Delhi / NCR"],
    whyItMatters: "Identifies primary metropolitan market focus."
  },
  {
    id: "locality_selection",
    criterionId: "requirement_clarity",
    stage: 2,
    title: "Locality & Micro-Market Selection",
    leadQuestion: "Which preferred locality or area in the city are you looking for?",
    fullPrompt: 
`Wonderful! 🌟 Let's find the neighborhood that fits you best.

📍 *Which localities would you like us to focus on?*
• *Goregaon / Kandivali / Borivali / Malad* 🌆
• *Baner / Wakad / Kharadi / Kothrud* 🌳
• *Whitefield / Indiranagar / HSR / Sarjapur* 💻
• *Gurgaon / Noida / South Delhi / Dwarka* 🏛️

_(Reply with your preferred location or type your area!)_`,
    options: ["Locality 1", "Locality 2", "Locality 3", "Locality 4"],
    whyItMatters: "Identifies micro-market focus or triggers unlisted location handling."
  },
  {
    id: "configuration_selection",
    criterionId: "requirement_clarity",
    stage: 3,
    title: "Unit Configuration",
    leadQuestion: "What configuration (1 BHK, 2 BHK, 3 BHK, 4 BHK, or Bungalow) fits your requirement?",
    fullPrompt: 
`🛋️ *What home configuration fits your lifestyle and plans best?*

1️⃣ *1 BHK* 🏠
2️⃣ *2 BHK* 🏡
3️⃣ *3 BHK* 🏰
4️⃣ *4 BHK* 👑
5️⃣ *Bungalow / Independent Villa* 🏡🌴

_(Reply with 1, 2, 3, 4, 5 or your preferred home size!)_`,
    options: ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "Bungalow / Villa"],
    whyItMatters: "Identifies property size and layout specifications."
  },
  {
    id: "budget_range",
    criterionId: "budget_readiness",
    stage: 4,
    title: "Budget Range & Options",
    leadQuestion: "What price range would you like us to focus on?",
    fullPrompt: 
`Got it! 💎 To help us show you properties with the best layouts and builder offers, *which price bracket suits you comfortably?*

💰 *Popular Price Brackets:*
1️⃣ *Affordable Comfort* 🏷️
2️⃣ *Popular Mid-Segment* 💳
3️⃣ *Premium Luxury* 💎

🤝 *Payment & Financing Assistance:*
(Complimentary bank loan pre-approvals and EMI estimates are happily provided!)

_(Reply with your preferred bracket or budget range!)_`,
    options: ["Comfort", "Mid-Segment", "Luxury"],
    whyItMatters: "Aligns financial capability and expectation without interrogation."
  },
  {
    id: "purchase_timeline",
    criterionId: "timeline_urgency",
    stage: 5,
    title: "Purchase Timeline & Urgency",
    leadQuestion: "When are you planning to buy this property to know your interest level?",
    fullPrompt: 
`Timing is everything to reserve prime inventory and launch offers! ⏱️🔑

*When are you planning to buy and take possession of this property?*

1️⃣ *Immediate / Ready to Move (within 30–60 Days)* 🚚💨
2️⃣ *Near-Term (within 3 to 6 Months)* 🗓️
3️⃣ *Under Construction / New Launch (6 to 12+ Months)* 🏗️
4️⃣ *Flexible / Planning ahead for the future (1+ Year)* ☕

_(Reply with 1, 2, 3, 4 or your expected timeline!)_`,
    options: ["1️⃣ Ready (30-60 Days)", "2️⃣ 3-6 Months", "3️⃣ 6-12 Months", "4️⃣ Planning Ahead"],
    whyItMatters: "Primary discriminator qualifying genuine high-intent buyers vs casual window shoppers."
  }
];

/**
 * Generates the polite, emoji-rich closing message based on final Pugh Matrix qualification.
 * NEVER reveals internal scores, rankings, or qualification judgments to the user.
 */
export function getDecisiveClosingMessage(pughResult, leadData = {}) {
  const name = leadData.name ? ` ${leadData.name}` : "";
  const city = leadData.city ? ` in ${leadData.city}` : "";

  if (pughResult.isGenuine) {
    return (
      `*Thank you so much${name}!* 🎉🏡✨\n\n` +
      `We have compiled a curated shortlist of verified properties${city} matching your exact preferences, budget, and timeline.\n\n` +
      `📞 Our *Senior Property Specialist, Rajesh Sharma*, will connect with you on WhatsApp within *15 minutes* to share exclusive floor plans, payment breakdowns, and confirm your private VIP pass! 🤝🔑\n\n` +
      `🙏 *Wishing you and your family all the very best!* It was an absolute pleasure assisting you today. Have a wonderful and blessed day ahead! 🌟🏡`
    );
  }

  if (pughResult.classification === "NURTURE_LEAD") {
    return (
      `*Thank you for sharing your preferences${name}!* 🏡✨\n\n` +
      `We have saved your preferred locations and configurations. Since your timeline is flexible, we'll keep you updated with curated launches and price updates${city}! 📑📈\n\n` +
      `Whenever you'd like to view sample flats or discuss options, feel free to message us here anytime! ☕\n\n` +
      `🙏 *Have a great and peaceful day ahead!* Wishing you the best on your property search! 🌟💫`
    );
  }

  // Casual explorer closing - completely warm and welcoming
  return (
    `*Thank you for connecting with HavenCraft Realty${name}!* 🌟\n\n` +
    `To assist your research, here is our complimentary *2026 Metropolitan Real Estate Price Index & Market Guide*:\n` +
    `👉 https://havencraftrealty.com/mumbai-guide-2026 📑\n\n` +
    `Feel free to reach out anytime whenever you'd like to explore homes or ask questions.\n\n` +
    `🙏 *Have a wonderful day ahead!* Wishing you and your family success and happiness! ☕✨`
  );
}
