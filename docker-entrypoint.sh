#!/bin/sh
# Gera /config.js com as variáveis de ambiente do container.
# Assim a mesma imagem serve qualquer projeto Supabase: basta trocar as variáveis no EasyPanel.
cat > /usr/share/nginx/html/config.js <<EOF
window.__CONFIG__ = {
  SUPABASE_URL: "${VITE_SUPABASE_URL}",
  SUPABASE_KEY: "${VITE_SUPABASE_KEY}"
};
EOF
