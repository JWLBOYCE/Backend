FROM node:20-alpine AS deps
WORKDIR /app
# Build toolchain for native modules
RUN apk add --no-cache python3 make g++ libc-dev
COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Toolchain required to build better-sqlite3 in this final stage
RUN apk add --no-cache python3 make g++ libc-dev
COPY package.json package-lock.json* ./
# Install production deps in the final stage so native modules match this arch/libc
RUN npm ci --omit=dev --frozen-lockfile
COPY --from=builder /app/dist ./dist
RUN adduser -D app && chown -R app:app /app
USER app
EXPOSE 8080
CMD ["node","dist/server.js"]
