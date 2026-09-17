/**
 * Multi-City Real Estate Knowledge Base & Configuration Data
 * Covers 4 Major Metros: Mumbai, Pune, Bangalore, Delhi/NCR
 */

export const UNLISTED_LOCATION_NOTICE = 
  "We will connect you back once we have property on that particular location.";

export const CITIES = {
  mumbai: {
    id: "mumbai",
    name: "Mumbai",
    emoji: "🏙️",
    leadPromptText: "Mumbai (Financial Capital)",
    localities: [
      { name: "Goregaon", desc: "East / West (Metro Line 2A & 7, IT Parks)", emoji: "🌆", keywords: ["goregaon", "film city", "oberoi"] },
      { name: "Kandivali", desc: "Lokhandwala / Link Road / Mahavir Nagar", emoji: "🏙️", keywords: ["kandivali", "lokhandwala", "mahavir nagar", "link road"] },
      { name: "Borivali", desc: "IC Colony / Shimpoli / National Park", emoji: "🌳", keywords: ["borivali", "ic colony", "shimpoli", "national park"] },
      { name: "Malad / Andheri", desc: "Mindspace / Western Express Highway", emoji: "🚉", keywords: ["malad", "andheri", "mindspace", "weh", "infinity"] }
    ],
    curatedKeywords: [
      "goregaon", "kandivali", "borivali", "malad", "andheri", 
      "lokhandwala", "shimpoli", "ic colony", "mindspace"
    ]
  },
  pune: {
    id: "pune",
    name: "Pune",
    emoji: "🌳",
    leadPromptText: "Pune (Oxford of the East & Tech Hub)",
    localities: [
      { name: "Baner / Balewadi", desc: "High Street & Premium Cosmopolitan Living", emoji: "🛍️", keywords: ["baner", "balewadi", "high street"] },
      { name: "Wakad / Hinjewadi", desc: "IT Park & Rajiv Gandhi Infotech Corridor", emoji: "💻", keywords: ["wakad", "hinjewadi", "hinjawadi", "phase 1", "phase 2"] },
      { name: "Kharadi / Viman Nagar", desc: "EON Free Zone & Airport Corridor", emoji: "✈️", keywords: ["kharadi", "viman nagar", "eon", "kalyani nagar"] },
      { name: "Kothrud / Bavdhan", desc: "Green Scenic Foothills & Heritage Living", emoji: "🍃", keywords: ["kothrud", "bavdhan", "paud road"] }
    ],
    curatedKeywords: [
      "baner", "balewadi", "wakad", "hinjewadi", "hinjawadi", 
      "kharadi", "viman nagar", "kothrud", "bavdhan", "kalyani nagar"
    ]
  },
  bangalore: {
    id: "bangalore",
    name: "Bangalore",
    emoji: "💻",
    leadPromptText: "Bangalore (Silicon Valley of India)",
    localities: [
      { name: "Whitefield", desc: "ITPB, Tech Parks & Luxury Gated Enclaves", emoji: "🏢", keywords: ["whitefield", "itpb", "hope farm", "kadugodi"] },
      { name: "Indiranagar / Koramangala", desc: "Prime Central Lifestyle & Dining Hub", emoji: "☕", keywords: ["indiranagar", "koramangala", "100ft road"] },
      { name: "HSR Layout / Bellandur", desc: "Outer Ring Road (ORR) Tech Corridor", emoji: "🚗", keywords: ["hsr", "hsr layout", "bellandur", "orr", "sarjapur"] },
      { name: "Sarjapur Road / Electronic City", desc: "Infosys Campus & Tech Corridors", emoji: "🌐", keywords: ["electronic city", "sarjapur", "e-city", "wipro"] }
    ],
    curatedKeywords: [
      "whitefield", "indiranagar", "koramangala", "hsr", "hsr layout", 
      "bellandur", "sarjapur", "electronic city", "e-city", "itpb"
    ]
  },
  delhi_ncr: {
    id: "delhi_ncr",
    name: "Delhi / NCR",
    emoji: "🏛️",
    leadPromptText: "Delhi / NCR (National Capital Region)",
    localities: [
      { name: "Gurgaon", desc: "Golf Course Road, Cyber City & Southern Peripheral Road", emoji: "👑", keywords: ["gurgaon", "gurugram", "golf course", "cyber city", "sohna road"] },
      { name: "Noida", desc: "Noida Expressway, Sector 150 & Greater Noida", emoji: "🛣️", keywords: ["noida", "sector 150", "expressway", "greater noida"] },
      { name: "South Delhi", desc: "Saket, Greater Kailash (GK) & Vasant Kunj", emoji: "🌳", keywords: ["south delhi", "saket", "greater kailash", "gk", "vasant kunj", "hauz khas"] },
      { name: "Dwarka / West Delhi", desc: "Expressway Connectivity & Aerocity Access", emoji: "🚉", keywords: ["dwarka", "west delhi", "aerocity", "janakpuri"] }
    ],
    curatedKeywords: [
      "gurgaon", "gurugram", "noida", "south delhi", "saket", 
      "greater kailash", "gk", "vasant kunj", "dwarka", "golf course", "cyber city"
    ]
  }
};

/**
 * Detects the city from user input
 */
export function detectCity(text = "") {
  const lower = text.toLowerCase().trim();
  
  if (lower === "1" || lower.includes("mumbai") || lower.includes("bombay")) return "mumbai";
  if (lower === "2" || lower.includes("pune")) return "pune";
  if (lower === "3" || lower.includes("bangalore") || lower.includes("bengaluru") || lower.includes("blr")) return "bangalore";
  if (lower === "4" || lower.includes("delhi") || lower.includes("ncr") || lower.includes("gurgaon") || lower.includes("noida") || lower.includes("gurugram")) return "delhi_ncr";

  return null;
}

/**
 * Checks if a user's location input matches any curated prime locality in the given city
 */
export function isCuratedLocality(cityKey, text = "") {
  if (!cityKey || !CITIES[cityKey]) return false;
  const lower = text.toLowerCase();
  const city = CITIES[cityKey];
  return city.curatedKeywords.some((kw) => lower.includes(kw));
}

/**
 * Generates the locality selection prompt for a given city
 */
export function getLocalityPrompt(cityKey) {
  const city = CITIES[cityKey] || CITIES.mumbai;
  const list = city.localities
    .map((loc, idx) => `${idx + 1}️⃣ *${loc.name}* (${loc.desc}) ${loc.emoji}`)
    .join("\n");

  return (
    `Wonderful choice! 🌟 Welcome to *${city.name}* ${city.emoji}!\n\n` +
    `Here are our curated prime locations in ${city.name}:\n\n` +
    `${list}\n\n` +
    `_(Reply with your preferred location e.g. 1, 2 or type your locality!)_`
  );
}

/**
 * Detects configuration from user input
 */
export function detectConfiguration(text = "") {
  const lower = text.toLowerCase().trim();
  if (lower.includes("bungalow") || lower.includes("banglow") || lower.includes("villa") || lower.includes("independent house") || lower === "5") {
    return "bungalow";
  }
  if (lower.includes("4bhk") || lower.includes("4 bhk") || lower === "4") return "4bhk";
  if (lower.includes("3bhk") || lower.includes("3 bhk") || lower === "3") return "3bhk";
  if (lower.includes("2bhk") || lower.includes("2 bhk") || lower === "2") return "2bhk";
  if (lower.includes("1bhk") || lower.includes("1 bhk") || lower.includes("1rk") || lower.includes("studio") || lower === "1") return "1bhk";
  return null;
}

/**
 * Dynamic pricing brackets tailored by configuration
 */
export const CONFIG_PRICING = {
  "1bhk": {
    title: "1 BHK / Compact Residence 🏠",
    brackets: [
      "1️⃣ *Under ₹45 Lakhs* 🏷️",
      "2️⃣ *₹45 Lakhs – ₹75 Lakhs* 💳",
      "3️⃣ *₹75 Lakhs – ₹1.1 Crore+* 💎"
    ]
  },
  "2bhk": {
    title: "2 BHK Family Residence 🏡",
    brackets: [
      "1️⃣ *₹60 Lakhs – ₹90 Lakhs* 🏷️",
      "2️⃣ *₹90 Lakhs – ₹1.4 Crore* 💳",
      "3️⃣ *₹1.4 Crore – ₹2.1 Crore+* 💎"
    ]
  },
  "3bhk": {
    title: "3 BHK Premium Residence 🏰",
    brackets: [
      "1️⃣ *₹1.2 Crore – ₹1.8 Crore* 🏷️",
      "2️⃣ *₹1.8 Crore – ₹2.75 Crore* 💳",
      "3️⃣ *₹2.75 Crore – ₹4 Crore+* 👑"
    ]
  },
  "4bhk": {
    title: "4 BHK Luxury Residence 👑",
    brackets: [
      "1️⃣ *₹2.5 Crore – ₹3.75 Crore* 💎",
      "2️⃣ *₹3.75 Crore – ₹5.5 Crore* 👑",
      "3️⃣ *₹5.5 Crore+ (Ultra Luxury)* 🏰"
    ]
  },
  "bungalow": {
    title: "Bungalow / Independent Luxury Villa 🏡🌴",
    brackets: [
      "1️⃣ *₹2 Crore – ₹3.5 Crore* (Scenic Suburban Villa) 🌿",
      "2️⃣ *₹3.5 Crore – ₹6.5 Crore* (Gated Community Luxury Villa) 💎",
      "3️⃣ *₹6.5 Crore – ₹12 Crore+* (Independent Elite Bungalow) 👑"
    ]
  }
};

/**
 * Generates dynamic budget prompt based on chosen configuration
 */
export function getDynamicBudgetPrompt(configKey = "2bhk") {
  const config = CONFIG_PRICING[configKey] || CONFIG_PRICING["2bhk"];
  const brackets = config.brackets.join("\n");

  return (
    `Got it! 💎 To help us show you properties with the best layouts and builder offers for a *${config.title}*, *which price bracket suits you comfortably?*\n\n` +
    `💰 *Tailored Price Brackets:*\n` +
    `${brackets}\n\n` +
    `🤝 *Payment & Loan Assistance:*\n` +
    `(Complimentary bank loan pre-approvals and EMI estimates are happily provided!)\n\n` +
    `_(Reply with 1, 2, 3 or your custom budget range!)_`
  );
}
