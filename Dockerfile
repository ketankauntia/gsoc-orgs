# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Needed by some Node deps on alpine
RUN apk add --no-cache libc6-compat openssl

# Copy lockfiles if present (supports npm/yarn/pnpm)
COPY package.json ./
COPY package-lock.json* ./
COPY yarn.lock* ./
COPY pnpm-lock.yaml* ./

# Install deps based on whichever lockfile exists
RUN if [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i --frozen-lockfile; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else npm i; fi

# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js
RUN npm run build

# ---------- runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache openssl

# Create non-root user
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Copy only what we need to run
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.* ./ 2>/dev/null || true
COPY --from=builder /app/public ./public

# Next output
COPY --from=builder /app/.next ./.next

# Node modules (needed if you are NOT using Next "standalone" output)
COPY --from=builder /app/node_modules ./node_modules

# Prisma runtime bits (schema + generated client already in node_modules, but schema is useful)
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["npm", "run", "start"]
