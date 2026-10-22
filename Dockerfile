# Etapa 1: build do Vite
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# A URL e a chave do Supabase são lidas em tempo de execução (ver docker-entrypoint.sh),
# então o build não precisa delas.
RUN npm run build

# Etapa 2: nginx servindo os arquivos estáticos
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker-entrypoint.sh /docker-entrypoint.d/40-config.sh
RUN chmod +x /docker-entrypoint.d/40-config.sh
EXPOSE 80
