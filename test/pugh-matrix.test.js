import { evaluatePughMatrix, PUGH_CRITERIA } from "../src/engine/pugh-matrix.js";

console.log("=================================================================");
console.log("🧪 RUNNING PUGH MATRIX QUALIFICATION ENGINE TESTS");
console.log("=================================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

// 1. Test Baseline Datum (all zeros)
const baselineResult = evaluatePughMatrix({}, 70);
assert(baselineResult.normalizedScore === 50, "Baseline datum produces exactly 50% normalized score");
assert(baselineResult.weightedDelta === 0, "Baseline datum produces 0 weighted delta");
assert(baselineResult.classification === "NURTURE_LEAD", "Baseline lead defaults to NURTURE_LEAD");
assert(baselineResult.isGenuine === false, "Baseline lead is not genuine buyer");

// 2. Test High-Intent Genuine Buyer (+2 on all criteria)
const genuineBuyerEval = {
  budget_readiness: { score: 2 },
  timeline_urgency: { score: 2 },
  requirement_clarity: { score: 2 },
  decision_authority: { score: 2 },
  engagement_commitment: { score: 2 }
};
const genuineResult = evaluatePughMatrix(genuineBuyerEval, 70);
assert(genuineResult.normalizedScore === 100, "Maximum criteria scores produce 100% normalized score");
assert(genuineResult.weightedDelta === 2, "Maximum criteria produce +2.0 weighted delta");
assert(genuineResult.classification === "GENUINE_BUYER", "Score >= 70% classifies as GENUINE_BUYER");
assert(genuineResult.isGenuine === true, "isGenuine flag is true for genuine buyer");

// 3. Test Casual Explorer / Window Shopper (-2 on all criteria)
const explorerEval = {
  budget_readiness: { score: -2 },
  timeline_urgency: { score: -2 },
  requirement_clarity: { score: -2 },
  decision_authority: { score: -2 },
  engagement_commitment: { score: -2 }
};
const explorerResult = evaluatePughMatrix(explorerEval, 70);
assert(explorerResult.normalizedScore === 0, "Minimum criteria scores produce 0% normalized score");
assert(explorerResult.weightedDelta === -2, "Minimum criteria produce -2.0 weighted delta");
assert(explorerResult.classification === "CASUAL_EXPLORER", "Score < 45% classifies as CASUAL_EXPLORER");
assert(explorerResult.isGenuine === false, "isGenuine flag is false for casual explorer");

// 4. Test Realistic Mixed Case (Genuine threshold boundary)
// Budget: +2 (25%), Timeline: +2 (25%), Requirement: +1 (20%), Authority: 0 (15%), Engagement: +1 (15%)
// Delta: 2*0.25 + 2*0.25 + 1*0.20 + 0*0.15 + 1*0.15 = 0.50 + 0.50 + 0.20 + 0.00 + 0.15 = 1.35
// Score: ((1.35 + 2)/4) * 100 = (3.35/4)*100 = 83.75 -> 84%
const mixedEval = {
  budget_readiness: { score: 2 },
  timeline_urgency: { score: 2 },
  requirement_clarity: { score: 1 },
  decision_authority: { score: 0 },
  engagement_commitment: { score: 1 }
};
const mixedResult = evaluatePughMatrix(mixedEval, 70);
assert(mixedResult.normalizedScore === 84, "Realistic mixed high-intent buyer scores 84%");
assert(mixedResult.isGenuine === true, "Mixed high-intent buyer is genuine");

console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed`);
if (failed > 0) process.exit(1);
