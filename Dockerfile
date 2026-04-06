# --- STAGE 1: Build ---
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copy lock files and package.json
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies including devDependencies for build
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client and build the app
RUN npx prisma generate
RUN npm run build

# --- STAGE 2: Production ---
FROM node:22-alpine

WORKDIR /usr/src/app

# Copy package.json and lock
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies ONLY
RUN npm install --only=production

# Copy built artifacts from builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# Environment variables defaults
ENV PORT=3000
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "dist/main"]
