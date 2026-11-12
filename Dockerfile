# tiny-back API image.
# Used by the front end course so students can run the API without
# installing Node, pnpm or Postgres. Built locally; see docker-compose.api.yaml.

FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@12.18.0 --activate
WORKDIR /app

# ---- build: install all deps and compile TypeScript ----
FROM base AS build
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN pnpm build

# ---- prod deps only ----
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ---- runtime ----
FROM node:24-alpine
WORKDIR /app
ENV PORT=3000
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
USER node
EXPOSE 3000
# Seed sample data (skipped if the database already has users), then start.
CMD ["sh", "-c", "node dist/database/seed.js && exec node dist/main.js"]
