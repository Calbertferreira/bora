# BORA

Plataforma inteligente para planejar, reservar e contratar experiências completas.

## Stack

- Next.js 15 + React 19 + TypeScript
- PostgreSQL exclusivo no Neon
- Drizzle ORM
- Better Auth
- Deploy na Vercel

## Desenvolvimento

1. Copie `.env.example` para `.env.local` e informe a conexão do banco BORA.
2. Execute `pnpm install`.
3. Aplique as migrações com `pnpm db:migrate:auth` e `pnpm db:migrate:internal`.
4. Execute `pnpm dev`.

O endpoint `/api/health` informa a saúde da aplicação e da conexão com o banco.

## Papéis e cadastro

- `CLIENT`: cadastro público e acesso aos próprios planejamentos.
- `SUPPLIER`: cadastro público, sujeito à aprovação, para serviços e preços.
- `STAFF`: colaborador interno, criado apenas por convite, sem resultados financeiros.
- `ADMIN`: administrador com acesso total, criado apenas por convite.

Uma pessoa pode acumular mais de um papel. Convites internos são vinculados ao e-mail, expiram em 72 horas e são registrados na auditoria.

## Primeiro administrador

O primeiro administrador não é criado pelo formulário público:

1. A pessoa cria uma conta normal e conclui o cadastro.
2. Um responsável com acesso seguro ao banco executa:

```bash
pnpm admin:promote -- --email=administrador@exemplo.com
```

Depois disso, os demais administradores e colaboradores são convidados pela página `/admin/usuarios`.

## MVP atual

- Página inicial responsiva com identidade visual BORA.
- Jornadas interativas para Festejar, Relaxar e Sugestões.
- Cadastro e login com e-mail/senha e estrutura para Google OAuth.
- Perfis de cliente, fornecedor, colaborador e administrador.
- Convites internos, suspensão/bloqueio de contas e auditoria.
- Estrutura inicial de usuários, locais e planejamentos no PostgreSQL.
