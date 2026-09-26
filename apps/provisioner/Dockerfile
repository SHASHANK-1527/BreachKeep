FROM node:20-slim
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src

# Internal-only service. It is never published by nginx to the outside world;
# the api service reaches it over the compose network with a shared secret.
ENV NODE_ENV=production
EXPOSE 6000
CMD ["node", "src/server.js"]
