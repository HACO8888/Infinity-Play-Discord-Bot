# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --prod --frozen-lockfile

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json config.json ./
COPY src ./src
USER node
# Node 24 原生支援 TypeScript（type stripping），不需要編譯
CMD ["node", "src/index.ts"]
