# Stage 1: Install dependencies
FROM oven/bun:latest AS deps

WORKDIR /app

# Copy only essential files for dependency installation
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Stage 2: Runtime
FROM oven/bun:latest

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules /app/node_modules

# Copy source code and necessary files
COPY src ./src
COPY prisma ./prisma
COPY tsconfig.json ./
COPY package.json ./

# Expose the application's port
EXPOSE 3000