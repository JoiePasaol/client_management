# -----------------
# Base image
# -----------------
FROM node:20 AS base
WORKDIR /app
COPY package*.json tsconfig*.json ./
RUN npm install

# -----------------
# Development image
# -----------------
FROM base AS dev
COPY . .
EXPOSE 5173
ENV HOST=0.0.0.0
ENV PORT=5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# -----------------
# Production build
# -----------------
FROM base AS build
COPY . .
RUN npm run build

# -----------------
# Production runtime (Nginx serving static files)
# -----------------
FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
