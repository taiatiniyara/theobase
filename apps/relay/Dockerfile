FROM node:22-alpine AS base
RUN addgroup -S relay && adduser -S relay -G relay
WORKDIR /app

FROM base AS deps
COPY package.json ./
RUN npm install --omit=dev

FROM base
COPY --from=deps /app/node_modules ./node_modules
COPY src/ src/
USER relay
EXPOSE 3113
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3113/health || exit 1
CMD ["node", "src/index.js"]
