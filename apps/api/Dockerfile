FROM node:20-slim
WORKDIR /app

# Install deps first so code edits don't re-run the install layer.
# npm install (not ci) so a lockfile that drifts from package.json cannot
# break the deploy mid-class.
COPY package.json package-lock.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY src ./src

ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "src/server.js"]
