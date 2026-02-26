FROM node:20-alpine AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY libs/ ./libs/
COPY services/gateway-api/ ./services/gateway-api/
RUN npm i -g pnpm && pnpm install --frozen-lockfile
RUN pnpm --filter @itadx/gateway-api build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/services/gateway-api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 4003
CMD ["node", "dist/main.js"]
