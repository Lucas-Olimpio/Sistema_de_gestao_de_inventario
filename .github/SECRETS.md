# Configuração dos Secrets do GitHub Actions

Para que os workflows de CI e Deploy funcionem correctamente, é necessário adicionar
os seguintes secrets no repositório GitHub:

**Onde configurar:**
Repositório → Settings → Secrets and variables → Actions → New repository secret

---

## Secrets Obrigatórios

### `DATABASE_URL`

URL de ligação ao PostgreSQL de produção.

Exemplos:

```
# Neon
postgresql://user:password@ep-xxx.eu-west-1.aws.neon.tech/neondb?sslmode=require

# Supabase
postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require
```

### `AUTH_SECRET`

Chave secreta para encriptação das sessões NextAuth.
Gerar com: `openssl rand -base64 32`

```
# Exemplo de valor gerado
mK8zP2xQ9nL4wR7jY3vB6cF1hT5sN0uE
```

### `AUTH_URL`

URL público da aplicação em produção.

```
https://invenpro.vercel.app
```

---

## Secrets Opcionais

### `SYSTEM_ERROR_WEBHOOK_URL`

URL do webhook para notificações de erro em produção (ex: Slack, Discord, Webhook.site).

```
https://hooks.slack.com/services/xxx/yyy/zzz
```

---

## Secrets para Deploy Automático (Vercel)

### `VERCEL_TOKEN`

Token de API da Vercel para deploy automatizado.

Obter em: https://vercel.com/account/tokens → Create Token

### `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID`

IDs do projecto Vercel. Obtidos ao correr localmente:

```bash
pnpm add -g vercel
vercel link
# Os IDs aparecem no ficheiro .vercel/project.json
```

---

## Variáveis de Ambiente na Vercel

Para além dos GitHub Secrets, configure também estas variáveis directamente
no painel da Vercel (Settings → Environment Variables → Production):

| Variável                   | Valor                                                  |
| -------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`             | URL PostgreSQL de produção (com `?sslmode=require`)    |
| `AUTH_SECRET`              | Mesmo valor que o GitHub Secret                        |
| `AUTH_URL`                 | URL público da app (ex: `https://invenpro.vercel.app`) |
| `SYSTEM_ERROR_WEBHOOK_URL` | (Opcional) URL do webhook                              |
