# ==============================================================================
# Stage 1: Build Environment (Node.js 20 LTS Alpine)
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy project source files
COPY . .

# Build Arguments for Midnight Preprod Configuration
ARG VITE_NETWORK=preprod
ARG VITE_PREPROD_RPC_URL=https://rpc.preprod.midnight.network
ARG VITE_PREPROD_INDEXER_URL=https://indexer.preprod.midnight.network/api/v1/graphql
ARG VITE_PREPROD_PROOF_SERVER_URL=http://127.0.0.1:6300
ARG VITE_PREPROD_CONTRACT_ADDRESS=0200preprod_privaterank_midnight_contract_v1

ENV VITE_NETWORK=$VITE_NETWORK
ENV VITE_PREPROD_RPC_URL=$VITE_PREPROD_RPC_URL
ENV VITE_PREPROD_INDEXER_URL=$VITE_PREPROD_INDEXER_URL
ENV VITE_PREPROD_PROOF_SERVER_URL=$VITE_PREPROD_PROOF_SERVER_URL
ENV VITE_PREPROD_CONTRACT_ADDRESS=$VITE_PREPROD_CONTRACT_ADDRESS

# Build production bundle with TypeScript check
RUN npm run build

# ==============================================================================
# Stage 2: Production Runtime (Nginx Alpine)
# ==============================================================================
FROM nginx:alpine

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled production artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy optimized nginx SPA configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose standard web port
EXPOSE 80

# Healthcheck to verify container health
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx daemon
CMD ["nginx", "-g", "daemon off;"]
