import { env } from "../config/env.js";
import { wamidDeduplicator } from "../engine/deduplicator.js";
import { processConversationTurn } from "../engine/nlp-agent.js";
import { leadStore } from "../services/lead-store.js";
import { whatsappService } from "../services/whatsapp.service.js";
import { salesHandoverService } from "../services/sales-handover.service.js";
import { formatIndianCitizenName } from "../services/indian-names.js";

/**
 * Phase A: Meta Webhook Handshake Verification (GET /api/webhook/meta)
 */
export const verifyWebhook = (req, res) => {
  try {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN) {
      console.log("[WEBHOOK] Meta subscription challenge verified successfully!");
      return res.status(200).send(challenge);
    } else {
      console.warn("[WEBHOOK] Verification failed: Token mismatch or invalid mode", { mode, token });
      return res.status(403).send("Forbidden");
    }
  } catch (err) {
    console.error("[WEBHOOK ERROR] Verification error:", err);
    return res.status(500).send("Internal Server Error");
  }
};

/**
 * Phase B: Inbound WhatsApp Event Handler (POST /api/webhook/meta)
 * 1. Immediately returns 200 OK (< 200ms) to comply with Meta 3-second SLA.
 * 2. Deduplicates by WAMID.
 * 3. Dispatches NLP evaluation, Pugh Matrix scoring, and outbound message.
 */
export const handleWebhookEvents = async (req, res) => {
  // 1. Immediate 200 OK acknowledgment
  if (!res.headersSent) {
    res.status(200).send("EVENT_RECEIVED");
  }

  try {
    const body = req.body;
    if (!body || body.object !== "whatsapp_business_account") {
      return;
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) return;

    // Handle delivery/read status updates
    if (value.statuses && value.statuses.length > 0) {
      const status = value.statuses[0];
      // console.log(`[STATUS] Message ${status.id} -> ${status.status}`);
      return;
    }

    // Handle inbound user messages
    const message = value.messages?.[0];
    if (!message) return;

    const wamid = message.id;
    const senderPhone = message.from;
    const contact = value.contacts?.[0];
    const senderName = formatIndianCitizenName(contact?.profile?.name, senderPhone);

    // Deduplication check (48-hour TTL)
    const isNewMessage = wamidDeduplicator.checkAndSet(wamid);
    if (!isNewMessage) {
      console.warn(`[WEBHOOK] Duplicate WAMID ${wamid} detected, skipping execution.`);
      return;
    }

    // Extract text content
    let incomingText = "";
    if (message.type === "text") {
      incomingText = message.text?.body || "";
    } else if (message.type === "interactive") {
      incomingText =
        message.interactive?.button_reply?.title ||
        message.interactive?.list_reply?.title ||
        "";
    } else if (message.type === "button") {
      incomingText = message.button?.text || "";
    } else {
      incomingText = `[User sent media: ${message.type}]`;
    }

    if (!incomingText.trim()) return;

    console.log(`\n[INBOUND WHATSAPP] From: ${senderName} (${senderPhone}): "${incomingText}"`);

    // Mark as read (blue ticks)
    whatsappService.markAsRead(wamid).catch(() => {});

    // Retrieve or initialize lead
    const lead = leadStore.getLead(senderPhone);
    lead.name = senderName;

    // Record incoming user message in history
    lead.chatHistory.push({
      role: "user",
      content: incomingText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      wamid
    });

    // Run NLP processing and Pugh Matrix evaluation
    const result = await processConversationTurn({
      senderPhone,
      senderName,
      incomingMessage: incomingText,
      leadData: lead
    });

    // Record bot response in history
    lead.chatHistory.push({
      role: "assistant",
      content: result.replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    });

    // Update lead record
    const updatedLead = leadStore.updateLead(senderPhone, {
      name: senderName,
      status: result.pughResult.classification,
      isGenuine: result.pughResult.isGenuine,
      pughScore: result.pughResult.normalizedScore,
      pughResult: result.pughResult,
      evaluations: result.evaluations,
      turnCount: result.turnCount,
      chatHistory: lead.chatHistory,
      city: result.city || lead.city,
      configuration: result.configuration || lead.configuration
    });

    // Check if sales handover should be triggered
    if (result.isSalesHandoverTriggered) {
      await salesHandoverService.triggerHandover(updatedLead);
    }

    // Send outbound WhatsApp message back to user
    await whatsappService.sendTextMessage(senderPhone, result.replyText);

  } catch (err) {
    console.error("[WEBHOOK PROCESSING ERROR]:", err);
  }
};
