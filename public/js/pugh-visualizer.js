/**
 * Pugh Matrix Visualizer Component
 * Renders radial score gauges, criteria comparison cards, and inspection modal.
 */

export function renderPughGauge(score, weightedDelta, containerEl) {
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

export function openPughModal(lead, dialogEl) {
  if (!lead || !dialogEl) return;

  const pugh = lead.pughResult || {};
  const breakdown = pugh.breakdown || [];
  const evaluations = lead.evaluations || {};

  const gaugeContainer = dialogEl.querySelector("#dialogGaugeContainer");
  const heroInfo = dialogEl.querySelector("#dialogHeroInfo");
  const criteriaContainer = dialogEl.querySelector("#dialogCriteriaList");
  const leadTitle = dialogEl.querySelector("#dialogLeadTitle");

  leadTitle.innerHTML = `
    <span>Pugh Matrix Evaluation: <strong>${lead.name}</strong></span>
    <span class="badge ${lead.isGenuine ? "badge-genuine" : lead.pughScore >= 45 ? "badge-nurture" : "badge-explorer"}">
      ${pugh.verdictLabel || "Lead"}
    </span>
  `;

  // Render Gauge
  renderPughGauge(lead.pughScore, pugh.weightedDelta || 0, gaugeContainer);

  // Render Hero Info
  heroInfo.innerHTML = `
    <h3>${pugh.verdictLabel || "Lead Classification"}</h3>
    <p>
      <strong>Decision Threshold:</strong> 70% Cutoff | 
      <strong>Current Match:</strong> ${lead.pughScore}% (${lead.isGenuine ? "Surpasses" : "Below"} Threshold)
    </p>
    <p>
      <strong>Recommended Action:</strong> ${pugh.actionRequired || "Evaluate lead responses"}
    </p>
    <div style="display: flex; gap: 8px; margin-top: 10px;">
      <button class="btn btn-emerald btn-sm" id="btnModalSalesDispatch" data-phone="${encodeURIComponent(lead.phone)}">
        🚀 ${lead.salesHandoverSent ? "Re-send to Sales Team" : "Dispatch to Sales Team"}
      </button>
      <a href="https://wa.me/${lead.phone.replace(/[^\d]/g, "")}" target="_blank" class="btn btn-secondary btn-sm">
        💬 Open in WhatsApp Web
      </a>
    </div>
  `;

  // Render Breakdown Cards
  criteriaContainer.innerHTML = breakdown
    .map((item) => {
      let badgeClass = "crit-score-zero";
      if (item.rawScore > 0) badgeClass = "crit-score-pos";
      if (item.rawScore < 0) badgeClass = "crit-score-neg";

      return `
      <div class="criterion-card">
        <div class="crit-header">
          <span class="crit-title">
            ${item.name}
            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 400;">(Weight: ${item.weightPercent})</span>
          </span>
          <span class="crit-score-badge ${badgeClass}">
            ${item.scoreSymbol}
          </span>
        </div>
        <div class="crit-baseline">
          <strong>Baseline (0):</strong> ${item.baseline}
        </div>
        ${
          item.quote && item.quote !== "N/A"
            ? `<div class="crit-quote">"${item.quote}"</div>`
            : ""
        }
        <div class="crit-reasoning">
          <strong>Evaluation:</strong> ${item.reasoning}
        </div>
      </div>
    `;
    })
    .join("");

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
          dispatchBtn.innerText = "✅ Sent to Sales!";
          setTimeout(() => {
            dispatchBtn.disabled = false;
            dispatchBtn.innerText = "🚀 Dispatched to Sales";
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
