import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// Prisma skips its own .env loading when a config file exists; load .env.local etc. like Next.js does.
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
