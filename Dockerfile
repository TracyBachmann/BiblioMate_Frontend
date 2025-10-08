# ---------- BUILD ANGULAR ----------
FROM node:20-alpine AS build
WORKDIR /app

# Copie des fichiers de dépendances
COPY package.json package-lock.json ./

# Installation robuste avec fallback
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund --legacy-peer-deps

# Copie du code source
COPY . .

# Build de production
RUN npm run build

# ---------- RUNTIME NGINX ----------
FROM nginx:alpine AS runtime

# Copie de la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie des fichiers buildés Angular
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Expose le port 80
EXPOSE 80

# Health check pour Docker
HEALTHCHECK --interval=10s --timeout=3s --retries=10 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

# Démarre Nginx
CMD ["nginx", "-g", "daemon off;"]
