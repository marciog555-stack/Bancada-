# Bancada

Sistema pessoal (uso único, mobile-first) para o Márcio organizar a escala 12x36, o investimento em ferramentas, os projetos de faz-tudo e o painel financeiro do negócio.

Stack: TanStack Start + TypeScript + Tailwind v4 + shadcn/ui + Supabase (Postgres + Auth) + Claude API (server-side). Deploy na Vercel.

## Rodando localmente

```bash
pnpm install
cp .env.example .env   # preencher com as chaves do projeto Supabase "bancada"
pnpm dev
```

Abra http://localhost:3000 — sem sessão, redireciona para `/login`.

## Variáveis de ambiente

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`: públicas, protegidas por RLS (Row Level Security).
- `ANTHROPIC_API_KEY`: usada só em server functions (nunca chega ao client).

## Scripts

- `pnpm dev` — servidor de desenvolvimento
- `pnpm build` — build de produção
- `pnpm exec tsc --noEmit` — typecheck
- `pnpm lint` — eslint
