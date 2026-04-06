FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY src/ ./src/
COPY api/apify.ts ./api/apify.ts

RUN npm run build && npm prune --omit=dev

CMD ["node", "dist/api/apify.js"]
