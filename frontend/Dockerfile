FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# These are baked into the JS bundle at build time
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_TURN_URL
ARG NEXT_PUBLIC_TURN_USERNAME
ARG NEXT_PUBLIC_TURN_CREDENTIAL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL \
    NEXT_PUBLIC_TURN_URL=$NEXT_PUBLIC_TURN_URL \
    NEXT_PUBLIC_TURN_USERNAME=$NEXT_PUBLIC_TURN_USERNAME \
    NEXT_PUBLIC_TURN_CREDENTIAL=$NEXT_PUBLIC_TURN_CREDENTIAL

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
