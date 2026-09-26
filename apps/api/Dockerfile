FROM node:20-slim
WORKDIR /app

# Install deps from the lockfile first so code edits don't re-run npm install.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "src/server.js"]
