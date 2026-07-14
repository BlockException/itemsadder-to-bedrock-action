FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/action ./action
COPY --from=builder /app/package.json ./package.json
ENTRYPOINT ["/bin/sh", "/app/action/entrypoint.sh"]
