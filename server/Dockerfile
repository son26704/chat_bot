# Dockerfile for the server application
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# FROM node:18-alpine AS build
# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .
# RUN npm run build

# FROM node:18-alpine
# WORKDIR /app
# COPY --from=build /app/dist ./dist
# COPY package*.json ./
# RUN npm install --production
# EXPOSE 3000
# CMD ["node", "dist/index.js"]