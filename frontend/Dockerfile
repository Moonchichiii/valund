# syntax=docker/dockerfile:1.7
FROM node:22-alpine

ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /app

# Enable pnpm and pin version
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# Install deps
COPY package.json pnpm-lock.yaml* ./
RUN --mount=type=cache,target=/pnpm/store pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm run build

# Non-root user
USER node

EXPOSE 5173
CMD ["pnpm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
