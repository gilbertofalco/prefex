# PREFEX — Reabilitação Cognitiva

Plataforma web de reabilitação cognitiva focada em funções executivas, inspirada no sistema PREFEX.

## Funcionalidades

- **Login duplo**: Profissional (admin) e Aluno (credenciais próprias)
- **Dashboard colorido** com categorias cognitivas e botões grandes
- **3 jogos interativos** no MVP:
  - Matriz de Círculos (Coordenação Visomotora)
  - Sequência Simon (Sequência)
  - Classificação (Frutas vs Animais)
- **Salvamento automático** de resultados (pontuação, tempo, erros)
- **Painel do profissional** com lista de alunos, filtros e exportação CSV
- **Modo demonstração** quando Supabase não está configurado

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- React Router v6
- TanStack Query + Zustand + Zod
- Supabase (PostgreSQL + Auth + RLS)
- Vitest + Playwright

## Início rápido (modo demo)

```bash
npm install
npm run dev
```

Acesse http://localhost:5173 e use as credenciais demo:

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Profissional | profissional@prefex.demo | demo123 |
| Aluno | aluno@prefex.demo | demo123 |

No modo demo, todos os dados são salvos em `localStorage`.

## Configuração com Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Copie `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
3. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
4. Execute no **SQL Editor** do Supabase:
   - **Projeto novo:** só `supabase/migrations/001_initial_schema.sql`
   - **Projeto com erros de login/perfil:** primeiro `supabase/reset_database.sql`, depois `001_initial_schema.sql`
5. Em **Authentication → Providers → Email**, desligue **Confirm email**
6. Reinicie o servidor de desenvolvimento

## Scripts

```bash
npm run dev       # Servidor de desenvolvimento
npm run build     # Build de produção
npm run preview   # Preview do build
npm run test      # Testes unitários (Vitest)
npm run test:e2e  # Testes E2E (Playwright)
npm run lint      # ESLint
```

## Estrutura do projeto

```
src/
├── app/              # Rotas e layouts
├── features/
│   ├── auth/         # Login e registro
│   ├── dashboard/    # Dashboard do aluno
│   ├── games/        # Jogos e infra compartilhada
│   └── professional/ # Painel do profissional
├── lib/              # Supabase, scoring, drafts, demo mode
├── hooks/            # Hooks globais
└── types/            # Tipos TypeScript
supabase/migrations/  # Schema SQL + RLS + seed
tests/                # Testes Vitest
e2e/                  # Testes Playwright
```

## Deploy

### Vercel

1. Conecte o repositório à Vercel
2. Configure as variáveis de ambiente Supabase
3. O arquivo `vercel.json` já configura SPA routing

### Supabase

- Ative backup automático no painel
- Revise as políticas RLS antes de produção

## Licença

Projeto privado — uso clínico/educacional.
