# 🏠 HavenCraft Luxury Realty • WhatsApp NLP Property Chatbot & Pugh Matrix Lead Qualification

A production-grade, AI-powered WhatsApp real estate chatbot built to identify whether an incoming lead is **Genuine / High-Intent** or a **Casual Explorer / Window Shopper** using the **Pugh Decision Matrix**. Includes a real-time web dashboard, an interactive WhatsApp simulator, and an automated Sales Team handover dispatch pipeline.

---

## 🌟 Key Capabilities

1. **Meta WhatsApp Cloud API Compliance (v21.0)**:
   - **Immediate 200 OK Rule**: Instant HTTP 200 acknowledgment (<200ms) to satisfy Meta's 3-second timeout SLA and prevent infinite retry loops.
   - **48-Hour WAMID Deduplication**: Rejects duplicate webhooks from Meta.
   - **Message Chunker**: Automatically splits messages exceeding 4,000 characters.
   - **24-Hour Customer Care Window Support**: Checks conversation window and supports approved fallback templates.
   - **GET /api/webhook/meta**: Handshake verification challenge with `hub.verify_token`.
   - **POST /api/webhook/meta**: Inbound event processing and outbound auto-reply.

2. **Pugh Matrix Lead Decision Engine**:
   - Evaluates incoming conversational responses against a neutral **Baseline Datum (0)** across 5 weighted real estate dimensions:
     - 💰 **Budget Realism & Financial Readiness (25%)**: Liquid funds or pre-approved mortgage vs vague/unrealistic budget.
     - ⏱️ **Purchase Timeline & Urgency (25%)**: Immediate / under 60 days vs speculative "someday / 2+ years".
     - 📍 **Requirement Specificity (20%)**: Definite micro-market, BHK, floor plan, and end-use/investment clarity vs "show me whatever".
     - 🤝 **Decision-Making Authority (15%)**: Primary buyer / ready co-signer vs detached casual inquirer.
     - 🚶 **Site Inspection Commitment (15%)**: Agrees to private VIP walkthrough vs evasive replies.
   - Computes Net Weighted Delta $\Delta \in [-2.0, +2.0]$ and Normalized Score $0\% - 100\%$.
   - **Verdict Cutoffs**:
     - $\ge 70\%$: **Genuine High-Intent Buyer** $\rightarrow$ Triggers Sales Team Handover.
     - $45\% - 69\%$: **Nurture Prospect** $\rightarrow$ Soft automated catalog nurturing.
     - $< 45\%$: **Casual Explorer** $\rightarrow$ Friendly exit with general market trends catalog.

3. **Polite, Decisive Conversational Question Bank**:
   - Organically asks 5 structured, non-interrogative questions designed to naturally extract intent, budget, timeline, and site visit availability.

4. **Real-Time Web Dashboard**:
   - **Live Pipeline Table**: Shows leads, status badges, Pugh progress meters, and detected quote snippets.
   - **Pugh Matrix Scorecard Modal**: Interactive radial gauge and full breakdown of criteria scores ($-2 \text{ to } +2$).
   - **Interactive WhatsApp Phone Simulator**: Test conversations directly in the browser with quick-reply scenario presets!
   - **Sales Team Command Center**: 1-click dispatch, auto-alert to sales specialist, and CSV export.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- (Optional) ngrok for exposing local server to Meta WhatsApp Webhooks

### 2. Configuration (`.env`)
The project comes pre-configured with your WhatsApp IDs:
```env
WHATSAPP_PHONE_NUMBER_ID=108241432250276
WHATSAPP_WABA_ID=166900666499914
WHATSAPP_VERIFY_TOKEN=your_super_secret_verify_token_123
BOT_PORT=3002
PUGH_QUALIFICATION_THRESHOLD=70
SALES_TEAM_PHONE=+1 (800) 555-0199
OPENAI_API_KEY=sk-proj-...
```
*(Note: If no OpenAI key is set, the built-in heuristic NLP evaluator runs seamlessly!)*

### 3. Run Development Server
```bash
npm start
```
Open your browser at: **`http://localhost:3002`**

### 4. Run Automated Tests
```bash
npm test
```

### 5. Expose Webhook to Meta (Live Testing)
In a separate terminal:
```bash
ngrok http 3002
```
Your Meta Callback URL will be:
`https://your-ngrok-domain.ngrok-free.app/api/webhook/meta`

To automatically register the webhook with Meta Graph API without clicking in the Meta developer portal:
```bash
node scripts/connect-webhook.js https://your-ngrok-domain.ngrok-free.app
```
