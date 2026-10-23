/**
 * Pugh Matrix Visualizer Component
 * Renders radial score gauges, criteria comparison cards, conversation question mapping,
 * external question audits, and interactive multi-tab inspection modal.
 */

const CRITERIA_QUESTIONS = {
  budget_readiness: "Which configuration and budget bracket suits your family best?",
  timeline_urgency: "How soon are you planning to take possession and close the purchase?",
  requirement_clarity: "Which major city and unit configuration fits your lifestyle?",
  decision_authority: "Who will be the primary signers and decision makers on the purchase deed?",
  engagement_commitment: "Would you like to schedule an exclusive VIP site visit or tour this week?"
};

export function renderPughGauge(score, weightedDelta, containerEl) {
  if (!containerEl) return;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score || 0));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  let strokeColor = "#64748b";
  if (clampedScore >= 70) {
    strokeColor = "#10b981"; // Emerald for Genuine
  } else if (clampedScore >= 45) {
    strokeColor = "#f59e0b"; // Amber for Nurture
  }

  containerEl.innerHTML = `
    <div class="pugh-radial-gauge">
      <svg class="gauge-svg" viewBox="0 0 140 140">
        <circle class="gauge-track" cx="70" cy="70" r="${radius}" />
        <circle class="gauge-fill" cx="70" cy="70" r="${radius}" 
          style="stroke: ${strokeColor}; stroke-dasharray: ${circumference}; stroke-dashoffset: ${strokeDashoffset};" />
      </svg>
      <div class="gauge-center-text">
        <div class="gauge-score-number" style="color: ${strokeColor}">${clampedScore}%</div>
        <div class="gauge-delta-number">Δ ${weightedDelta >= 0 ? "+" : ""}${weightedDelta}</div>
      </div>
    </div>
  `;
}

/**
 * Maps message text to Pugh Matrix criteria or off-topic classification
 */
function analyzeMessageSignals(content, evaluations = {}) {
  const lower = (content || "").toLowerCase().trim();
  const signals = [];

  // Check if matches specific extracted quotes
  if (evaluations.budget_readiness?.quote && content.includes(evaluations.budget_readiness.quote.slice(0, 30))) {
    signals.push({
      type: "budget",
      label: `💰 Budget Signal (${evaluations.budget_readiness.score >= 0 ? "+" : ""}${evaluations.budget_readiness.score})`,
      note: evaluations.budget_readiness.reasoning
    });
  } else if (/\$?\d+[\d,]*\s*(k|m|million|thousand|cr|crore|lakh)/i.test(lower) || lower.includes("pre-approved") || lower.includes("budget")) {
    signals.push({
      type: "budget",
      label: "💰 Financial Readiness",
      note: "Detected pricing, budget bracket, or loan financing intent."
    });
  }

  if (evaluations.timeline_urgency?.quote && content.includes(evaluations.timeline_urgency.quote.slice(0, 30))) {
    signals.push({
      type: "timeline",
      label: `⏱️ Timeline Urgency (${evaluations.timeline_urgency.score >= 0 ? "+" : ""}${evaluations.timeline_urgency.score})`,
      note: evaluations.timeline_urgency.reasoning
    });
  } else if (lower.includes("immediate") || lower.includes("30-60") || lower.includes("ready to move") || lower.includes("within")) {
    signals.push({
      type: "timeline",
      label: "⏱️ Purchase Timeline",
      note: "Detected moving horizon or urgency."
    });
  }

  if (evaluations.requirement_clarity?.quote && content.includes(evaluations.requirement_clarity.quote.slice(0, 30))) {
    signals.push({
      type: "requirement",
      label: `📍 Requirement Clarity (${evaluations.requirement_clarity.score >= 0 ? "+" : ""}${evaluations.requirement_clarity.score})`,
      note: evaluations.requirement_clarity.reasoning
    });
  } else if (lower.includes("mumbai") || lower.includes("pune") || lower.includes("bangalore") || lower.includes("delhi") || lower.includes("bhk") || lower.includes("villa")) {
    signals.push({
      type: "requirement",
      label: "📍 Location / Configuration",
      note: "Detected metro market, locality corridor, or unit configuration."
    });
  }

  if (evaluations.decision_authority?.quote && content.includes(evaluations.decision_authority.quote.slice(0, 30))) {
    signals.push({
      type: "authority",
      label: `🤝 Decision Authority (${evaluations.decision_authority.score >= 0 ? "+" : ""}${evaluations.decision_authority.score})`,
      note: evaluations.decision_authority.reasoning
    });
  }

  if (evaluations.engagement_commitment?.quote && content.includes(evaluations.engagement_commitment.quote.slice(0, 30))) {
    signals.push({
      type: "engagement",
      label: `⭐ Site Visit Commitment (${evaluations.engagement_commitment.score >= 0 ? "+" : ""}${evaluations.engagement_commitment.score})`,
      note: evaluations.engagement_commitment.reasoning
    });
  }

  // Detect off-topic or external queries asked by user
  if (
    lower.includes("weather") || lower.includes("rain") || lower.includes("joke") ||
    lower.includes("who are you") || lower.includes("what is your name") || lower.includes("how are you") ||
    lower.includes("traffic") || lower.includes("coding") || lower.includes("pizza") || lower.includes("car") ||
    (lower.includes("?") && (lower.includes("metro") || lower.includes("school") || lower.includes("highway") || lower.includes("today")))
  ) {
    signals.push({
      type: "offtopic",
      label: "❓ External / Off-Topic Query",
      note: "Neutral turn: Answered courteously by AI bot, scored at baseline (0 delta). Genuine buyer score unaffected."
    });
  }

  return signals;
}

/**
 * Extracts external or off-topic questions asked by the user from chatHistory
 */
function extractExternalQuestions(chatHistory = []) {
  const list = [];
  chatHistory.forEach((msg, idx) => {
    if (msg.role === "user") {
      const content = (msg.content || msg.text || "").trim();
      const lower = content.toLowerCase();
      const isExt =
        lower.includes("weather") || lower.includes("rain") || lower.includes("joke") ||
        lower.includes("traffic") || lower.includes("coding") || lower.includes("who are you") ||
        lower.includes("pizza") || lower.includes("car") ||
        (lower.includes("?") && (lower.includes("metro") || lower.includes("weather") || lower.includes("today") || lower.includes("joke") || lower.includes("traffic")));

      if (isExt) {
        const nextMsg = chatHistory[idx + 1];
        const answer = (nextMsg && nextMsg.role === "assistant") ? (nextMsg.content || nextMsg.text || "") : "Answered politely by AI advisor.";
        list.push({
          turnNum: idx + 1,
          timestamp: msg.timestamp || `#${idx + 1}`,
          question: content,
          answer: answer.length > 180 ? answer.slice(0, 180) + "..." : answer
        });
      }
    }
  });
  return list;
}

export function openPughModal(lead, dialogEl) {
  if (!lead || !dialogEl) return;

  const pugh = lead.pughResult || {};
  const breakdown = pugh.breakdown || [];
  const evaluations = lead.evaluations || {};
  const chatHistory = lead.chatHistory || [];

  const gaugeContainer = dialogEl.querySelector("#dialogGaugeContainer");
  const heroInfo = dialogEl.querySelector("#dialogHeroInfo");
  const criteriaContainer = dialogEl.querySelector("#dialogCriteriaList");
  const transcriptFeed = dialogEl.querySelector("#dialogTranscriptFeed");
  const leadTitle = dialogEl.querySelector("#dialogLeadTitle");
  const modalMsgCount = dialogEl.querySelector("#modalMsgCount");
  const calcNote = dialogEl.querySelector("#dialogCalcNote");
  const inquiryAudit = dialogEl.querySelector("#dialogInquiryAudit");
  const externalPolicyCard = dialogEl.querySelector("#dialogExternalPolicyCard");
  const externalQuestionsBox = dialogEl.querySelector("#dialogExternalQuestionsBox");

  // Tab Elements
  const tabCriteria = dialogEl.querySelector("#modalTabCriteria");
  const tabHistory = dialogEl.querySelector("#modalTabHistory");
  const panelCriteria = dialogEl.querySelector("#dialogPanelCriteria");
  const panelHistory = dialogEl.querySelector("#dialogPanelHistory");

  if (modalMsgCount) {
    modalMsgCount.innerText = chatHistory.length;
  }

  // Tab Switching Handlers
  if (tabCriteria && tabHistory && panelCriteria && panelHistory) {
    tabCriteria.onclick = () => {
      tabCriteria.classList.add("active");
      tabHistory.classList.remove("active");
      panelCriteria.style.display = "block";
      panelHistory.style.display = "none";
    };

    tabHistory.onclick = () => {
      tabHistory.classList.add("active");
      tabCriteria.classList.remove("active");
      panelHistory.style.display = "block";
      panelCriteria.style.display = "none";
    };
  }

  // Header Title
  if (leadTitle) {
    leadTitle.innerHTML = `
      <span>Pugh Matrix Evaluation: <strong>${lead.name}</strong></span>
      <span class="badge ${lead.isGenuine ? "badge-genuine" : lead.pughScore >= 45 ? "badge-nurture" : "badge-explorer"}">
        ${pugh.verdictLabel || "Lead"}
      </span>
    `;
  }

  // Render Gauge
  renderPughGauge(lead.pughScore, pugh.weightedDelta || 0, gaugeContainer);

  // Extract external questions
  const externalQuestions = extractExternalQuestions(chatHistory);
  const botQuestionsCount = chatHistory.filter((m) => m.role === "assistant").length;
  const userAnswersCount = chatHistory.filter((m) => m.role === "user").length;

  // Render Hero Info
  if (heroInfo) {
    heroInfo.innerHTML = `
      <h3>${pugh.verdictLabel || "Lead Classification"}</h3>
      <p>
        <strong>Evaluation Scope:</strong> Scored across <strong>${chatHistory.length} messages</strong> (${lead.turnCount || userAnswersCount} user turns)
      </p>
      <p>
        <strong>Pugh Calculation:</strong> Weighted Delta <strong>Δ ${pugh.weightedDelta >= 0 ? "+" : ""}${pugh.weightedDelta || 0}</strong> → Normalized <strong>${lead.pughScore}%</strong> Match
      </p>
      <p>
        <strong>Recommended Action:</strong> ${pugh.actionRequired || "Review dialogue responses"}
      </p>
      <div style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
        <button class="btn btn-primary btn-sm" id="btnModalSalesDispatch" data-phone="${encodeURIComponent(lead.phone)}">
          ${lead.salesHandoverSent ? "Re-send to Sales Team" : "Dispatch to Sales Team"}
        </button>
        <a href="https://wa.me/${lead.phone.replace(/[^\d]/g, "")}" target="_blank" class="btn btn-secondary btn-sm">
          Open in WhatsApp Web
        </a>
      </div>
    `;
  }

  // Render Inquiry Audit Strip
  if (inquiryAudit) {
    inquiryAudit.innerHTML = `
      <div class="inquiry-audit-grid">
        <div class="inquiry-stat-card">
          <div class="inquiry-stat-icon icon-bot">🤖</div>
          <div class="inquiry-stat-text">
            <div class="inquiry-stat-val">${botQuestionsCount} Bot Inquiries</div>
            <div class="inquiry-stat-lbl">Qualification Questions Posed</div>
          </div>
        </div>

        <div class="inquiry-stat-card">
          <div class="inquiry-stat-icon ${externalQuestions.length > 0 ? "icon-ext" : "icon-clean"}">
            ${externalQuestions.length > 0 ? "❓" : "✅"}
          </div>
          <div class="inquiry-stat-text">
            <div class="inquiry-stat-val">${externalQuestions.length} External Inquir${externalQuestions.length === 1 ? "y" : "ies"}</div>
            <div class="inquiry-stat-lbl">${externalQuestions.length > 0 ? "Scored Neutrally (0 Delta Penalty)" : "100% Focused on Real Estate"}</div>
          </div>
        </div>

        <div class="inquiry-stat-card">
          <div class="inquiry-stat-icon icon-score">🎯</div>
          <div class="inquiry-stat-text">
            <div class="inquiry-stat-val">${lead.pughScore}% Match</div>
            <div class="inquiry-stat-lbl">Weighted Δ ${pugh.weightedDelta >= 0 ? "+" : ""}${pugh.weightedDelta || 0} vs Datum</div>
          </div>
        </div>
      </div>
    `;
  }

  if (calcNote) {
    calcNote.innerText = `Normalized Score = ((Weighted Delta Δ ${pugh.weightedDelta >= 0 ? "+" : ""}${pugh.weightedDelta} + 2) / 4) × 100% = ${lead.pughScore}%`;
  }

  // Render Criteria Breakdown Cards (Tab 1)
  if (criteriaContainer) {
    criteriaContainer.innerHTML = breakdown
      .map((item) => {
        let badgeClass = "crit-score-zero";
        if (item.rawScore > 0) badgeClass = "crit-score-pos";
        if (item.rawScore < 0) badgeClass = "crit-score-neg";

        const hasQuote = item.quote && item.quote !== "N/A" && item.quote !== "Not yet fully determined in conversation";
        const botQuestion = CRITERIA_QUESTIONS[item.key] || "Targeted property buying question";

        return `
        <div class="criterion-card">
          <div class="crit-header">
            <span class="crit-title">
              ${item.name}
              <span style="font-size: 0.74rem; color: var(--text-muted); font-weight: 500;">(Weight: ${item.weightPercent} • Contribution: ${item.weightedScore >= 0 ? "+" : ""}${item.weightedScore})</span>
            </span>
            <span class="crit-score-badge ${badgeClass}">
              ${item.scoreSymbol}
            </span>
          </div>

          <!-- Bot Question Prompt -->
          <div class="crit-bot-prompt">
            <span class="crit-prompt-badge">🤖 Bot Question Asked:</span>
            <span class="crit-prompt-text">"${botQuestion}"</span>
          </div>

          <div class="crit-baseline">
            <strong>Baseline Datum (0):</strong> ${item.baseline}
          </div>

          ${
            hasQuote
              ? `<div class="crit-quote">
                  <strong>👤 Buyer's Extracted Answer:</strong> "${item.quote}"
                 </div>`
              : `<div class="crit-quote" style="color: var(--text-muted); font-style: normal;">
                  <em>No explicit signal in dialogue yet; evaluated at baseline (0).</em>
                 </div>`
          }

          <div class="crit-reasoning">
            <strong>Scoring Rationale:</strong> ${item.reasoning}
          </div>
        </div>
      `;
      })
      .join("");
  }

  // Render External Policy Card at bottom of Tab 1
  if (externalPolicyCard) {
    externalPolicyCard.innerHTML = `
      <div class="policy-card-wrap">
        <div class="policy-card-header">
          <span class="policy-card-icon">ℹ️</span>
          <strong>External Questions & Neutral Scoring Principle:</strong>
        </div>
        <p>
          When prospects ask external/out-of-topic questions (e.g. weather, jokes, traffic, or casual chit-chat), HavenCraft AI answers courteously before returning to property curation.
          Under the Pugh Matrix principle, external queries are assigned a <strong>baseline datum score (Δ 0.0)</strong> so they <strong>never penalize or reduce</strong> a buyer's legitimate financial or timeline qualification.
        </p>
        ${
          externalQuestions.length > 0
            ? `<div class="policy-ext-list">
                <strong>External Questions Detected in this Conversation (${externalQuestions.length}):</strong>
                <ul>
                  ${externalQuestions
                    .map(
                      (eq) => `
                    <li>
                      <strong>"${formatText(eq.question)}"</strong>
                      <span class="badge badge-neutral" style="font-size: 0.68rem; margin-left: 6px;">Neutral (0 Delta)</span>
                      <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">
                        <em>Bot Response: "${formatText(eq.answer)}"</em>
                      </div>
                    </li>
                  `
                    )
                    .join("")}
                </ul>
               </div>`
            : `<div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 4px;">
                <em>This lead did not ask external questions; 100% of the conversation was real-estate buying criteria.</em>
               </div>`
        }
      </div>
    `;
  }

  // Render Dedicated External Questions Box (Tab 2)
  if (externalQuestionsBox) {
    if (externalQuestions.length > 0) {
      externalQuestionsBox.innerHTML = `
        <div class="ext-highlight-banner">
          <div class="ext-banner-title">
            <span>❓ External / Out-of-Topic Questions Asked by User (${externalQuestions.length})</span>
            <span class="badge badge-neutral">Neutral Score (0 Delta)</span>
          </div>
          <div class="ext-banner-sub">
            The user asked the questions below during conversation. The bot courteously answered and guided back to property search. These turns did not lower the buyer's Pugh match score.
          </div>
          <div class="ext-qa-pairs">
            ${externalQuestions
              .map(
                (eq) => `
              <div class="ext-qa-item">
                <div class="ext-q"><strong>👤 User Question (Turn #${eq.turnNum}):</strong> "${formatText(eq.question)}"</div>
                <div class="ext-a"><strong>🏡 Bot Courtesy Answer:</strong> "${formatText(eq.answer)}"</div>
                <div class="ext-impact">⚖️ <strong>Score Impact:</strong> Neutral Datum (Δ 0.0) — Not penalized. Genuine real estate signals evaluated independently.</div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    } else {
      externalQuestionsBox.innerHTML = `
        <div class="ext-highlight-banner clean">
          <div class="ext-banner-title">
            <span>✅ No External Questions Asked</span>
          </div>
          <div class="ext-banner-sub">
            This prospect engaged directly with all real estate qualification prompts without off-topic queries.
          </div>
        </div>
      `;
    }
  }

  // Render Full Conversation Transcript (Tab 2)
  function renderTranscript(filterType = "all") {
    if (!transcriptFeed) return;
    if (chatHistory.length === 0) {
      transcriptFeed.innerHTML = `
        <div style="text-align: center; padding: 36px 16px; color: var(--text-muted); font-size: 0.85rem;">
          No conversation turns recorded for this lead yet.
        </div>
      `;
      return;
    }

    const filteredMessages = chatHistory.filter((msg) => {
      if (filterType === "all") return true;
      if (filterType === "bot") return msg.role === "assistant";
      if (filterType === "user-signals") {
        if (msg.role !== "user") return false;
        const msgText = msg.content || msg.text || "";
        const signals = analyzeMessageSignals(msgText, evaluations);
        return signals.some((s) => s.type !== "offtopic");
      }
      if (filterType === "external") {
        if (msg.role !== "user") return false;
        const msgText = msg.content || msg.text || "";
        const signals = analyzeMessageSignals(msgText, evaluations);
        return signals.some((s) => s.type === "offtopic");
      }
      return true;
    });

    if (filteredMessages.length === 0) {
      transcriptFeed.innerHTML = `
        <div style="text-align: center; padding: 24px 16px; color: var(--text-muted); font-size: 0.82rem;">
          No messages match the "${filterType}" filter.
        </div>
      `;
      return;
    }

    transcriptFeed.innerHTML = filteredMessages
      .map((msg, idx) => {
        const isUser = msg.role === "user";
        const msgText = msg.content || msg.text || "";
        const signals = isUser ? analyzeMessageSignals(msgText, evaluations) : [];
        const isExternal = signals.some((s) => s.type === "offtopic");

        let roleLabel = isUser ? `👤 ${lead.name || "Prospect"}` : "🏡 HavenCraft AI Advisor";
        let subTag = isUser
          ? isExternal
            ? '<span class="role-tag tag-ext">❓ External Question</span>'
            : '<span class="role-tag tag-signal">🏡 Buyer Answer</span>'
          : '<span class="role-tag tag-bot">🤖 Qualification Question</span>';

        return `
        <div class="transcript-msg-wrap ${isUser ? "msg-user" : "msg-assistant"}">
          <div class="transcript-sender-row">
            <span class="transcript-sender-name">${roleLabel}</span>
            ${subTag}
            <span class="transcript-time">${msg.timestamp || `#${idx + 1}`}</span>
          </div>
          
          <div class="transcript-bubble ${isUser ? (isExternal ? "bubble-user-ext" : "bubble-user") : "bubble-assistant"}">
            <div class="transcript-text">${formatText(msgText)}</div>
          </div>

          ${
            signals.length > 0
              ? `<div class="transcript-signals-row">
                  ${signals
                    .map(
                      (s) => `
                    <span class="transcript-signal-pill pill-${s.type}" title="${s.note}">
                      ${s.label}
                    </span>
                  `
                    )
                    .join("")}
                 </div>`
              : ""
          }
        </div>
      `;
      })
      .join("");
  }

  // Initial render of transcript
  renderTranscript("all");

  // Transcript Filter Chips Handler
  const filterContainer = dialogEl.querySelector("#transcriptFilterChips");
  if (filterContainer) {
    filterContainer.querySelectorAll(".t-filter-chip").forEach((chip) => {
      chip.onclick = () => {
        filterContainer.querySelectorAll(".t-filter-chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        const filterType = chip.getAttribute("data-tfilter") || "all";
        renderTranscript(filterType);
      };
    });
  }

  // Attach modal dispatch handler
  const dispatchBtn = dialogEl.querySelector("#btnModalSalesDispatch");
  if (dispatchBtn) {
    dispatchBtn.onclick = async () => {
      dispatchBtn.disabled = true;
      dispatchBtn.innerText = "Dispatching...";
      try {
        const res = await fetch(`/api/leads/${encodeURIComponent(lead.phone)}/handover`, { method: "POST" });
        const data = await res.json();
        if (data.success) {
          dispatchBtn.innerText = "Sent to Sales!";
          setTimeout(() => {
            dispatchBtn.disabled = false;
            dispatchBtn.innerText = "Dispatched to Sales";
          }, 2000);
        }
      } catch (err) {
        alert("Failed to dispatch: " + err.message);
        dispatchBtn.disabled = false;
        dispatchBtn.innerText = "Retry Dispatch";
      }
    };
  }

  // Show dialog modal
  if (typeof dialogEl.showModal === "function") {
    dialogEl.showModal();
  }
}

function formatText(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
}
