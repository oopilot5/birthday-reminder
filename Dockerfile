FROM node:20-alpine AS builder

# Install build dependencies for SQLite
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_DIR=/app/data

# Create data directory for SQLite
RUN mkdir -p /app/data

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN npm ci --only=production

EXPOSE 3000

CMD ["node", "server.js"]
