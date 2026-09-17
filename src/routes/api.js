import { Router } from "express";
import { verifyWebhook, handleWebhookEvents } from "../controllers/webhook.controller.js";
import {
  getLeads,
  getLeadByPhone,
  deleteLead,
  manualSalesHandover,
  getSalesDispatches,
  getCriteriaDefinitions
} from "../controllers/leads.controller.js";
import { simulateChat } from "../controllers/chat.controller.js";

const router = Router();

// Meta WhatsApp Cloud API Webhook Endpoints
router.get("/webhook/meta", verifyWebhook);
router.post("/webhook/meta", handleWebhookEvents);

// Web Dashboard Leads & Pugh Matrix Endpoints
router.get("/leads", getLeads);
router.get("/leads/:phone", getLeadByPhone);
router.delete("/leads/:phone", deleteLead);
router.post("/leads/:phone/handover", manualSalesHandover);
router.get("/sales/dispatches", getSalesDispatches);
router.get("/criteria", getCriteriaDefinitions);

// Web Simulator Endpoint
router.post("/chat/simulate", simulateChat);

export default router;
