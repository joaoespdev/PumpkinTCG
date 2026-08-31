# TCGPumpkin — servidor (NestJS + Prisma + Postgres)

Backend do estoque. Arquitetura: `controller → service → repository → Prisma → Postgres`.

O banco é **PostgreSQL**; o Supabase hospeda o de produção, o Docker (opcional,
`docker-compose.yml` na raiz) roda um local. As migrations são do **Prisma** e
são as mesmas nos dois — é isso que mantém os bancos idênticos.

## Primeira vez

```bash
cd server
npm install

# 1. Credenciais
cp .env.example .env
#    Preencha DATABASE_URL (pooling, porta 6543) e DIRECT_URL (direta, 5432)
#    com os valores do Supabase: Project Settings -> Database.

# 2. Gera o client TypeScript do Prisma (obrigatório antes de compilar)
npx prisma generate

# 3. Cria as tabelas no banco
npx prisma migrate dev --name init

# 4. Rede de segurança: estoque negativo barrado pelo próprio banco.
#    O Prisma não expressa CHECK no schema, então é uma migration manual:
npx prisma migrate dev --create-only --name check_quantity_nao_negativa
#    Abra o migration.sql criado e cole:
#      ALTER TABLE "stock_items"
#        ADD CONSTRAINT "stock_items_quantity_nao_negativa"
#        CHECK ("quantity" >= 0);
npx prisma migrate dev   # aplica

# 5. Cria o usuário da loja (o STORE_USER_ID do .env)
npm run db:seed

# 6. Sobe a API
npm run dev              # http://localhost:3333/api
```

Frontend em dev: `npm run dev` na raiz — o Vite repassa `/api` pro Nest.

## Teste rápido (com a API no ar)

```bash
# dar entrada numa carta pelo id do Scryfall
curl -X POST http://localhost:3333/api/stock/entries \
  -H "Content-Type: application/json" \
  -d '{"supplier":"teste","items":[{"externalId":"56ebc372-aabd-4174-a943-c7bf59e5028d","quantity":3,"priceCents":1500}]}'

# listar o estoque
curl http://localhost:3333/api/stock
```

## Regras que o código assume

- **Quantidade nunca muda por edição direta** — só por movimento
  (`POST /stock/entries`, `POST /stock/:id/removals`). `PATCH /stock/:id`
  altera só preço.
- **Movimento é append-only**: nunca UPDATE, nunca DELETE. Errou? Lança um
  `ADJUST`. Auditoria: `SUM(quantityDelta)` = `StockItem.quantity`.
- **`DELETE /stock/:id`**: hard delete só se o item nunca movimentou;
  senão `OUT` zerando o saldo + `deletedAt` (soft delete).
- **Estrutura do banco muda SÓ pelo `schema.prisma`** + `prisma migrate`.
  Não crie tabelas pelo painel do Supabase — o Prisma vai querer apagá-las.

## Pendências conhecidas

- **User-Agent do Scryfall**: hoje o `ScryfallService` se identifica como
  `TCGPumpkin/0.1`. O Scryfall pede que aplicações incluam uma forma de
  contato (site ou e-mail) para conseguirem avisar antes de bloquear um
  cliente que esteja fazendo requisição demais. Quando existir domínio,
  trocar por `TCGPumpkin/0.1 (+https://SEU-DOMINIO)`. Não tem relação com
  as URLs do site — é só identificação do cliente HTTP.

- **Auth (Parte 4)**: hoje `actorId`/`sellerId` vêm de `STORE_USER_ID` (seed).
  Vai ser substituído por AuthGuard validando o JWT do Supabase.
- Corrida entre requisições simultâneas no upsert (P2002) e idempotência do
  lote: aceitas conscientemente por ora — ver decisões no histórico do projeto.
