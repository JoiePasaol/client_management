# Use Node 20
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the files
COPY . .

# Expose port Vite uses
EXPOSE 5173

# Set environment variable to ensure Vite binds to all interfaces
ENV HOST=0.0.0.0
ENV PORT=5173

# Run Vite dev server with explicit host
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

