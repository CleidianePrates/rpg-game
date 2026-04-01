# ── Stage 1: build ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Azure vars injected at build time
ARG VITE_AZURE_OPENAI_ENDPOINT
ARG VITE_AZURE_OPENAI_API_KEY
ARG VITE_AZURE_OPENAI_DEPLOYMENT
ARG VITE_AZURE_OPENAI_API_VERSION

ENV VITE_AZURE_OPENAI_ENDPOINT=$VITE_AZURE_OPENAI_ENDPOINT
ENV VITE_AZURE_OPENAI_API_KEY=$VITE_AZURE_OPENAI_API_KEY
ENV VITE_AZURE_OPENAI_DEPLOYMENT=$VITE_AZURE_OPENAI_DEPLOYMENT
ENV VITE_AZURE_OPENAI_API_VERSION=$VITE_AZURE_OPENAI_API_VERSION

RUN npm run build

# ── Stage 2: serve ──────────────────────────────────────────────
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
