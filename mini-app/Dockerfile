# Use a base image that includes Chrome dependencies
FROM ghcr.io/puppeteer/puppeteer:21.5.0

# Switch to root to install dependencies and configure permissions
USER root

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for Vite build)
# We skip the internal chromium download because the base image has it
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
RUN npm ci

# Copy the rest of the app code
COPY . .

# Build the frontend
RUN npm run build

# Expose the port Railway gives us
ENV PORT=3001
EXPOSE $PORT

# Start the server
CMD ["node", "server/api.mjs"]