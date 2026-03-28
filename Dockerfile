# ─── Build Stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Install dependencies only (layer-cached)
COPY package*.json ./
RUN npm ci --omit=dev

# ─── Runtime Stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Create a non-root user for security
RUN addgroup -S codex && adduser -S codex -G codex

# Copy dependencies from build stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY package*.json ./
COPY src/ ./src/
COPY public/ ./public/

# Create data directory with correct permissions
RUN mkdir -p /app/data && chown -R codex:codex /app

USER codex

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Start the application (seed first, then serve)
CMD ["sh", "-c", "node src/seed.js && node src/server.js"]
