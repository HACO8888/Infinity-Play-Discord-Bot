# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --prod --frozen-lockfile

FROM node:24-alpine
# node:sqlite 仍會印出 ExperimentalWarning
ENV NODE_ENV=production NODE_OPTIONS=--disable-warning=ExperimentalWarning DATABASE_PATH=/app/data/bot.sqlite
WORKDIR /app
# 處罰身分組紀錄（SQLite）；部署時把 /app/data 掛成 volume
RUN mkdir -p /app/data && chown node:node /app/data
COPY --from=deps /app/node_modules ./node_modules
COPY package.json config.json ./
COPY src ./src
USER node
# Node 24 原生支援 TypeScript（type stripping），不需要編譯
CMD ["node", "src/index.ts"]
