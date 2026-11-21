# syntax=docker/dockerfile:1

# ---- base: Node + OpenSSL (required by Prisma's query engine on Alpine) ----
FROM node:26-alpine AS base
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- deps: full dependency tree; postinstall runs `prisma generate` for this platform ----
FROM base AS deps
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

# ---- builder: Next.js standalone build ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV BUILD_STANDALONE=1
RUN npm run build

# ---- migrator: Prisma CLI + seed scripts (used by the `migrate` compose service) ----
FROM base AS migrator
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["npx", "prisma", "migrate", "deploy"]

# ---- runner: minimal production image ----
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs \
 && adduser -S -u 1001 -G nodejs nextjs \
 && mkdir .next \
 && chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
