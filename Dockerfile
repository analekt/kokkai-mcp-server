FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY tsconfig.json ./
COPY src/ ./src/
COPY api/apify.ts ./api/apify.ts

RUN npm run build

CMD ["node", "dist/api/apify.js"]
