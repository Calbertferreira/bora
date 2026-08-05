# BORA

Plataforma inteligente para planejar, reservar e contratar experiências completas.

## Stack

- Next.js 15 + React 19 + TypeScript
- PostgreSQL exclusivo no Neon
- Drizzle ORM
- Deploy na Vercel

## Desenvolvimento

1. Copie `.env.example` para `.env.local` e informe a conexão do banco BORA.
2. Execute `pnpm install`.
3. Execute `pnpm dev`.

O endpoint `/api/health` informa a saúde da aplicação e da conexão com o banco.

## MVP atual

- Página inicial responsiva com identidade visual BORA.
- Jornadas interativas para Festejar, Relaxar e Sugestões.
- Coleta de local, data, convidados, orçamento e serviços.
- Resumo do planejamento antes da solicitação.
- Estrutura inicial de usuários, locais e planejamentos no PostgreSQL.
