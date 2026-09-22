FROM node:20-slim
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build && npm run build:landing
CMD ["sh", "-c", "cp -r dist/* /out/ 2>/dev/null || true"]
