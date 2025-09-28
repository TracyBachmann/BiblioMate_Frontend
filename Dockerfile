# ---------- BUILD ANGULAR ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# garde "production" (ou remplace par --configuration docker si tu utilises la config dédiée)
RUN npm run build -- --configuration production

# ---------- RUNTIME NGINX ----------
FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ← copie le bon outputPath (Angular builder "application" -> dist/<proj>/browser)
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=10 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
