/**
 * Pugh Matrix Lead Qualification Engine for Real Estate Chatbots
 * 
 * Implements the multi-criteria Pugh Decision Matrix method:
 * Evaluates candidate leads against a Baseline Datum (Score = 0)
 * across 5 weighted property purchasing dimensions.
 */

export const PUGH_CRITERIA = {
  budget_readiness: {
    id: "budget_readiness",
    name: "Budget Realism & Financial Readiness",
    weight: 0.25,
    baseline: "Rough budget in mind, loan pre-approval not yet completed",
    scale: {
      "+2": "Pre-approved mortgage letter OR liquid all-cash ready in bank; budget aligns with target market",
      "+1": "Clear budget range with high confidence in financing eligibility",
      "0": "Baseline: Rough budget stated, financing options still under evaluation",
      "-1": "Unrealistic budget for desired configuration, unsure of funding or eligibility",
      "-2": "Zero budget clarity, expects impossible pricing, or explicitly can't afford"
    }
  },
  timeline_urgency: {
    id: "timeline_urgency",
    name: "Purchase Timeline & Urgency",
    weight: 0.25,
    baseline: "Looking to buy within 3 to 6 months",
    scale: {
      "+2": "Immediate / Under 30-60 days (current lease ending, funds deployed, relocation)",
      "+1": "Within 60-90 days (active search phase)",
      "0": "Baseline: 3 to 6 months timeline",
      "-1": "6 to 12 months out (early exploratory research)",
      "-2": "More than 12-24 months or indefinite window shopping"
    }
  },
  requirement_clarity: {
    id: "requirement_clarity",
    name: "Requirement Specificity & Location Clarity",
    weight: 0.20,
    baseline: "General city area and unit type (e.g., 2 or 3 BHK)",
    scale: {
      "+2": "Precise micro-market/community, exact unit configuration, clear purpose (end-use vs ROI)",
      "+1": "Clear preferred localities and definite property preferences",
      "0": "Baseline: Broad city area with standard configuration preference",
      "-1": "Vague or open-ended requirements ('show me anything anywhere')",
      "-2": "Self-contradictory or whimsical expectations"
    }
  },
  decision_authority: {
    id: "decision_authority",
    name: "Decision-Making Authority",
    weight: 0.15,
    baseline: "Joint decision maker (consulting spouse/family)",
    scale: {
      "+2": "Primary/Sole decision maker ready to sign reservation/LOI",
      "+1": "Key decision maker with co-buyer actively involved in evaluations",
      "0": "Baseline: Family consensus required",
      "-1": "Inquiring casually on behalf of an acquaintance without their mandate",
      "-2": "No decision authority, student project, or unauthorized third-party"
    }
  },
  engagement_commitment: {
    id: "engagement_commitment",
    name: "Engagement & Site Visit Commitment",
    weight: 0.15,
    baseline: "Willing to receive digital brochure/pricing on WhatsApp",
    scale: {
      "+2": "Eagerly agrees to in-person or virtual VIP site tour this week/weekend; confirms contact details",
      "+1": "Receptive to scheduling a consultation with a portfolio specialist",
      "0": "Baseline: Accepts digital catalog via WhatsApp",
      "-1": "Evasive, hesitates to commit to follow-up or provide details",
      "-2": "Explicitly refuses calls or visits, abrupt one-word replies"
    }
  }
};

/**
 * Computes the Pugh Matrix scorecard, weighted delta, and normalized percentage.
 * 
 * @param {Object} evaluations - Map of criterion id -> { score: -2..2, quote: string, reasoning: string }
 * @param {number} threshold - Qualification threshold percentage (default 70)
 * @returns {Object} Full scorecard and verdict
 */
export function evaluatePughMatrix(evaluations = {}, threshold = 70) {
  let weightedDelta = 0;
  let totalWeightsUsed = 0;
  const breakdown = [];

  for (const [key, criterion] of Object.entries(PUGH_CRITERIA)) {
    const evalData = evaluations[key] || {
      score: 0,
      quote: "Not yet fully determined in conversation",
      reasoning: "Assumed neutral baseline datum"
    };

    // Clamp score between -2 and +2
    const score = Math.max(-2, Math.min(2, Number(evalData.score) || 0));
    const weightedScore = score * criterion.weight;
    
    weightedDelta += weightedScore;
    totalWeightsUsed += criterion.weight;

    breakdown.push({
      id: key,
      name: criterion.name,
      weight: criterion.weight,
      weightPercent: `${Math.round(criterion.weight * 100)}%`,
      rawScore: score,
      scoreSymbol: score > 0 ? `+${score}` : `${score}`,
      weightedScore: Number(weightedScore.toFixed(3)),
      baseline: criterion.baseline,
      benchmarkDescription: criterion.scale[`${score > 0 ? "+" : ""}${score}`] || "Baseline",
      quote: evalData.quote || "N/A",
      reasoning: evalData.reasoning || "Pending conversation response"
    });
  }

  // Normalized score: [-2, +2] -> [0, 100%]
  // Score = ((Delta + 2) / 4) * 100
  const normalizedScore = Math.round(((weightedDelta + 2) / 4) * 100);

  // Verdict determination:
  // Genuine Buyer: score >= threshold (default 70%)
  // Warm / Nurture: score between 45% and 69%
  // Casual Explorer: score < 45%
  let classification = "CASUAL_EXPLORER";
  let verdictLabel = "Casual Explorer (Window Shopper)";
  let isGenuine = false;
  let actionRequired = "Keep in automated drip catalog / Soft nurture";
  let colorBadge = "slate";

  if (normalizedScore >= threshold) {
    classification = "GENUINE_BUYER";
    verdictLabel = "Genuine High-Intent Buyer";
    isGenuine = true;
    actionRequired = "🚨 Urgent Handover: Connect with Senior Sales Specialist";
    colorBadge = "emerald";
  } else if (normalizedScore >= 45) {
    classification = "NURTURE_LEAD";
    verdictLabel = "Nurture Prospect (Warm)";
    isGenuine = false;
    actionRequired = "Share curated digital brochure & follow up in 14 days";
    colorBadge = "amber";
  }

  return {
    normalizedScore,
    weightedDelta: Number(weightedDelta.toFixed(2)),
    threshold,
    classification,
    verdictLabel,
    isGenuine,
    actionRequired,
    colorBadge,
    breakdown,
    evaluatedAt: new Date().toISOString()
  };
}
