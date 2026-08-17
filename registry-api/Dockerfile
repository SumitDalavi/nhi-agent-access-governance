FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm install -g typescript
RUN npx tsc --outDir dist

EXPOSE 3001
CMD ["node", "dist/index.js"]
