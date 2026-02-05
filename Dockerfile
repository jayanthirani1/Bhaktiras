# Bhaktiras - Node app (Vite + Express)
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Dev server runs on 5000
EXPOSE 5000

ENV NODE_ENV=development
ENV PORT=5000

# Use tsx to run server in dev (Vite + Express)
CMD ["npm", "run", "dev"]
