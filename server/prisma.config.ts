import { defineConfig } from "@prisma/config";
import * as dotenv from "dotenv";

dotenv.config();

// ==========================================
// KONFIGURASI DATABASE URL
// ==========================================

// --- [ACTIVE] NEON POSTGRESQL (VERCEL / CLOUD) ---
const DB_URL = process.env.DATABASE_URL;


export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  datasource: {
    url: DB_URL,
  },
});