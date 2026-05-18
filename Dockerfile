FROM node:18-alpine

WORKDIR /app

# Install curl for healthcheck + openssl compat for Prisma 5.x on Alpine
RUN apk add --no-cache curl openssl openssl-dev libc6-compat

COPY package*.json ./

RUN npm ci

COPY . .

# Generate Prisma client (targets linux-musl-openssl-3.0.x for Alpine 3.21)
RUN npx prisma generate

# Build TypeScript
RUN npm run build

EXPOSE ${API_PORT}

# Use entrypoint to sync schema and start server
ENTRYPOINT ["sh", "docker-entrypoint.sh"]
