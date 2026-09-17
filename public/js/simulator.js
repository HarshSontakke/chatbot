/**
 * WhatsApp Phone Simulator Controller
 * Provides an interactive WhatsApp mobile experience to test
 * lead qualification, Pugh Matrix scoring, and sales handovers.
 */

export class WhatsAppSimulator {
  constructor({ phone = "+91 98201 55678", name = "Aarav Sharma" } = {}) {
    this.phone = phone;
    this.name = name;
    this.chatBody = document.getElementById("simChatBody");
    this.input = document.getElementById("simInput");
    this.sendBtn = document.getElementById("simSendBtn");
    this.scoreVal = document.getElementById("simScoreVal");
    this.statusBadge = document.getElementById("simStatusBadge");

    this.setupListeners();
    this.renderWelcomeGreeting();
  }

  setupListeners() {
    this.sendBtn.addEventListener("click", () => this.handleSendMessage());
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage();
      }
    });

    // Quick Scenario Chips
    document.querySelectorAll(".scenario-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const text = chip.getAttribute("data-text");
        if (text) {
          this.input.value = text;
          this.handleSendMessage();
        }
      });
    });
  }

  renderWelcomeGreeting() {
    this.appendBotBubble(
      `Hello! 👋 Welcome to *HavenCraft Realty Advisors*! 🏡✨\n` +
      `I am your personal AI Property Dealer Bot.\n\n` +
      `To help me curate verified properties matching your goals, *which major city are you looking to buy property in?*\n\n` +
      `1️⃣ *Mumbai* 🏙️\n` +
      `2️⃣ *Pune* 🌳\n` +
      `3️⃣ *Bangalore* 💻\n` +
      `4️⃣ *Delhi / NCR* 🏛️\n\n` +
      `_(Feel free to reply with 1, 2, 3, 4 or type your city!)_`
    );
  }

  appendUserBubble(text) {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const div = document.createElement("div");
    div.className = "wa-bubble user";
    div.innerHTML = `
      ${this.formatWhatsAppText(text)}
      <div class="wa-bubble-time">${time} <span class="wa-ticks">✓✓</span></div>
    `;
    this.chatBody.appendChild(div);
    this.scrollToBottom();
  }

  appendBotBubble(text) {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const div = document.createElement("div");
    div.className = "wa-bubble bot";
    div.innerHTML = `
      ${this.formatWhatsAppText(text)}
      <div class="wa-bubble-time">${time}</div>
    `;
    this.chatBody.appendChild(div);
    this.scrollToBottom();
  }

  appendTypingIndicator() {
    const div = document.createElement("div");
    div.id = "simTypingIndicator";
    div.className = "wa-bubble bot";
    div.innerHTML = `
      <span style="display: inline-flex; gap: 4px; padding: 4px 8px;">
        <span class="live-dot" style="animation-delay: 0s;"></span>
        <span class="live-dot" style="animation-delay: 0.2s;"></span>
        <span class="live-dot" style="animation-delay: 0.4s;"></span>
      </span>
    `;
    this.chatBody.appendChild(div);
    this.scrollToBottom();
    return div;
  }

  removeTypingIndicator() {
    const indicator = document.getElementById("simTypingIndicator");
    if (indicator) indicator.remove();
  }

  formatWhatsAppText(text) {
    if (!text) return "";
    // WhatsApp formatting: *bold* -> <strong>bold</strong>, _italic_ -> <em>italic</em>
    let formatted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
      .replace(/_(.*?)_/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");
    return formatted;
  }

  scrollToBottom() {
    this.chatBody.scrollTop = this.chatBody.scrollHeight;
  }

  async handleSendMessage() {
    const msg = this.input.value.trim();
    if (!msg) return;

    this.input.value = "";
    this.appendUserBubble(msg);
    this.appendTypingIndicator();

    try {
      const res = await fetch("/api/chat/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: this.phone,
          name: this.name,
          message: msg
        })
      });

      const data = await res.json();
      this.removeTypingIndicator();

      if (data.success) {
        this.appendBotBubble(data.replyText);

        // Update score banner
        const score = data.pughResult?.normalizedScore || 50;
        this.scoreVal.innerText = `${score}%`;
        
        if (score >= 70) {
          this.scoreVal.style.color = "#10b981";
          this.statusBadge.className = "badge badge-genuine";
          this.statusBadge.innerText = "Genuine Buyer (Sales Ready)";
        } else if (score >= 45) {
          this.scoreVal.style.color = "#f59e0b";
          this.statusBadge.className = "badge badge-nurture";
          this.statusBadge.innerText = "Nurture Prospect";
        } else {
          this.scoreVal.style.color = "#94a3b8";
          this.statusBadge.className = "badge badge-explorer";
          this.statusBadge.innerText = "Casual Explorer";
        }

        // Notify app if sales handover fired
        if (data.isSalesHandoverTriggered) {
          window.dispatchEvent(
            new CustomEvent("sales-handover-alert", {
              detail: { lead: data.lead, salesHandover: data.salesHandover }
            })
          );
        }
      } else {
        this.appendBotBubble("⚠️ An error occurred processing your response. Please try again.");
      }
    } catch (err) {
      this.removeTypingIndicator();
      this.appendBotBubble("⚠️ Connection error: Could not reach chatbot server.");
    }
  }
}
