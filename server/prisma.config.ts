import { defineConfig } from "@prisma/config";
import * as dotenv from "dotenv";

dotenv.config();

// ==========================================
// KONFIGURASI DATABASE URL
// ==========================================

// --- [ACTIVE] NEON POSTGRESQL (VERCEL / CLOUD) ---
const DB_URL = process.env.DATABASE_URL || "postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/booking_rapat?sslmode=require";

// --- [INACTIVE] MYSQL LOKAL (XAMPP / LOKAL) ---
// const DB_URL = process.env.DATABASE_URL || "mysql://root:zupergilz@localhost:3306/booking_rapat";

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