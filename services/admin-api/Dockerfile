FROM node:20-alpine AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY libs/ ./libs/
COPY services/admin-api/ ./services/admin-api/
RUN npm i -g pnpm && pnpm install --frozen-lockfile
RUN pnpm --filter @itadx/admin-api build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/services/admin-api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 4000
CMD ["node", "dist/main.js"]
