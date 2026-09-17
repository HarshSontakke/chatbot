import { processConversationTurn } from "../engine/nlp-agent.js";
import { leadStore } from "../services/lead-store.js";
import { salesHandoverService } from "../services/sales-handover.service.js";
import { formatIndianCitizenName } from "../services/indian-names.js";

/**
 * Interactive Web WhatsApp Simulator Endpoint
 * Enables users to test conversations, Pugh score calculation,
 * and sales handovers live from the web dashboard.
 */
export const simulateChat = async (req, res) => {
  try {
    const { phone = "+91 98201 55678", name = "Aarav Sharma", message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: "Message is required" });
    }

    const cleanPhone = phone.trim();
    const lead = leadStore.getLead(cleanPhone);
    lead.name = formatIndianCitizenName(name.trim() || lead.name, cleanPhone);
    lead.source = "Web WhatsApp Simulator";

    // Record user message
    lead.chatHistory.push({
      role: "user",
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    });

    // Process turn with NLP agent
    const result = await processConversationTurn({
      senderPhone: cleanPhone,
      senderName: lead.name,
      incomingMessage: message,
      leadData: lead
    });

    // Record bot response
    lead.chatHistory.push({
      role: "assistant",
      content: result.replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    });

    // Update lead record
    const updatedLead = leadStore.updateLead(cleanPhone, {
      name: lead.name,
      source: "Web WhatsApp Simulator",
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

    // Trigger sales handover if qualified
    let salesHandover = null;
    if (result.isSalesHandoverTriggered) {
      salesHandover = await salesHandoverService.triggerHandover(updatedLead);
    }

    return res.json({
      success: true,
      replyText: result.replyText,
      lead: updatedLead,
      pughResult: result.pughResult,
      isSalesHandoverTriggered: result.isSalesHandoverTriggered,
      salesHandover
    });
  } catch (err) {
    console.error("[SIMULATOR ERROR]:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
