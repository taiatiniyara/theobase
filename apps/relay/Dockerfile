# Stage 1: Build deps (production-only install)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

# Stage 2: Production image (non-root, minimal)
FROM node:22-alpine AS runner
RUN addgroup -g 1001 -S relay && adduser -S relay -u 1001 -G relay

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/
COPY package.json ./

EXPOSE 3113
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3113/health || exit 1

USER relay
CMD ["node", "src/index.js"]
