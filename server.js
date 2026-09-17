import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./src/config/env.js";
import apiRouter from "./src/routes/api.js";
import { leadStore } from "./src/services/lead-store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, "public")));

// Real-Time Server-Sent Events (SSE) stream for web dashboard
app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: "CONNECTED", timestamp: Date.now() })}\n\n`);

  // Subscribe to real-time lead store events
  const unsubscribe = leadStore.subscribe((event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  // Keep-alive heartbeat every 20 seconds
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

// Mount API routes
app.use("/api", apiRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    business: env.BUSINESS_NAME,
    phoneId: env.WHATSAPP_PHONE_NUMBER_ID,
    wabaId: env.WHATSAPP_WABA_ID,
    threshold: env.PUGH_QUALIFICATION_THRESHOLD,
    timestamp: new Date().toISOString()
  });
});

// SPA fallback to index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const server = app.listen(Number(env.PORT), env.HOST, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                   🏠 HAVENCRAFT REALTY - WHATSAPP NLP CHATBOT                         ║
║               Pugh Matrix Lead Qualification & Real-Time Dashboard                    ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣
║  🌐 Web Dashboard:         http://localhost:${env.PORT}                                      ║
║  💬 WhatsApp Webhook:     POST /api/webhook/meta                                      ║
║  🔑 Webhook Verify Token:  ${env.WHATSAPP_VERIFY_TOKEN.padEnd(46)} ║
║  📱 Phone Number ID:      ${env.WHATSAPP_PHONE_NUMBER_ID.padEnd(46)} ║
║  🏢 WABA Account ID:      ${env.WHATSAPP_WABA_ID.padEnd(46)} ║
║  📊 Pugh Score Threshold:  ${(env.PUGH_QUALIFICATION_THRESHOLD + "% (Genuine Buyer Cutoff)").padEnd(46)} ║
║  🚨 Sales Team Phone:      ${env.SALES_TEAM_PHONE.padEnd(46)} ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
  `);
});

export default server;
