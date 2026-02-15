# InvenPro — Sistema de Gestão de Inventário

Sistema completo de gestão de inventário com ciclo de compras e vendas, construído com **Next.js 16**, **TypeScript**, **Tailwind CSS v4**, **Prisma 7** e **SQLite**.
(Obs: O projeto está em desenvolvimento, e algumas funcionalidades podem não estar funcionando corretamente.)

## O que é

O InvenPro é um sistema ERP simplificado que gerencia o **ciclo completo** de um negócio:

```
🏭 Fornecedor ──→ 🏢 Empresa ──→ 👤 Cliente
   (compra)        (estoque)       (venda)
```

- **Compra**: Entrada de mercadoria e controle de custos
- **Gestão interna**: Controle de estoque, categorias e movimentações
- **Venda**: Saída de mercadoria e controle de receita

> **Nota**: Este projeto foi configurado para **execução local (Local-First)** utilizando SQLite. Não é necessária a instalação de bancos de dados externos ou configurações complexas de ambiente para rodá-lo.

---

## Tecnologias

| Tecnologia                                    | Versão             | Função                                    |
| --------------------------------------------- | ------------------ | ----------------------------------------- |
| [Next.js](https://nextjs.org/)                | 16.1.6             | Framework full-stack (React + API Routes) |
| [React](https://react.dev/)                   | 19.2.3             | Biblioteca de UI                          |
| [TypeScript](https://www.typescriptlang.org/) | 5.x                | Tipagem estática                          |
| [Prisma](https://www.prisma.io/)              | 7.4.0              | ORM (Object-Relational Mapping)           |
| [SQLite](https://www.sqlite.org/)             | via better-sqlite3 | Banco de dados local                      |
| [Tailwind CSS](https://tailwindcss.com/)      | 4.x                | Framework de CSS utilitário               |
| [Lucide React](https://lucide.dev/)           | 0.564+             | Biblioteca de ícones                      |
| [TanStack Query](https://tanstack.com/query)  | 5.x                | Gerenciamento de estado e cache (Client)  |
| [Zod](https://zod.dev/)                       | 3.x                | Validação de esquemas e tipos             |

### Como os serviços se conectam

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
│           │           │ React Query│ │ Mutations  │ │
│           │           └──────┬─────┘ └─────┬──────┘ │
└───────────┼──────────────────┼─────────────┼────────┘
            │                  │ fetch()     │ POST
            ▼                  ▼             ▼
┌─────────────────────────────────────────────────────┐
│  Backend / Database Layer                           │
│  (Next.js App Router + Prisma)                      │
└────────────────────────┬────────────────────────────┘
                         │ Prisma Client
                         ▼
┌─────────────────────────────────────────────────────┐
│  SQLite Database (prisma/dev.db)                    │
│  Via @prisma/adapter-libsql / better-sqlite3        │
└─────────────────────────────────────────────────────┘
```

**Arquitetura**: Híbrida. O Dashboard utiliza **Server Components** para acesso direto ao banco (performance). As demais páginas interativas são **Client Components** que utilizam **TanStack Query** para buscar dados via API Routes e **Server Actions** para mutações (criação/edição) com validação Zod. O Prisma conecta ao banco SQLite local.

---

## Funcionalidades Principais

### 📊 Dashboard

- KPIs em tempo real: total de produtos, valor do estoque, alertas de estoque baixo
- **KPIs financeiros**: Compras (custo) vs Vendas (receita) vs Saldo
- **Filtros por período**: Hoje, 7 dias, 30 dias, 12 meses, Personalizado
- **Gráficos interativos**: Desenvolvidos com SVG e CSS puro (sem bibliotecas pesadas de charts).
  - **LineChart** — Movimentações de estoque (entradas vs saídas ao longo do tempo)
  - **BarChart** — Compras vs Vendas (comparativo financeiro)
  - **DonutChart** — Distribuição de produtos por categoria (com popover e legenda interativa)
  - **HorizontalBarChart** — Status de ordens de compra e pedidos de venda
- **Skeleton Loading** com efeito shimmer durante o carregamento
- **Animações escalonadas** (staggered fade-in-up) na entrada dos elementos
- Movimentações recentes e alertas de estoque baixo

### 📦 Produtos

- CRUD completo com busca e filtro por categoria
- Páginas dedicadas: listagem (`/produtos`), criação (`/produtos/novo`), edição (`/produtos/[id]`)
- SKU único, preço, quantidade, estoque mínimo
- Badges visuais de status (OK, Baixo, Esgotado)

### 🏷️ Categorias

- Gerenciamento com proteção contra exclusão de categorias em uso

### ↔️ Movimentações de Estoque

- Registro de entradas (IN) e saídas (OUT) com motivo
- Validação de estoque insuficiente nas saídas
- Atualização automática da quantidade do produto (em transação)

---

### 🛒 Módulo COMPRAS (Fornecedor → Empresa)

#### Fornecedores

- CRUD com CNPJ único, email, telefone
- Proteção contra exclusão se tiver pedidos vinculados

#### Ordens de Compra

- Código sequencial automático (`PO-0001`, `PO-0002`...)
- Status: `PENDENTE` → `APROVADA` → `EM_TRANSITO` → `RECEBIDA` (ou `CANCELADA`)
- Itens com produto, quantidade e preço unitário
- Cálculo automático do valor total

#### Recebimento (Conferência Cega)

- Conferência sem mostrar quantidades pedidas ao conferente
- Detecção automática de divergências
- **Em transação**: cria recebimento + atualiza estoque + gera movimentação (IN) + gera conta a pagar

#### Contas a Pagar

- Gerada automaticamente no recebimento
- Ação para marcar como pago

---

### 🛍️ Módulo VENDAS (Empresa → Cliente)

#### Clientes

- CRUD com CPF/CNPJ único, email, telefone, endereço
- Proteção contra exclusão se tiver pedidos vinculados

#### Pedidos de Venda

- Código sequencial automático (`VD-0001`, `VD-0002`...)
- Status: `PENDENTE` → `APROVADA` → `FATURADA` (ou `CANCELADA`)
- **Faturamento em transação**: verifica estoque → decrementa produto → cria movimentação (OUT) → gera conta a receber

#### Contas a Receber

- Gerada automaticamente ao faturar
- Cards com totais pendente/recebido
- Ação para marcar como recebido

---

## Instalação

```bash
# Instalar dependências
npm install

# Gerar Prisma Client e criar banco de dados
npx prisma generate
npx prisma db push

# Popular com dados de exemplo
npx tsx prisma/seed.ts

# Iniciar servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Banco de dados local (SQLite)
TURSO_DATABASE_URL="file:prisma/dev.db"

# (Opcional) Token de autenticação se usar Turso Cloud
# TURSO_AUTH_TOKEN=""
```

Acesse em [http://localhost:3000](http://localhost:3000).

Para visualizar o banco de dados:

```bash
npx prisma studio
```

---

## Estrutura do Projeto

```
app/
├── api/
│   ├── products/            # CRUD de produtos
│   ├── categories/          # CRUD de categorias
│   ├── movements/           # Movimentações de estoque
│   ├── suppliers/           # CRUD de fornecedores
│   ├── purchase-orders/     # Ordens de compra
│   ├── accounts-payable/    # Contas a pagar
│   ├── customers/           # CRUD de clientes
│   ├── sales-orders/        # Pedidos de venda
│   └── accounts-receivable/ # Contas a receber
├── hooks/
│   ├── use-purchase-orders.ts # Hook react-query para ordens
│   └── ...                    # Outros hooks de data fetching
├── components/
│   ├── charts/
│   │   ├── bar-chart.tsx          # Gráfico de barras com popover interativo
│   │   ├── donut-chart.tsx        # Gráfico de rosca com legenda e tooltip
│   │   ├── horizontal-bar-chart.tsx # Barras horizontais (status de pedidos)
│   │   └── line-chart.tsx         # Gráfico de linhas com área preenchida
│   ├── dashboard-skeleton.tsx     # Skeleton loading com shimmer effect
│   ├── layout-shell.tsx           # Shell do layout (sidebar + content)
│   ├── sidebar.tsx                # Navegação lateral colapsável
│   ├── sidebar-context.tsx        # Contexto do sidebar (estado collapsed)
│   ├── header.tsx                 # Cabeçalho com título da página
│   ├── modal.tsx                  # Modal reutilizável
│   └── stats-card.tsx             # Card de KPI com hover animado
├── produtos/
│   ├── page.tsx             # Listagem com busca e filtros
│   ├── novo/page.tsx        # Formulário de criação
│   └── [id]/page.tsx        # Formulário de edição
├── categorias/              # Página de categorias
├── movimentacoes/           # Página de movimentações
├── fornecedores/            # Página de fornecedores
├── compras/                 # Página de ordens de compra
├── recebimento/             # Página de recebimento
│   ├── actions.ts           # Server Actions para processar recebimento
│   └── page.tsx             # Interface de conferência cega
├── contas-a-pagar/          # Página de contas a pagar
├── clientes/                # Página de clientes
├── pedidos/                 # Página de pedidos de venda
├── contas-a-receber/        # Página de contas a receber
├── page.tsx                 # Dashboard (KPIs, gráficos, filtros)
├── layout.tsx               # Layout principal (sidebar + header + content)
└── globals.css              # Design tokens, animações (shimmer, fadeInUp)
lib/
├── prisma.ts                # Singleton do Prisma Client
└── utils.ts                 # Utilitários (formatCurrency, formatDate)
prisma/
├── schema.prisma            # 12 modelos de dados
└── seed.ts                  # Dados de demonstração (configurável via SEED_MONTHS)
```

---

## Dados de Demonstração (Seed)

O seed popula o banco com dados realistas distribuídos ao longo de um período configurável (`SEED_MONTHS`, padrão: 6 meses).

Os registros são distribuídos cronologicamente:

- Registros mais antigos aparecem como pagos/recebidos
- Registros mais recentes ficam como pendentes
- A quantidade de registros escala proporcionalmente ao período

| Entidade         | Quantidade base (6 meses)                               |
| ---------------- | ------------------------------------------------------- |
| Categorias       | 5 (Eletrônicos, Móveis, Roupas, Alimentos, Ferramentas) |
| Produtos         | 15 (com SKUs, preços e quantidades variadas)            |
| Fornecedores     | 4                                                       |
| Clientes         | 4                                                       |
| Ordens de Compra | ~12 (escala com SEED_MONTHS)                            |
| Pedidos de Venda | ~18 (escala com SEED_MONTHS)                            |
| Movimentações    | Geradas automaticamente por recebimentos e faturamentos |
| Contas a Pagar   | Geradas automaticamente por recebimentos                |
| Contas a Receber | Geradas automaticamente por faturamentos                |
