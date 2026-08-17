FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Use a lightweight web server for the static build
RUN npm install -g serve
EXPOSE 5173
# serve uses 3000 by default, let's configure it for 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
