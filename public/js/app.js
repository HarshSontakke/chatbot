import { openPughModal } from "./pugh-visualizer.js";
import { WhatsAppSimulator } from "./simulator.js";

class DashboardApp {
  constructor() {
    this.leads = [];
    this.currentFilter = "ALL";
    this.searchQuery = "";
    this.dialogEl = document.getElementById("pughModalDialog");
    this.leadsTableBody = document.getElementById("leadsTableBody");
    this.toastContainer = document.getElementById("toastContainer");

    this.init();
  }

  async init() {
    this.simulator = new WhatsAppSimulator();
    this.setupEventListeners();
    this.setupSSE();
    await this.fetchLeads();
  }

  setupEventListeners() {
    // Search input
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.renderLeadsTable();
      });
    }

    // Theme Toggle Handler
    const themeBtn = document.getElementById("themeToggleBtn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
        const nextTheme = currentTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", nextTheme);
        try {
          localStorage.setItem("haven_theme", nextTheme);
        } catch (err) {}
        this.showToast(`Switched to <strong>${nextTheme === "dark" ? "Dark" : "Light"}</strong> theme.`);
      });
    }

    // System theme sync if user hasn't explicitly set a preference
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (!localStorage.getItem("haven_theme")) {
          document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
        }
      });
    }

    // Filter Tabs
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentFilter = btn.getAttribute("data-filter") || "ALL";
        this.renderLeadsTable();
      });
    });

    // Close Dialog button
    const closeBtn = document.getElementById("dialogCloseBtn");
    if (closeBtn && this.dialogEl) {
      closeBtn.addEventListener("click", () => this.dialogEl.close());
    }

    // Light dismiss for dialog (clicking on backdrop)
    if (this.dialogEl) {
      this.dialogEl.addEventListener("click", (e) => {
        const rect = this.dialogEl.getBoundingClientRect();
        const isInDialog =
          rect.top <= e.clientY &&
          e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX &&
          e.clientX <= rect.left + rect.width;
        if (!isInDialog) {
          this.dialogEl.close();
        }
      });
    }

    // Export Leads CSV
    const btnExport = document.getElementById("btnExportLeads");
    if (btnExport) {
      btnExport.addEventListener("click", () => this.exportLeadsCSV());
    }

    // Listen to Sales Handover Event from Simulator or Webhook
    window.addEventListener("sales-handover-alert", (e) => {
      const { lead } = e.detail;
      this.showToast(
        `🚨 <strong>URGENT SALES ALERT:</strong> Lead <strong>${lead.name}</strong> qualified with <strong>${lead.pughScore}%</strong> Pugh Score! Dispatched to Sales Specialist.`,
        "toast-sales"
      );
      this.fetchLeads();
    });
  }

  setupSSE() {
    const sse = new EventSource("/api/events");

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "LEAD_UPDATED") {
          this.upsertLeadInList(data.lead);
          this.updateKPIs();
          this.renderLeadsTable();
        } else if (data.type === "SALES_HANDOVER_ALERT") {
          this.upsertLeadInList(data.lead);
          this.updateKPIs();
          this.renderLeadsTable();
          this.showToast(
            `🚀 <strong>SALES HANDOVER DISPATCHED:</strong> ${data.lead.name} (${data.lead.phone}) is ready for VIP tour!`,
            "toast-sales"
          );
        } else if (data.type === "LEAD_DELETED") {
          const cleanQuery = String(data.phone || "").replace(/\D/g, "");
          this.leads = this.leads.filter((l) => {
            const clean = String(l.phone || "").replace(/\D/g, "");
            return clean !== cleanQuery && !clean.endsWith(cleanQuery) && !cleanQuery.endsWith(clean);
          });
          this.updateKPIs();
          this.renderLeadsTable();
        }
      } catch (err) {
        // Heartbeat or unparseable event
      }
    };

    sse.onerror = () => {
      console.warn("[SSE] Event stream disconnected, retrying in background...");
    };
  }

  async fetchLeads() {
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      if (data.success) {
        this.leads = data.leads || [];
        this.updateKPIs(data.stats);
        this.renderLeadsTable();
      }
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    }
  }

  upsertLeadInList(updatedLead) {
    const index = this.leads.findIndex((l) => l.phone === updatedLead.phone);
    if (index >= 0) {
      this.leads[index] = updatedLead;
    } else {
      this.leads.unshift(updatedLead);
    }
  }

  updateKPIs(stats) {
    if (!stats) {
      const total = this.leads.length;
      const genuine = this.leads.filter((l) => l.pughScore >= 70).length;
      const explorers = this.leads.filter((l) => l.pughScore < 45).length;
      const dispatched = this.leads.filter((l) => l.salesHandoverSent).length;
      const avg = total > 0 ? Math.round(this.leads.reduce((a, b) => a + (b.pughScore || 0), 0) / total) : 0;
      stats = { totalLeads: total, genuineBuyers: genuine, casualExplorers: explorers, salesDispatched: dispatched, avgScore: avg };
    }

    document.getElementById("kpiTotalLeads").innerText = stats.totalLeads;
    document.getElementById("kpiGenuine").innerText = stats.genuineBuyers;
    document.getElementById("kpiExplorers").innerText = stats.casualExplorers;
    document.getElementById("kpiAvgScore").innerText = `${stats.avgScore}%`;
    document.getElementById("kpiSales").innerText = stats.salesDispatched;
  }

  renderLeadsTable() {
    let filtered = this.leads;

    // Filter by Tab
    if (this.currentFilter === "GENUINE") {
      filtered = filtered.filter((l) => l.pughScore >= 70);
    } else if (this.currentFilter === "NURTURE") {
      filtered = filtered.filter((l) => l.pughScore >= 45 && l.pughScore < 70);
    } else if (this.currentFilter === "EXPLORER") {
      filtered = filtered.filter((l) => l.pughScore < 45);
    } else if (this.currentFilter === "DISPATCHED") {
      filtered = filtered.filter((l) => l.salesHandoverSent);
    }

    // Filter by Search Query
    if (this.searchQuery) {
      filtered = filtered.filter(
        (l) =>
          (l.name && l.name.toLowerCase().includes(this.searchQuery)) ||
          (l.phone && l.phone.includes(this.searchQuery)) ||
          (l.source && l.source.toLowerCase().includes(this.searchQuery))
      );
    }

    if (filtered.length === 0) {
      this.leadsTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 36px; color: var(--text-muted);">
            No leads found matching current criteria.
          </td>
        </tr>
      `;
      return;
    }

    this.leadsTableBody.innerHTML = filtered
      .map((lead) => {
        const score = lead.pughScore || 50;
        let badgeClass = "badge-nurture";
        let fillClass = "fill-nurture";
        let label = "Nurture Prospect";

        if (score >= 70) {
          badgeClass = "badge-genuine";
          fillClass = "fill-genuine";
          label = "Genuine Buyer";
        } else if (score < 45) {
          badgeClass = "badge-explorer";
          fillClass = "fill-explorer";
          label = "Casual Explorer";
        }

        const initials = (lead.name || "P")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        const evalObj = lead.evaluations || {};
        const keyQuotes = [
          evalObj.budget_readiness?.quote ? `Budget: ${evalObj.budget_readiness.quote.slice(0, 28)}...` : null,
          evalObj.timeline_urgency?.quote ? `Timeline: ${evalObj.timeline_urgency.quote.slice(0, 28)}...` : null
        ].filter(Boolean);

        return `
        <tr>
          <td>
            <div class="lead-profile-cell">
              <div class="lead-avatar">${initials}</div>
              <div>
                <div class="lead-name">
                  <span>${lead.name}</span>
                  ${lead.salesHandoverSent ? `<span class="badge badge-dispatched" style="font-size: 0.65rem; padding: 1px 6px;">Dispatched</span>` : ""}
                </div>
                <div class="lead-phone">${lead.phone} • ${lead.source || "WhatsApp"}</div>
              </div>
            </div>
          </td>
          <td>
            <div class="pugh-meter-cell">
              <div class="pugh-meter-header">
                <span style="color: var(--text-muted);">Match</span>
                <span class="pugh-score-val">${score}%</span>
              </div>
              <div class="pugh-progress-track">
                <div class="pugh-progress-fill ${fillClass}" style="width: ${score}%;"></div>
              </div>
            </div>
          </td>
          <td>
            <span class="badge ${badgeClass}">${label}</span>
          </td>
          <td>
            <div class="criteria-pill-list">
              ${
                keyQuotes.length > 0
                  ? keyQuotes.map((q) => `<span class="criterion-tag" title="${q}">${q}</span>`).join("")
                  : `<span class="criterion-tag" style="color: var(--text-muted);">Assessing criteria...</span>`
              }
            </div>
          </td>
          <td>
            ${
              lead.salesHandoverSent
                ? `<span class="badge badge-dispatched">Sent to Sales</span>`
                : score >= 70
                ? `<button class="btn btn-primary btn-sm btn-action-dispatch" data-phone="${encodeURIComponent(lead.phone)}">
                    Dispatch
                   </button>`
                : `<span style="font-size: 0.74rem; color: var(--text-muted);">In Qualification</span>`
            }
          </td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 6px; align-items: center; justify-content: flex-end;">
              <button class="btn btn-secondary btn-sm btn-inspect-pugh" data-phone="${encodeURIComponent(lead.phone)}">
                Inspect
              </button>
              <button class="btn btn-danger btn-sm btn-delete-lead" data-phone="${encodeURIComponent(lead.phone)}" title="Delete Lead">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
      })
      .join("");

    // Attach inspect click handlers
    this.leadsTableBody.querySelectorAll(".btn-inspect-pugh").forEach((btn) => {
      btn.addEventListener("click", () => {
        const phone = decodeURIComponent(btn.getAttribute("data-phone"));
        const targetLead = this.leads.find((l) => l.phone === phone);
        if (targetLead && this.dialogEl) {
          openPughModal(targetLead, this.dialogEl);
        }
      });
    });

    // Attach 1-click delete handlers
    this.leadsTableBody.querySelectorAll(".btn-delete-lead").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const phone = decodeURIComponent(btn.getAttribute("data-phone"));
        if (!confirm(`Are you sure you want to delete lead ${phone}?`)) return;
        btn.disabled = true;
        try {
          const res = await fetch(`/api/leads/${encodeURIComponent(phone)}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            this.showToast(`🗑️ Lead ${phone} deleted successfully.`);
            this.fetchLeads();
          } else {
            alert("Delete failed: " + (data.error || "Unknown error"));
            btn.disabled = false;
          }
        } catch (err) {
          alert("Error: " + err.message);
          btn.disabled = false;
        }
      });
    });

    // Attach 1-click dispatch handlers
    this.leadsTableBody.querySelectorAll(".btn-action-dispatch").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const phone = decodeURIComponent(btn.getAttribute("data-phone"));
        btn.disabled = true;
        btn.innerText = "Dispatching...";
        try {
          const res = await fetch(`/api/leads/${encodeURIComponent(phone)}/handover`, { method: "POST" });
          const data = await res.json();
          if (data.success) {
            this.showToast(`✅ Lead successfully transferred to Sales Team!`, "toast-sales");
            this.fetchLeads();
          }
        } catch (err) {
          alert("Error: " + err.message);
          btn.disabled = false;
          btn.innerText = "Retry Dispatch";
        }
      });
    });
  }

  showToast(messageHtml, extraClass = "") {
    const toast = document.createElement("div");
    toast.className = `toast ${extraClass}`;
    toast.innerHTML = `
      <span style="font-size: 1.2rem;">📢</span>
      <div>${messageHtml}</div>
    `;
    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(40px)";
      toast.style.transition = "all 0.4s ease";
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }

  exportLeadsCSV() {
    if (this.leads.length === 0) {
      alert("No leads to export.");
      return;
    }

    const headers = ["ID", "Name", "Phone", "Status", "Pugh Score", "Sales Handover Sent", "Budget Stated", "Timeline", "Last Active"];
    const rows = this.leads.map((l) => [
      `"${l.id}"`,
      `"${l.name || ""}"`,
      `"${l.phone || ""}"`,
      `"${l.status || ""}"`,
      `"${l.pughScore}%"`,
      `"${l.salesHandoverSent ? "YES" : "NO"}"`,
      `"${(l.evaluations?.budget_readiness?.quote || "").replace(/"/g, '""')}"`,
      `"${(l.evaluations?.timeline_urgency?.quote || "").replace(/"/g, '""')}"`,
      `"${l.lastSeen || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `havencraft_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

// Initialize on DOM Ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.app = new DashboardApp();
  });
} else {
  window.app = new DashboardApp();
}
