# InvenPro — Sistema de Gestão de Inventário

Sistema completo de gestão de inventário com ciclo de compras e vendas, construído com **Next.js 16**, **TypeScript**, **Prisma 7** e **PostgreSQL**.

## O que é

O InvenPro é um sistema ERP simplificado que gerencia o **ciclo completo** de um negócio:

```
🏭 Fornecedor ──→ 🏢 Empresa ──→ 👤 Cliente
   (compra)        (estoque)       (venda)
```

- **Compra**: Entrada de mercadoria e controle de custos (média ponderada)
- **Gestão interna**: Controle de estoque, categorias e movimentações
- **Venda**: Saída de mercadoria, faturamento e contas a receber

---

## Tecnologias

| Tecnologia                                    | Versão     | Função                                    |
| --------------------------------------------- | ---------- | ----------------------------------------- |
| [Next.js](https://nextjs.org/)                | 16.1.6     | Framework full-stack (React + API Routes) |
| [React](https://react.dev/)                   | 19.2.3     | Biblioteca de UI                          |
| [TypeScript](https://www.typescriptlang.org/) | 5.x        | Tipagem estática                          |
| [Prisma](https://www.prisma.io/)              | 7.4.0      | ORM com driver adapter                    |
| [PostgreSQL](https://www.postgresql.org/)     | 16         | Banco de dados relacional                 |
| [pg](https://node-postgres.com/)              | 8.x        | Driver PostgreSQL para Node.js            |
| [TanStack Query](https://tanstack.com/query)  | 5.x        | Cache e estado do servidor (Client)       |
| [NextAuth.js](https://next-auth.js.org/)      | 5.x (beta) | Autenticação                              |
| [Zod](https://zod.dev/)                       | 4.x        | Validação de esquemas                     |
| [Lucide React](https://lucide.dev/)           | 0.564+     | Ícones                                    |
| [Sonner](https://sonner.emilkowal.ski/)       | 2.x        | Notificações toast                        |

### Arquitetura

```
┌─────────────────────────────────────────────────────┐
│  Browser                                            │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │Server Components│  │  Client Components       │  │
│  │ (Dashboard)     │  │ (Produtos, Vendas, etc)  │  │
│  └────────┬────────┘  └──────┬───────────┬───────┘  │
│           │ Direct DB        │ API       │ Server   │
│           │ Access           │ Routes    │ Actions  │
│           │                  ▼           ▼          │
│           │           ┌────────────┐ ┌────────────┐ │
│           │           │ TanStack Q │ │ Mutations  │ │
│           │           └──────┬─────┘ └─────┬──────┘ │
└───────────┼──────────────────┼─────────────┼────────┘
            │                  │ fetch()     │ POST
            ▼                  ▼             ▼
┌─────────────────────────────────────────────────────┐
│  Backend / Database Layer                           │
│  Next.js App Router + Prisma 7 + pg adapter         │
└────────────────────────┬────────────────────────────┘
                         │ PrismaPg (@prisma/adapter-pg)
                         ▼
┌─────────────────────────────────────────────────────┐
│  PostgreSQL 16 (Docker local / Neon em produção)    │
└─────────────────────────────────────────────────────┘
```

---

## Funcionalidades

### 📊 Dashboard

- KPIs em tempo real: total de produtos, valor do estoque, alertas de estoque baixo
- KPIs financeiros: Compras vs Vendas vs Saldo
- Filtros por período: Hoje, 7 dias, 30 dias, 12 meses, Personalizado
- Gráficos SVG puros (sem bibliotecas): LineChart, BarChart, DonutChart, HorizontalBarChart
- Alertas de estoque baixo e movimentações recentes

### 📦 Produtos

- CRUD com busca full-text (case-insensitive) e filtro por categoria
- Paginação no servidor, SKU único, custo médio ponderado
- Histórico de movimentações por produto

### 🏷️ Categorias

- Gerenciamento com proteção contra exclusão de categorias em uso

### ↔️ Movimentações de Estoque

- Entradas (IN) e saídas (OUT) com motivo
- Atualização de estoque em transação atómica

### 🛒 Compras

- **Fornecedores**: CRUD com CNPJ único
- **Ordens de Compra**: código sequencial, fluxo de status com histórico
- **Recebimento**: conferência cega, divergências, custo médio ponderado, contas a pagar automáticas

### 🛍️ Vendas

- **Clientes**: CRUD com CPF/CNPJ único
- **Pedidos de Venda**: código sequencial, parcelamento, faturamento com baixa de estoque
- **Contas a Receber**: geradas automaticamente ao faturar

### 👥 Utilizadores

- Roles: `ADMIN`, `OPERADOR`, `VISUALIZADOR`
- RBAC aplicado em todas as rotas e Server Actions

### 📋 Auditoria

- Log automático de CREATE/UPDATE/DELETE nas entidades críticas

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) (gestor de pacotes)
- [Docker](https://www.docker.com/) (para o PostgreSQL local)

---

## Instalação e Configuração

### 1. Clonar e instalar dependências

```bash
git clone <url-do-repositório>
cd sistema_de_gestao_de_inventario
pnpm install
```

### 2. Criar o container PostgreSQL com Docker

```bash
docker run --name inventario-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=inventario \
  -p 5432:5432 \
  -d postgres:16
```

### 3. Configurar variáveis de ambiente

Crie ou edite o arquivo `.env` na raiz do projecto:

```env
# PostgreSQL (Docker local)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inventario"

# NextAuth — gerar com: openssl rand -base64 32
AUTH_SECRET="sua-chave-secreta-aqui"
AUTH_URL="http://localhost:3000"

# (Opcional) Webhook para logs de erros
# SYSTEM_ERROR_WEBHOOK_URL="https://seu-webhook.com"
```

### 4. Executar as migrations e popular o banco

```bash
# Criar o schema no banco
pnpm prisma migrate dev --name "init-postgres"

# Popular com dados de demonstração (12 meses)
pnpm exec tsx prisma/seed.ts 12
```

### 5. Iniciar o servidor de desenvolvimento

```bash
pnpm dev
```

Acesse em [http://localhost:3000](http://localhost:3000).

**Credenciais padrão (geradas pelo seed):**

| Campo    | Valor                |
| -------- | -------------------- |
| Email    | `admin@invenpro.com` |
| Password | `admin123`           |

---

## Comandos Úteis

```bash
# Reiniciar o container PostgreSQL (após reiniciar o PC)
docker start inventario-db

# Regenerar Prisma Client (após alterar schema.prisma)
pnpm prisma generate

# Visualizar o banco de dados no browser
pnpm prisma studio

# Re-executar o seed com período diferente (ex: 6 meses)
pnpm exec tsx prisma/seed.ts 6

# Build de produção
pnpm build
pnpm start
```

---

## Estrutura do Projecto

```
app/
├── api/
│   ├── products/            # CRUD de produtos (paginado, busca insensitive)
│   ├── categories/          # CRUD de categorias
│   ├── movements/           # Movimentações de estoque
│   ├── suppliers/           # CRUD de fornecedores
│   ├── purchase-orders/     # Ordens de compra + [id]/
│   ├── accounts-payable/    # Contas a pagar
│   ├── customers/           # CRUD de clientes
│   ├── sales-orders/        # Pedidos de venda + [id]/
│   ├── accounts-receivable/ # Contas a receber
│   ├── users/               # Gestão de utilizadores (admin)
│   ├── export/              # Exportação CSV/XLSX (streaming)
│   └── recebimento/         # API de recebimento de mercadoria
├── hooks/                   # Hooks TanStack Query (use-products, etc.)
├── components/
│   ├── charts/              # LineChart, BarChart, DonutChart, HorizontalBarChart (SVG puro)
│   └── dashboard/           # KPISection, ChartsSection, LowStockList, RecentMovements
├── produtos/                # Listagem, criação (/novo), edição (/[id])
├── categorias/
├── movimentacoes/
├── fornecedores/
├── compras/
├── recebimento/
├── contas-a-pagar/
├── clientes/
├── pedidos/
├── contas-a-receber/
├── usuarios/
├── page.tsx                 # Dashboard (Server Component)
└── globals.css              # Design tokens e animações CSS
lib/
├── prisma.ts                # Singleton PrismaClient com PrismaPg adapter
├── dashboard-data.ts        # Queries do dashboard (raw SQL com CAST para PostgreSQL)
├── audit.ts                 # Extensão Prisma para audit logging automático
├── logger.ts                # Logger de erros com webhook
├── auth.ts                  # Configuração NextAuth
├── schemas.ts               # Schemas Zod de validação
├── types.ts                 # Tipos TypeScript globais
└── utils.ts                 # formatCurrency, formatDate, formatDayMonth
prisma/
├── schema.prisma            # 15+ modelos (PostgreSQL provider)
├── seed.ts                  # Dados de demonstração configurável
└── migrations/              # Histórico de migrations PostgreSQL
```

---

## Dados de Demonstração

O seed gera dados realistas com distribuição cronológica:

```bash
# Sintaxe
pnpm exec tsx prisma/seed.ts [MESES]

# Exemplos
pnpm exec tsx prisma/seed.ts 1   # último mês
pnpm exec tsx prisma/seed.ts 6   # últimos 6 meses (padrão)
pnpm exec tsx prisma/seed.ts 12  # último ano
pnpm exec tsx prisma/seed.ts 24  # últimos 2 anos
```

**Volumes gerados (para 12 meses):**

| Entidade                 | Quantidade |
| ------------------------ | ---------- |
| Utilizador admin         | 1          |
| Categorias               | 8          |
| Produtos                 | 60         |
| Fornecedores             | 12         |
| Clientes                 | 30         |
| Ordens de Compra         | ~48        |
| Pedidos de Venda         | ~120       |
| Movimentações de Estoque | ~170+      |
| Contas Bancárias         | 3          |
| Transações Bancárias     | ~96        |
| Registros de Auditoria   | ~228       |

---

## Produção

Para produção, substitua o PostgreSQL local por um serviço gerenciado:

- **[Neon](https://neon.tech/)** — PostgreSQL serverless (free tier disponível)
- **[Supabase](https://supabase.com/)** — PostgreSQL com extras (free tier disponível)
- **[Vercel Postgres](https://vercel.com/storage/postgres)** — Integração nativa com Vercel

Basta alterar a variável `DATABASE_URL` no painel de environment variables do seu serviço de deploy.

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```
