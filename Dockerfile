# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Server Action ID-г build хооронд ТОГТВОРТОЙ байлгана. Next 15 ID-г build бүрд санамсаргүй
# түлхүүрээр hash хийдэг тул deploy хийхэд нээлттэй байсан tab-ууд "An unexpected response was
# received from the server." алдаа өгдөг. Түлхүүрийг CI secret-ээс (BuildKit secret, layer-т
# үлдэхгүй) авна; secret байхгүй бол хуучин үйлдэл (санамсаргүй түлхүүр).
RUN --mount=type=secret,id=next_sa_key \
    NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$(cat /run/secrets/next_sa_key 2>/dev/null || true)" \
    npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app ./

EXPOSE 3001
CMD ["npm", "run", "start"]
