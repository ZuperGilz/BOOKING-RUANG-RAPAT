import { defineConfig } from "@prisma/config";
import * as dotenv from "dotenv";

dotenv.config();

// Gunakan DATABASE_URL dari .env
const DB_URL = process.env.DATABASE_URL || "mysql://root:@localhost:3306/booking_rapat";

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