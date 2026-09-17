import { env } from "../config/env.js";
import { QUALIFICATION_QUESTIONS, getDecisiveClosingMessage } from "./questions.js";
import { evaluatePughMatrix, PUGH_CRITERIA } from "./pugh-matrix.js";
import { 
  CITIES, 
  detectCity, 
  isCuratedLocality, 
  getLocalityPrompt, 
  detectConfiguration, 
  CONFIG_PRICING, 
  getDynamicBudgetPrompt, 
  UNLISTED_LOCATION_NOTICE 
} from "./city-data.js";

/**
 * Rate limit retry wrapper for LLM calls (handles 429 Too Many Requests)
 */
export async function callLLM(fn, retries = 3, delayMs = 3000) {
  try {
    return await fn();
  } catch (err) {
    const isRateLimit =
      err.status === 429 ||
      err.code === "rate_limit_exceeded" ||
      (err.message && err.message.toLowerCase().includes("rate limit"));
    
    if (isRateLimit && retries > 0) {
      console.warn(`[NLP] Rate limit encountered. Retrying in ${delayMs / 1000}s... (${retries} retries remaining)`);
      await new Promise((r) => setTimeout(r, delayMs));
      return callLLM(fn, retries - 1, delayMs * 2);
    }
    throw err;
  }
}

/**
 * Heuristic NLP Intent Extractor (Reliable Offline / Zero-API-Key Fallback)
 * Analyzes conversational responses across Mumbai, Pune, Bangalore, Delhi/NCR,
 * configurations, dynamic budgets, and purchase timelines.
 */
function heuristicExtract(text, currentLeadData) {
  const lower = text.toLowerCase();
  const evaluations = { ...(currentLeadData.evaluations || {}) };

  // 1. Budget & Financial Readiness
  if (
    lower.includes("pre-approved") ||
    lower.includes("preapproved") ||
    lower.includes("cash ready") ||
    lower.includes("all cash") ||
    lower.includes("mortgage approved") ||
    lower.includes("bank sanctioned")
  ) {
    evaluations.budget_readiness = {
      score: 2,
      quote: text.slice(0, 100),
      reasoning: "Buyer has secured pre-approval or liquid cash ready for immediate escrow."
    };
  } else if (
    /\$?\d+[\d,]*\s*(k|m|million|thousand|cr|crore|lakh)/i.test(lower) ||
    lower.includes("budget is") ||
    lower.includes("bracket") ||
    lower.includes("crore") ||
    lower.includes("lakh") ||
    lower === "1" || lower === "2" || lower === "3"
  ) {
    evaluations.budget_readiness = {
      score: 1,
      quote: text.slice(0, 100),
      reasoning: "Clear budget bracket stated with viable financial expectation."
    };
  } else if (
    lower.includes("no budget") ||
    lower.includes("can't afford") ||
    lower.includes("too expensive") ||
    lower.includes("zero money") ||
    lower.includes("broke") ||
    lower.includes("just dreaming")
  ) {
    evaluations.budget_readiness = {
      score: -2,
      quote: text.slice(0, 100),
      reasoning: "Explicit non-buyer signals: lack of budget or affordability."
    };
  }

  // 2. Timeline & Purchase Urgency (Key Genuine Buyer Qualifier)
  if (
    lower.includes("immediate") ||
    lower.includes("urgently") ||
    lower.includes("ready to move") ||
    lower.includes("within 30") ||
    lower.includes("30-60") ||
    lower.includes("this month") ||
    lower.includes("next month") ||
    lower === "1"
  ) {
    evaluations.timeline_urgency = {
      score: 2,
      quote: text.slice(0, 100),
      reasoning: "High purchase urgency: immediate readiness or under 30-60 days."
    };
  } else if (
    lower.includes("60 days") ||
    lower.includes("2 months") ||
    lower.includes("3 months") ||
    lower.includes("3 to 6") ||
    lower.includes("near-term") ||
    lower === "2"
  ) {
    evaluations.timeline_urgency = {
      score: 1,
      quote: text.slice(0, 100),
      reasoning: "Active search window within 3 to 6 months."
    };
  } else if (
    lower.includes("under construction") ||
    lower.includes("6 to 12") ||
    lower.includes("new launch") ||
    lower === "3"
  ) {
    evaluations.timeline_urgency = {
      score: 0,
      quote: text.slice(0, 100),
      reasoning: "Mid-term investment or under-construction possession timeline (6 to 12 months)."
    };
  } else if (
    lower.includes("just browsing") ||
    lower.includes("just looking") ||
    lower.includes("exploring") ||
    lower.includes("no rush") ||
    lower.includes("1+ year") ||
    lower.includes("next year") ||
    lower.includes("someday") ||
    lower.includes("casual") ||
    lower === "4"
  ) {
    evaluations.timeline_urgency = {
      score: -2,
      quote: text.slice(0, 100),
      reasoning: "Casual explorer signal: prolonged indefinite timeline (>12 months)."
    };
  }

  // 3. Requirement Specificity & Location Clarity (Mumbai, Pune, Bangalore, Delhi/NCR)
  const isCityMentioned = 
    lower.includes("mumbai") || lower.includes("pune") || 
    lower.includes("bangalore") || lower.includes("bengaluru") || 
    lower.includes("delhi") || lower.includes("ncr") || lower.includes("gurgaon") || lower.includes("noida");

  const isLocalityMentioned = 
    lower.includes("goregaon") || lower.includes("borivali") || lower.includes("kandivali") || lower.includes("malad") || lower.includes("andheri") ||
    lower.includes("baner") || lower.includes("balewadi") || lower.includes("wakad") || lower.includes("hinjewadi") || lower.includes("kharadi") || lower.includes("kothrud") ||
    lower.includes("whitefield") || lower.includes("indiranagar") || lower.includes("koramangala") || lower.includes("hsr") || lower.includes("sarjapur") || lower.includes("electronic city") ||
    lower.includes("gurgaon") || lower.includes("noida") || lower.includes("saket") || lower.includes("dwarka");

  const isConfigMentioned = 
    lower.includes("bhk") || lower.includes("1rk") || lower.includes("bungalow") || 
    lower.includes("banglow") || lower.includes("villa");

  if ((isCityMentioned || isLocalityMentioned) && isConfigMentioned) {
    evaluations.requirement_clarity = {
      score: 2,
      quote: text.slice(0, 100),
      reasoning: "Clear city/locality coupled with unit configuration (BHK / Bungalow)."
    };
  } else if (isCityMentioned || isLocalityMentioned || isConfigMentioned) {
    evaluations.requirement_clarity = {
      score: 1,
      quote: text.slice(0, 100),
      reasoning: "Specific metro city, locality, or unit configuration stated."
    };
  } else if (lower.includes("anything") || lower.includes("whatever") || lower.includes("anywhere")) {
    evaluations.requirement_clarity = {
      score: -1,
      quote: text.slice(0, 100),
      reasoning: "Broad non-committal parameters without geographic focus."
    };
  }

  // 4. Decision Authority
  if (
    lower.includes("i am deciding") ||
    lower.includes("myself and my wife") ||
    lower.includes("my spouse and i") ||
    lower.includes("ready to sign") ||
    lower.includes("sole buyer") ||
    lower.includes("for my family")
  ) {
    evaluations.decision_authority = {
      score: 2,
      quote: text.slice(0, 100),
      reasoning: "Primary decision-maker or verified joint buyer ready to take action."
    };
  }

  // 5. Engagement Commitment
  if (
    lower.includes("saturday") ||
    lower.includes("sunday") ||
    lower.includes("weekend") ||
    lower.includes("visit site") ||
    lower.includes("tour") ||
    lower.includes("walkthrough") ||
    lower.includes("brochure") ||
    lower.includes("yes available")
  ) {
    evaluations.engagement_commitment = {
      score: 2,
      quote: text.slice(0, 100),
      reasoning: "Active commitment to property inspection or brochure review."
    };
  }

  return evaluations;
}

/**
 * Main NLP Agent Turn Processor
 * Manages 5 sequential stages:
 * Turn 1: City Selection (Mumbai, Pune, Bangalore, Delhi/NCR)
 * Turn 2: Locality Selection (with unlisted location notice)
 * Turn 3: Configuration (1 BHK, 2 BHK, 3 BHK, 4 BHK, Bungalow)
 * Turn 4: Dynamic Budget tailored to Configuration
 * Turn 5: Purchase Timeline Urgency (Qualifier)
 * Turn 6+: Decisive Handover / Warm Farewell Closing
 */
export async function processConversationTurn({
  senderPhone,
  senderName = "Guest",
  incomingMessage,
  leadData = {}
}) {
  const history = leadData.chatHistory || [];
  const currentTurn = (leadData.turnCount || 0) + 1;
  const currentStage = Math.min(currentTurn, QUALIFICATION_QUESTIONS.length);

  // Detect and track state variables across conversation
  let cityKey = leadData.city || null;
  let configKey = leadData.configuration || null;
  let locality = leadData.locality || null;

  // City detection if on Turn 1 or not yet detected
  if (!cityKey) {
    const detected = detectCity(incomingMessage);
    if (detected) cityKey = detected;
  }

  // Configuration detection if on Turn 3 or configuration mentioned
  if (!configKey) {
    const detectedCfg = detectConfiguration(incomingMessage);
    if (detectedCfg) configKey = detectedCfg;
  }

  // 1. Extract Lead Evaluations (via OpenAI if key present, else Heuristic)
  let updatedEvaluations = { ...(leadData.evaluations || {}) };
  let replyText = "";
  let isSalesHandoverTriggered = false;

  const hasOpenAiKey = env.OPENAI_API_KEY && env.OPENAI_API_KEY.startsWith("sk-") && !env.OPENAI_API_KEY.includes("your_openai_key");

  if (hasOpenAiKey) {
    try {
      const response = await callLLM(async () => {
        const fetchRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: (env.AGENT_MODEL || "gpt-4o-mini").replace(/^openai\//, "").replace(/"/g, ""),
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: `You are the AI Property Dealer Bot for ${env.BUSINESS_NAME}.
You assist buyers across 4 major Indian metros: Mumbai 🏙️, Pune 🌳, Bangalore 💻, and Delhi / NCR 🏛️.
You are an interactive, welcoming real estate assistant communicating over WhatsApp.

CURRENT ACTIVE STAGE: STAGE ${currentStage} of 5.
CURRENT STATE CONTEXT:
- Detected City: ${cityKey ? CITIES[cityKey]?.name : "Not yet chosen (Stage 1)"}
- Detected Configuration: ${configKey || "Not yet chosen"}
- Prior Locality: ${locality || "Not yet specified"}

🚨 CRITICAL MANDATORY RULES:
1. ASK ONLY ONE QUESTION PER MESSAGE! Never combine stages. Asking multiple topics in one turn is strictly forbidden.
2. NON-JUDGMENTAL TONE: The user must NEVER feel like they are being vetted, judged, or screened. Treat every user with warmth, dignity, and respect.
3. UNLISTED LOCATION RULE (FOR STAGE 2 -> 3):
   If the user names an area that is NOT one of our curated 3-4 prime localities for their city, you MUST explicitly state:
   "Thank you for sharing that! We will connect you back once we have property on that particular location. 🤝"
   And then immediately ask the Stage 3 question (Unit Configuration).

EXACT STAGE GUIDE (FOCUS ONLY ON STAGE ${currentStage}):

• If STAGE 1 (City Selection):
  Greet warmly and ask which of the 4 cities they are looking to buy property in:
  "Hello! 👋 Welcome to *${env.BUSINESS_NAME}*! 🏡✨
I am your personal AI Property Dealer Bot.

To help me curate verified properties matching your goals, *which major city are you looking to buy property in?*

1️⃣ *Mumbai* 🏙️
2️⃣ *Pune* 🌳
3️⃣ *Bangalore* 💻
4️⃣ *Delhi / NCR* 🏛️

_(Feel free to reply with 1, 2, 3, 4 or your city name!)_"

• If STAGE 2 (Locality Selection):
  User chose a city (${cityKey ? CITIES[cityKey]?.name : "their city"}).
  Acknowledge warmly and present ONLY the 3 to 4 prime localities for that city:
  ${cityKey ? getLocalityPrompt(cityKey) : "Present the 3-4 prime locations for their selected city."}
  ⚠️ DO NOT ask about configuration, budget, or timeline in Stage 2!

• If STAGE 3 (Configuration Selection):
  User replied with their locality.
  Check if their locality was unlisted. If unlisted, include:
  "Thank you for sharing that! *${UNLISTED_LOCATION_NOTICE}* 🤝"
  If it was a known prime locality, acknowledge warmly (e.g. "Great choice! That's a prime corridor! 🌟").
  Then ask ONLY for their preferred unit configuration:
  "🛋️ *What home configuration fits your lifestyle and plans best?*

1️⃣ *1 BHK* 🏠
2️⃣ *2 BHK* 🏡
3️⃣ *3 BHK* 🏰
4️⃣ *4 BHK* 👑
5️⃣ *Bungalow / Independent Villa* 🏡🌴

_(Reply with 1, 2, 3, 4, 5 or your preferred home size!)_"
  ⚠️ DO NOT ask for budget or timeline in Stage 3!

• If STAGE 4 (Dynamic Budget tailored to Configuration):
  User selected configuration: ${configKey ? configKey.toUpperCase() : "their configuration"}.
  Acknowledge their configuration choice warmly.
  Then present the EXACT dynamic price brackets corresponding to *${configKey || "their configuration"}*:
${getDynamicBudgetPrompt(configKey || "2bhk")}
  ⚠️ CRITICAL: You must use the EXACT price brackets and figures specified above! (For Bungalow/Villa use ₹2 Cr – ₹12 Cr+; for 1 BHK use ₹45L – ₹1.1 Cr; for 3 BHK use ₹1.2 Cr – ₹4 Cr). NEVER substitute with standard 2 BHK prices!
  ⚠️ DO NOT ask for timeline in Stage 4!

• If STAGE 5 (Purchase Timeline & Urgency Qualifier):
  User provided their budget.
  Acknowledge warmly.
  Then ask ONLY the purchase timeline question to qualify their buying horizon:
  "Timing is everything to reserve prime inventory and launch offers! ⏱️🔑

*When are you planning to buy and take possession of this property?*

1️⃣ *Immediate / Ready to Move (within 30–60 Days)* 🚚💨
2️⃣ *Near-Term (within 3 to 6 Months)* 🗓️
3️⃣ *Under Construction / New Launch (6 to 12+ Months)* 🏗️
4️⃣ *Flexible / Planning ahead for the future (1+ Year)* ☕

_(Reply with 1, 2, 3, 4 or your expected timeline!)_"

• CLOSING & FAREWELL GREETING (Stage > 5 or when lead completes):
  - High-Intent Active Buyer (Immediate or 3-6 months):
    "🎉 *Thank you so much!* 🏡✨
We have compiled a curated shortlist of verified properties matching your exact location, configuration, and budget.
Our Senior Property Specialist, *Rajesh Sharma*, will connect with you on WhatsApp within 15 minutes to share exclusive floor plans, payment breakdowns, and confirm your private VIP pass! 🤝🔑

🙏 *Wishing you and your family all the very best!* It was an absolute pleasure assisting you today. Have a wonderful and blessed day ahead! 🌟🏡"
  - Casual Explorer / Long-term:
    "🏡 *Thank you for connecting with ${env.BUSINESS_NAME}!* ✨
Here is our complimentary 2026 Metropolitan Real Estate Price Index & Market Trends Guide: https://havencraftrealty.com/mumbai-guide-2026 📑
Feel free to reach out anytime whenever you'd like to explore homes or ask questions.
🙏 *Wishing you and your family a wonderful day ahead!* 🌟☕"

FAREWELL INTENT:
If user says "thank you", "thanks", "bye", "goodbye", reply with a warm, polite farewell greeting!

PUGH MATRIX SCORING (COMPLETELY SILENT IN BACKGROUND):
Silently evaluate:
- budget_readiness: (-2 to +2)
- timeline_urgency: (-2 to +2)
- requirement_clarity: (-2 to +2)
- decision_authority: (-2 to +2)
- engagement_commitment: (-2 to +2)
DO NOT reveal scores to the user.

OUTPUT JSON SCHEMA:
{
  "replyText": "your WhatsApp response asking ONLY the single question for Stage ${currentStage}",
  "extractedEvaluations": {
    "criterion_key": { "score": -2 to 2, "quote": "exact user words", "reasoning": "brief reason" }
  },
  "detectedCity": "mumbai | pune | bangalore | delhi_ncr | null",
  "detectedConfig": "1bhk | 2bhk | 3bhk | 4bhk | bungalow | null",
  "detectedName": "user name or null"
}`
              },
              ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
              { role: "user", content: incomingMessage }
            ],
            temperature: 0.3
          })
        });

        if (!fetchRes.ok) {
          throw new Error(`OpenAI API error: ${fetchRes.status} ${fetchRes.statusText}`);
        }
        return await fetchRes.json();
      });

      const parsed = JSON.parse(response.choices[0].message.content);
      if (parsed.replyText) replyText = parsed.replyText;
      if (parsed.extractedEvaluations) {
        updatedEvaluations = { ...updatedEvaluations, ...parsed.extractedEvaluations };
      }
      if (parsed.detectedCity && !cityKey) cityKey = parsed.detectedCity;
      if (parsed.detectedConfig && !configKey) configKey = parsed.detectedConfig;
    } catch (err) {
      console.warn("[NLP] OpenAI call failed or returned error, falling back to heuristic engine:", err.message);
      updatedEvaluations = heuristicExtract(incomingMessage, leadData);
    }
  } else {
    // Zero-config heuristic fallback
    updatedEvaluations = heuristicExtract(incomingMessage, leadData);
  }

  // 2. Calculate Pugh Matrix Scorecard
  const pughResult = evaluatePughMatrix(updatedEvaluations, env.PUGH_QUALIFICATION_THRESHOLD);

  // 3. Determine Next Conversational Question if replyText not already built by LLM
  if (!replyText) {
    const lower = incomingMessage.toLowerCase().trim();
    const isGreeting = /^(hi|hello|hey|start|good morning|namaste|greetings)/i.test(lower) || currentTurn === 1;
    const isFarewell = /^(thank|thanks|thankyou|thx|bye|goodbye|cya|good night|have a good day|ok thanks|okay thanks|alright thanks|dhanyawad|shukriya|great thanks|ok bye)/i.test(lower);
    
    if (isFarewell) {
      replyText = `You're very welcome${senderName !== "Guest" ? ` ${senderName}` : ""}! 🙏✨ It was an absolute pleasure assisting you today.\n\n` +
        `Wishing you and your family abundant joy, peace, and great success in your home search! 🏡💫\n\n` +
        `I'm always right here on WhatsApp whenever you need any market updates, floor plans, or property advice. Have a wonderful and blessed day ahead! 🌟☕`;
    } else if (isGreeting && currentTurn === 1) {
      replyText = QUALIFICATION_QUESTIONS[0].fullPrompt;
    } else if (currentTurn === 2) {
      // User answered City
      const chosenCity = cityKey || detectCity(incomingMessage) || "mumbai";
      cityKey = chosenCity;
      replyText = getLocalityPrompt(chosenCity);
    } else if (currentTurn === 3) {
      // User answered Locality
      const isCurated = isCuratedLocality(cityKey, incomingMessage);
      const prefix = isCurated 
        ? `Wonderful! 🌟 That's a prime corridor.\n\n`
        : `Thank you for sharing that! *${UNLISTED_LOCATION_NOTICE}* 🤝\n\n`;
      replyText = prefix + QUALIFICATION_QUESTIONS[2].fullPrompt;
    } else if (currentTurn === 4) {
      // User answered Configuration
      const cfg = configKey || detectConfiguration(incomingMessage) || "2bhk";
      configKey = cfg;
      replyText = getDynamicBudgetPrompt(cfg);
    } else if (currentTurn === 5) {
      // User answered Budget -> Ask Purchase Timeline
      replyText = QUALIFICATION_QUESTIONS[4].fullPrompt;
    } else {
      // Closing
      replyText = getDecisiveClosingMessage(pughResult, { name: senderName, city: cityKey ? CITIES[cityKey]?.name : "" });
    }
  }

  // Format WhatsApp markdown: replace **text** with *text*
  replyText = replyText.replace(/\*\*(.*?)\*\*/g, "*$1*");

  // Check if lead qualifies for immediate sales handover
  if (pughResult.isGenuine && !leadData.salesHandoverSent) {
    isSalesHandoverTriggered = true;
  }

  return {
    replyText,
    evaluations: updatedEvaluations,
    pughResult,
    turnCount: currentTurn,
    stage: currentStage,
    city: cityKey,
    configuration: configKey,
    isSalesHandoverTriggered
  };
}
