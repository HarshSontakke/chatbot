import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3002"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  HOST: z.string().default("0.0.0.0"),

  // Meta WhatsApp Cloud API
  WHATSAPP_ACCESS_TOKEN: z.string().default("EAAB_placeholder_token"),
  WHATSAPP_PHONE_NUMBER_ID: z.string().default("108241432250276"),
  WHATSAPP_WABA_ID: z.string().default("166900666499914"),
  WHATSAPP_VERIFY_TOKEN: z.string().default("your_super_secret_verify_token_123"),
  WHATSAPP_WEBHOOK_URL: z.string().default("http://localhost:3002/api/webhook/meta"),

  // AI & NLP
  OPENAI_API_KEY: z.string().default(""),
  AGENT_MODEL: z.string().default("gpt-4o-mini"),

  // Business & Lead Qualification
  BUSINESS_NAME: z.string().default("HavenCraft Luxury Realty"),
  SALES_TEAM_PHONE: z.string().default("+91 98201 99000"),
  SALES_TEAM_EMAIL: z.string().default("acquisitions@havencraftrealty.com"),
  PUGH_QUALIFICATION_THRESHOLD: z.coerce.number().min(1).max(100).default(70),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn("⚠️ Warning: Environment variable validation had warnings:", parsed.error.format());
}

export const env = parsed.success ? parsed.data : envSchema.parse({});
