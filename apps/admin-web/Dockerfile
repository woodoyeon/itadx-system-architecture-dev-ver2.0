FROM node:20-alpine AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/admin-web/ ./apps/admin-web/
RUN npm i -g pnpm && pnpm install --frozen-lockfile
RUN pnpm --filter admin-web build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/admin-web/.next ./.next
COPY --from=builder /app/apps/admin-web/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/admin-web/package.json ./package.json
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
