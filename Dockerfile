FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build
RUN adduser -D app && chown -R app:app /app
USER app
EXPOSE 8080
CMD ["node","dist/server.js"]
