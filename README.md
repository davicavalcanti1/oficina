# Oficina

Gestão de oficina mecânica. Etapa 0: censo do pátio e lista de prioridade.
Escopo em `docs/ETAPA-0.md`.

## Rodar

```
npm install
npm run dev
```

Abre em http://localhost:5174. Com `host: true` o Vite também mostra o endereço
na rede local, para abrir no celular.

Variáveis em `.env` (ver `.env.example`): URL e chave pública do projeto
Supabase `oficina`.

## Primeiro acesso

Na tela de login, "Criar conta". Cada conta nova cria a própria oficina.
Dono e administrador usam a mesma conta.
