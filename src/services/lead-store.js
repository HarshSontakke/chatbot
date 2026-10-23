import { evaluatePughMatrix } from "../engine/pugh-matrix.js";
import { formatIndianCitizenName } from "./indian-names.js";

/**
 * In-Memory & Real-Time Lead Store
 * Tracks lead profiles, chat transcripts, Pugh matrix evaluations, and sales dispatch statuses.
 * Guaranteed 100% Indian citizen profiles, personas, and identities across all metro markets.
 */
class LeadStore {
  constructor() {
    this.leads = new Map();
    this.salesDispatches = [];
    this.subscribers = new Set();

    // Seed with initial illustrative sample data for immediate visual clarity on the dashboard
    this.seedInitialLeads();
  }

  seedInitialLeads() {
    // 1. Mumbai: Rohan & Priya Sharma (High-Intent Genuine Buyer - 3 BHK Goregaon)
    const rohanEval = {
      budget_readiness: {
        score: 2,
        quote: "We have ₹1.85 Cr pre-approved with HDFC Bank, ready with liquid down payment today",
        reasoning: "Verified HDFC home loan sanction with liquid down payment ready"
      },
      timeline_urgency: {
        score: 2,
        quote: "Need to close and move in within 45 days before new school session begins in June",
        reasoning: "Strict immediate moving window under 60 days"
      },
      requirement_clarity: {
        score: 2,
        quote: "Looking for a 3-BHK luxury apartment in Goregaon East near Western Express Highway with 2 parking bays",
        reasoning: "Explicit micro-market location and exact unit layout"
      },
      decision_authority: {
        score: 1,
        quote: "My wife and I will be deciding together, we both reviewed the locality already",
        reasoning: "Primary buyers ready to co-sign"
      },
      engagement_commitment: {
        score: 2,
        quote: "Yes, we can visit this Saturday at 11 AM for the private walkthrough",
        reasoning: "Confirmed attendance for upcoming VIP site tour"
      }
    };
    const rohanPugh = evaluatePughMatrix(rohanEval, 70);

    const lead1 = {
      id: "lead_mum_101",
      phone: "+91 98201 45678",
      name: "Rohan & Priya Sharma",
      city: "mumbai",
      configuration: "3 BHK",
      source: "WhatsApp Meta Cloud API",
      status: "GENUINE_BUYER",
      isGenuine: true,
      pughScore: rohanPugh.normalizedScore,
      pughResult: rohanPugh,
      evaluations: rohanEval,
      turnCount: 5,
      lastSeen: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      salesHandoverSent: true,
      salesHandoverDetails: {
        dispatchedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        assignedSpecialist: "Rajesh Sharma (Senior Property Specialist)",
        priority: "URGENT (Score: 96%)",
        recommendedAction: "Confirm Saturday 11 AM VIP tour in Goregaon East and send floor plans"
      },
      chatHistory: [
        { role: "user", content: "Hi, I am looking for a 3-BHK luxury apartment in Goregaon East near Western Express Highway.", timestamp: "11:15 AM" },
        { role: "assistant", content: "Welcome Rohan & Priya! 🏰 Which configuration and budget bracket suits your family best?", timestamp: "11:15 AM" },
        { role: "user", content: "3 BHK around ₹1.85 Cr. We have ₹1.85 Cr pre-approved with HDFC Bank, ready with liquid down payment today.", timestamp: "11:16 AM" },
        { role: "assistant", content: "That is excellent financial readiness! How soon are you planning to close and move in?", timestamp: "11:17 AM" },
        { role: "user", content: "Need to close and move in within 45 days before new school session begins in June. Also, quick question—how is the monsoon traffic around Goregaon East or what is the weather like today?", timestamp: "11:18 AM" },
        { role: "assistant", content: "The Western Express Highway flyovers and Metro Line 7 ensure smooth commutes even during monsoon, and today the weather in Mumbai is pleasant around 30°C! 🌤️ Who will be the primary signers on the property deed, and would you like to schedule a private tour this Saturday?", timestamp: "11:19 AM" },
        { role: "user", content: "My wife and I will be deciding together, we both reviewed the locality already. Please confirm Saturday 11 AM VIP tour in Goregaon East!", timestamp: "11:20 AM" }
      ]
    };

    // 2. Pune: Aditya & Sneha Kulkarni (Genuine Buyer - 2 BHK Baner / Balewadi)
    const adityaEval = {
      budget_readiness: {
        score: 2,
        quote: "Budget ₹1.2 Cr to ₹1.4 Cr pre-approved with SBI Home Finance",
        reasoning: "Pre-approved SBI home loan"
      },
      timeline_urgency: {
        score: 2,
        quote: "Immediate possession required within 30 to 60 days",
        reasoning: "Immediate moving timeline"
      },
      requirement_clarity: {
        score: 2,
        quote: "2 BHK in Baner or Balewadi near High Street",
        reasoning: "Specific locality and unit size"
      },
      decision_authority: {
        score: 1,
        quote: "Both husband and wife finalized the choice",
        reasoning: "Direct decision makers"
      },
      engagement_commitment: {
        score: 2,
        quote: "Book site inspection for Sunday morning",
        reasoning: "Site visit confirmed"
      }
    };
    const adityaPugh = evaluatePughMatrix(adityaEval, 70);

    const lead2 = {
      id: "lead_pun_102",
      phone: "+91 98220 33445",
      name: "Aditya & Sneha Kulkarni",
      city: "pune",
      configuration: "2 BHK",
      source: "WhatsApp Meta Cloud API",
      status: "GENUINE_BUYER",
      isGenuine: true,
      pughScore: adityaPugh.normalizedScore,
      pughResult: adityaPugh,
      evaluations: adityaEval,
      turnCount: 5,
      lastSeen: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      salesHandoverSent: true,
      salesHandoverDetails: {
        dispatchedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        assignedSpecialist: "Rajesh Sharma (Senior Property Specialist)",
        priority: "HIGH (Score: 92%)",
        recommendedAction: "Arrange Baner High Street project site inspection for Sunday"
      },
      chatHistory: [
        { role: "user", content: "Looking for 2 BHK in Baner Pune.", timestamp: "10:10 AM" },
        { role: "assistant", content: "Hello Aditya! Which price bracket and timeline do you prefer?", timestamp: "10:10 AM" },
        { role: "user", content: "₹1.2 Cr to ₹1.4 Cr, SBI loan pre-approved. Ready to move within 30-60 days.", timestamp: "10:12 AM" }
      ]
    };

    // 3. Delhi / NCR: Rajesh & Kavita Choudhary (Ultra Luxury 4 BHK - Gurgaon)
    const choudharyEval = {
      budget_readiness: {
        score: 2,
        quote: "Allocated budget ₹5.5 Cr to ₹7 Cr, liquid deployment",
        reasoning: "Liquid high-net-worth investor"
      },
      timeline_urgency: {
        score: 2,
        quote: "Ready to close this month",
        reasoning: "Immediate transaction"
      },
      requirement_clarity: {
        score: 2,
        quote: "4 BHK Luxury residence on Golf Course Road Gurgaon",
        reasoning: "Prestigious corridor preference"
      },
      decision_authority: {
        score: 2,
        quote: "Sole decision maker, funds in escrow",
        reasoning: "Single signer"
      },
      engagement_commitment: {
        score: 2,
        quote: "Schedule private preview this Friday",
        reasoning: "VIP preview scheduled"
      }
    };
    const choudharyPugh = evaluatePughMatrix(choudharyEval, 70);

    const lead3 = {
      id: "lead_del_103",
      phone: "+91 98110 44556",
      name: "Rajesh & Kavita Choudhary",
      city: "delhi_ncr",
      configuration: "4 BHK",
      source: "WhatsApp Meta Cloud API",
      status: "GENUINE_BUYER",
      isGenuine: true,
      pughScore: choudharyPugh.normalizedScore,
      pughResult: choudharyPugh,
      evaluations: choudharyEval,
      turnCount: 4,
      lastSeen: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      salesHandoverSent: true,
      salesHandoverDetails: {
        dispatchedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
        assignedSpecialist: "Rajesh Sharma (Senior Property Specialist)",
        priority: "VIP (Score: 100%)",
        recommendedAction: "Send Golf Course Road ultra-luxury brochure and host Friday preview"
      },
      chatHistory: [
        { role: "user", content: "Need 4 BHK on Golf Course Road Gurgaon. Budget ₹5.5 Cr to ₹7 Cr.", timestamp: "09:20 AM" },
        { role: "assistant", content: "Welcome Rajesh! When are you aiming to finalize possession?", timestamp: "09:21 AM" },
        { role: "user", content: "Ready to close this month, liquid funds ready.", timestamp: "09:22 AM" }
      ]
    };

    // 4. Bangalore: Karthik & Deepa Venkataraman (Nurture - Villa in Whitefield)
    const karthikEval = {
      budget_readiness: {
        score: 1,
        quote: "Looking around ₹3.5 Cr to ₹4.5 Cr, checking ICICI bank pre-approval",
        reasoning: "In-progress loan approval"
      },
      timeline_urgency: {
        score: 0,
        quote: "Planning possession within 6 to 9 months",
        reasoning: "Mid-term horizon"
      },
      requirement_clarity: {
        score: 1,
        quote: "Independent Villa in Whitefield ITPL corridor",
        reasoning: "Clear corridor, flexible layout"
      },
      decision_authority: {
        score: 0,
        quote: "Family discussing options",
        reasoning: "Joint consultation"
      },
      engagement_commitment: {
        score: 1,
        quote: "Send digital brochures first, might visit next month",
        reasoning: "Warm engagement"
      }
    };
    const karthikPugh = evaluatePughMatrix(karthikEval, 70);

    const lead4 = {
      id: "lead_blr_104",
      phone: "+91 98450 77889",
      name: "Karthik & Deepa Venkataraman",
      city: "bangalore",
      configuration: "Bungalow / Independent Villa",
      source: "WhatsApp Meta Cloud API",
      status: "NURTURE_LEAD",
      isGenuine: false,
      pughScore: karthikPugh.normalizedScore,
      pughResult: karthikPugh,
      evaluations: karthikEval,
      turnCount: 3,
      lastSeen: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      salesHandoverSent: false,
      salesHandoverDetails: null,
      chatHistory: [
        { role: "user", content: "Interested in villas in Whitefield Bangalore.", timestamp: "08:45 AM" },
        { role: "assistant", content: "Welcome Karthik! What is your planned timeline?", timestamp: "08:46 AM" },
        { role: "user", content: "Looking for delivery in 6 to 9 months. Budget around ₹3.5 Cr to ₹4.5 Cr.", timestamp: "08:47 AM" }
      ]
    };

    // 5. Mumbai: Arjun Kapoor (Casual Explorer / Window Shopper)
    const explorerEval = {
      budget_readiness: {
        score: -2,
        quote: "No budget right now, just dreaming and checking how expensive real estate is in Mumbai haha",
        reasoning: "Zero budget allocated, self-admitted curiosity browsing"
      },
      timeline_urgency: {
        score: -2,
        quote: "Not buying anytime soon, maybe in a couple years or after college",
        reasoning: "Indefinite timeline exceeding 24 months"
      },
      requirement_clarity: {
        score: -1,
        quote: "Just show me the biggest penthouses anywhere in Bandra or Borivali",
        reasoning: "Generic aspirational request without target parameters"
      },
      decision_authority: {
        score: -1,
        quote: "Just checking on my phone for fun",
        reasoning: "No purchasing intent or authority"
      },
      engagement_commitment: {
        score: -1,
        quote: "No don't call me, just send pictures on WhatsApp",
        reasoning: "Declined calls and site inspections"
      }
    };
    const explorerPugh = evaluatePughMatrix(explorerEval, 70);

    const lead5 = {
      id: "lead_mum_105",
      phone: "+91 97692 88412",
      name: "Arjun Kapoor",
      city: "mumbai",
      configuration: "4 BHK",
      source: "WhatsApp Meta Cloud API",
      status: "CASUAL_EXPLORER",
      isGenuine: false,
      pughScore: explorerPugh.normalizedScore,
      pughResult: explorerPugh,
      evaluations: explorerEval,
      turnCount: 4,
      lastSeen: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      salesHandoverSent: false,
      salesHandoverDetails: null,
      chatHistory: [
        { role: "user", content: "Hey can you tell me a funny joke about coding? Also what is the weather in Mumbai today?", timestamp: "10:44 AM" },
        { role: "assistant", content: "Haha! Why do programmers prefer dark mode? Because light attracts bugs! 🐛 The weather in Mumbai is sunny around 31°C today. Welcome to HavenCraft Realty! Are you exploring homes for living or investment?", timestamp: "10:45 AM" },
        { role: "user", content: "Just checking how expensive real estate is haha. Just show me the biggest penthouses anywhere in Mumbai.", timestamp: "10:46 AM" },
        { role: "assistant", content: "Penthouses in South Mumbai range upwards of ₹15–25 Crore. What is your comfortable budget bracket and purchase timeline?", timestamp: "10:47 AM" },
        { role: "user", content: "No budget right now, just dreaming, maybe in a couple years or after college. No don't call me, just send pictures on WhatsApp.", timestamp: "10:48 AM" }
      ]
    };

    this.leads.set(lead1.phone, lead1);
    this.leads.set(lead2.phone, lead2);
    this.leads.set(lead3.phone, lead3);
    this.leads.set(lead4.phone, lead4);
    this.leads.set(lead5.phone, lead5);

    // Populate Sales Dispatches
    [lead1, lead2, lead3].forEach((lead) => {
      this.salesDispatches.push({
        leadId: lead.id,
        leadName: lead.name,
        phone: lead.phone,
        pughScore: lead.pughScore,
        dispatchedAt: lead.salesHandoverDetails?.dispatchedAt || new Date().toISOString(),
        priority: lead.salesHandoverDetails?.priority || "HIGH",
        status: "SENT_TO_SALES",
        recommendedAction: lead.salesHandoverDetails?.recommendedAction
      });
    });
  }

  getLead(phone) {
    if (!this.leads.has(phone)) {
      const citizenName = formatIndianCitizenName("Prospective Buyer", phone);
      const newLead = {
        id: `lead_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        phone,
        name: citizenName,
        source: "WhatsApp Meta Cloud API",
        status: "NEW",
        isGenuine: false,
        pughScore: 50,
        pughResult: evaluatePughMatrix({}, 70),
        evaluations: {},
        turnCount: 0,
        lastSeen: new Date().toISOString(),
        salesHandoverSent: false,
        salesHandoverDetails: null,
        chatHistory: []
      };
      this.leads.set(phone, newLead);
    }
    const lead = this.leads.get(phone);
    lead.name = formatIndianCitizenName(lead.name, phone);
    return lead;
  }

  updateLead(phone, updates) {
    const lead = this.getLead(phone);
    if (updates.name) {
      updates.name = formatIndianCitizenName(updates.name, phone);
    }
    const updated = { ...lead, ...updates, lastSeen: new Date().toISOString() };
    this.leads.set(phone, updated);
    this.notifySubscribers({ type: "LEAD_UPDATED", lead: updated });
    return updated;
  }

  deleteLead(phoneQuery) {
    if (!phoneQuery) return false;
    const cleanQuery = String(phoneQuery).replace(/\D/g, "");
    let deletedCount = 0;

    for (const [phone, lead] of this.leads.entries()) {
      const cleanPhone = String(phone).replace(/\D/g, "");
      if (
        phone === phoneQuery ||
        cleanPhone === cleanQuery ||
        cleanPhone.endsWith(cleanQuery) ||
        cleanQuery.endsWith(cleanPhone)
      ) {
        this.leads.delete(phone);
        this.salesDispatches = this.salesDispatches.filter((d) => {
          const cleanD = String(d.phone || "").replace(/\D/g, "");
          return !cleanD.endsWith(cleanQuery) && !cleanQuery.endsWith(cleanD);
        });
        deletedCount++;
        this.notifySubscribers({ type: "LEAD_DELETED", phone, leadId: lead.id });
      }
    }

    return deletedCount > 0;
  }

  recordSalesHandover(phone, dispatchDetails) {
    const lead = this.getLead(phone);
    lead.salesHandoverSent = true;
    lead.salesHandoverDetails = dispatchDetails;
    this.leads.set(phone, lead);

    const dispatchRecord = {
      leadId: lead.id,
      leadName: lead.name,
      phone: lead.phone,
      pughScore: lead.pughScore,
      dispatchedAt: dispatchDetails.dispatchedAt || new Date().toISOString(),
      priority: dispatchDetails.priority || "HIGH",
      status: "SENT_TO_SALES",
      recommendedAction: dispatchDetails.recommendedAction
    };

    this.salesDispatches.unshift(dispatchRecord);
    this.notifySubscribers({
      type: "SALES_HANDOVER_ALERT",
      dispatch: dispatchRecord,
      lead
    });
    return dispatchRecord;
  }

  getAllLeads() {
    // Ensure all leads adhere to authentic Indian citizen naming standards
    for (const [phone, lead] of this.leads.entries()) {
      lead.name = formatIndianCitizenName(lead.name, phone);
    }
    return Array.from(this.leads.values()).sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
  }

  getSalesDispatches() {
    return this.salesDispatches.map((d) => ({
      ...d,
      leadName: formatIndianCitizenName(d.leadName, d.phone)
    }));
  }

  getStats() {
    const all = Array.from(this.leads.values());
    const totalLeads = all.length;
    const genuineBuyers = all.filter((l) => l.pughScore >= 70).length;
    const casualExplorers = all.filter((l) => l.pughScore < 45).length;
    const nurtureLeads = all.filter((l) => l.pughScore >= 45 && l.pughScore < 70).length;
    const salesDispatched = all.filter((l) => l.salesHandoverSent).length;
    const avgScore = totalLeads > 0 ? Math.round(all.reduce((acc, l) => acc + (l.pughScore || 0), 0) / totalLeads) : 0;

    return {
      totalLeads,
      genuineBuyers,
      casualExplorers,
      nurtureLeads,
      salesDispatched,
      avgScore
    };
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(event) {
    for (const cb of this.subscribers) {
      try {
        cb(event);
      } catch (err) {
        console.error("Subscriber notification error:", err);
      }
    }
  }
}

export const leadStore = new LeadStore();
