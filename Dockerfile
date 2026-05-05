# Stage 1: Build the frontend
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all files and build the frontend assets (Vite)
COPY . .
RUN npm run build

# Stage 2: Production server
FROM node:22-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install

# Copy all files (required for server.ts and its imports)
COPY . .

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose the application port
EXPOSE 3000

# Start using the npm script defined in package.json
CMD ["npm", "start"]
