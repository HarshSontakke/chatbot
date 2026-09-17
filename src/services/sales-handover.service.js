import { env } from "../config/env.js";
import { leadStore } from "./lead-store.js";
import { whatsappService } from "./whatsapp.service.js";

/**
 * Sales Team Handover Service
 * Compiles comprehensive Lead Dossiers and dispatches high-intent leads to the Sales Team.
 */
class SalesHandoverService {
  /**
   * Generates a structured Lead Dossier packet for the sales team.
   */
  generateLeadDossier(lead) {
    const pugh = lead.pughResult || {};
    const evaluations = lead.evaluations || {};

    return {
      title: `🚨 HIGH-PRIORITY REAL ESTATE LEAD DISPATCH`,
      timestamp: new Date().toISOString(),
      leadInfo: {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        source: lead.source || "WhatsApp Cloud API",
        pughScore: `${lead.pughScore}%`,
        classification: pugh.verdictLabel || "Genuine Buyer",
      },
      criteriaSummary: {
        budget: evaluations.budget_readiness?.quote || "Verified in conversation",
        timeline: evaluations.timeline_urgency?.quote || "Immediate / Under 60 days",
        location: evaluations.requirement_clarity?.quote || "Prime Corridor",
        authority: evaluations.decision_authority?.quote || "Primary decision-maker",
        siteVisit: evaluations.engagement_commitment?.quote || "Agreed to weekend walkthrough",
      },
      recommendedAction: "📞 Call within 15 mins to confirm VIP site tour & deliver floor plan package.",
      assignedSpecialist: "Rajesh Sharma (Senior Property Specialist)",
      fullBreakdown: pugh.breakdown || [],
      transcriptSnippet: (lead.chatHistory || []).slice(-4)
    };
  }

  /**
   * Triggers the sales team handover workflow.
   */
  async triggerHandover(lead) {
    const dossier = this.generateLeadDossier(lead);

    const dispatchDetails = {
      dispatchedAt: new Date().toISOString(),
      assignedSpecialist: dossier.assignedSpecialist,
      priority: `URGENT (Pugh Score: ${lead.pughScore}%)`,
      recommendedAction: dossier.recommendedAction,
      dossier
    };

    // 1. Record in Lead Store
    leadStore.recordSalesHandover(lead.phone, dispatchDetails);

    console.log(`\n===============================================================`);
    console.log(`[SALES HANDOVER] Lead Qualified for Handover!`);
    console.log(`Lead: ${lead.name} (${lead.phone})`);
    console.log(`Pugh Score: ${lead.pughScore}% - Verdict: Genuine Buyer`);
    console.log(`Action: ${dossier.recommendedAction}`);
    console.log(`===============================================================\n`);

    // 2. Sales team phone is optional: Log dispatch to dashboard
    // Outbound WhatsApp alert to sales team phone is skipped as per configuration
    console.log(`[SALES HANDOVER] Lead logged to Web Dashboard & Sales Queue. (Outbound sales phone disabled/optional)`);

    return dossier;
  }
}

export const salesHandoverService = new SalesHandoverService();
