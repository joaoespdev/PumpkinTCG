# TCGPumpkin — Guia do backend de estoque

Panorama completo para quem nunca viu este ambiente e quer começar a codar.
O `README.md` ao lado é o passo a passo curto de setup; este documento explica
**o que cada coisa é, por que existe e como o sistema pensa**.

---

## 1. A ideia em um parágrafo

O backend é uma API HTTP (NestJS) que gerencia o estoque da loja num banco
PostgreSQL (hospedado no Supabase), conversando com ele via Prisma. O modelo
central é **saldo separado de extrato**, como numa conta bancária: a tabela
`stock_items` guarda o saldo (quanto tem, por quanto vende) e a tabela
`stock_movements` guarda o extrato (cada entrada e saída, com preço congelado,
autor e data). A regra de ouro que organiza todo o código: **quantidade nunca
muda por edição direta — só muda criando um movimento**. O saldo é
consequência do extrato; se `SUM(quantityDelta)` não bater com `quantity`,
há um bug.

## 2. O caminho de uma requisição

```
Navegador (React/Vite, porta 5173)
    │  fetch("/api/stock")           ← proxy do Vite repassa /api
    ▼
NestJS sobre Fastify (porta 3333)
    │  Controller  → valida forma (DTOs + class-validator)
    │  Service     → regra de negócio, transações
    │  Repository  → acesso a dados, sem regra
    ▼
Prisma (traduz TypeScript ⇄ SQL)
    │  URL com pooling (porta 6543)
    ▼
PostgreSQL no Supabase (região São Paulo)
```

A flecha de dependência nunca volta: controller → service → repository →
Prisma. O service não sabe o que é HTTP; o repository não sabe regra de
negócio. Isso é o que permite testar a regra sem subir servidor nem banco.

Papéis das tecnologias (não se confundem):

| Peça | O que é | O que faz |
|---|---|---|
| **PostgreSQL** | tecnologia do banco | guarda os dados |
| **Supabase** | hospedagem (+ login pronto) | roda um Postgres na nuvem pra gente |
| **Prisma** | biblioteca (ORM) | traduz TypeScript ⇄ SQL, gera migrations |
| **NestJS** | framework de backend | estrutura em módulos, DI, controllers |
| **Fastify** | servidor HTTP | motor embaixo do Nest (no lugar do Express) |
| **Docker** (opcional) | executor de containers | liga um Postgres local pra dev |

## 3. Como rodar (do zero absoluto)

Pré-requisito: Node.js. Nada mais.

```bash
cd server
npm install                          # dependências
# copie .env.example para .env e preencha as duas URLs do Supabase
npx prisma generate                  # gera o client TS (obrigatório p/ compilar)
npx prisma migrate dev               # aplica as migrations no banco
npm run db:seed                      # cria o usuário da loja
npm run dev                          # API em http://localhost:3333/api
```

Frontend: `npm run dev` na raiz do projeto (o Vite repassa `/api` pro Nest).

As **duas URLs** no `.env` não são redundância:
`DATABASE_URL` (porta 6543, com pooling) é usada pelo app em runtime;
`DIRECT_URL` (porta 5432, direta) é usada só pelo Prisma CLI nas migrations.
O pooler não suporta comandos de alteração de estrutura — trocar as duas
gera erros que não dizem qual é o problema.

Verificação rápida de saúde: `GET http://localhost:3333/api/stock` no
navegador deve responder `[]` (ou a lista do estoque). Esse `[]` percorre
o caminho inteiro do diagrama acima.

## 4. Mapa de arquivos

### Raiz do repositório

| Arquivo | Responsabilidade |
|---|---|
| `docker-compose.yml` | Postgres local opcional (`docker compose up -d`). Docker **liga o banco**; quem faz migration é o Prisma — as mesmas migrations rodam no Docker e no Supabase. |
| `vite.config.ts` | (entre outros) o proxy `/api → localhost:3333` em dev, que evita CORS. |
| `.gitignore` | versionado como qualquer arquivo; protege `.env`, `node_modules`, `dist`, `src/generated`. |

### `server/` — configuração

| Arquivo | Responsabilidade |
|---|---|
| `package.json` | dependências e scripts (`dev`, `build`, `db:*`). |
| `tsconfig.json` | compilação TS (decorators ligados — exigência do Nest). |
| `nest-cli.json` | config do build do Nest (`sourceRoot: src`). |
| `prisma.config.ts` | config do Prisma CLI (Prisma 7+): onde está o schema e a `DIRECT_URL` das migrations. Tutoriais antigos põem a URL dentro do schema — não funciona mais. |
| `.env` / `.env.example` | credenciais. O `.env` real nunca vai pro git. |

### `server/prisma/` — o banco

| Arquivo | Responsabilidade |
|---|---|
| `schema.prisma` | **fonte única de verdade da estrutura do banco.** Modelos, enums, índices, uniques. Toda mudança de estrutura começa aqui + `npx prisma migrate dev`. Nunca crie tabela pelo painel do Supabase. |
| `migrations/*/migration.sql` | histórico da **estrutura** (CREATE TABLE etc. — zero dados). Gerado pelo Prisma, commitado de propósito: permite reconstruir o banco em qualquer máquina. |
| `seed.ts` | dados mínimos: cria o usuário da loja (id fixo, usado pelo `STORE_USER_ID`). |

### `server/src/` — a aplicação

| Arquivo | Responsabilidade |
|---|---|
| `main.ts` | bootstrap: Nest sobre Fastify, prefixo global `/api`, `ValidationPipe` global (valida todo body contra o DTO da rota). |
| `app.module.ts` | módulo raiz: registra Config, Prisma e Stock. |
| `prisma/prisma.service.ts` | o `PrismaClient` como serviço injetável. Prisma 7 exige o driver adapter no construtor (`PrismaPg` com a URL de pooling). |
| `prisma/prisma.module.ts` | `@Global()`: qualquer módulo pode injetar o PrismaService sem importar nada. |
| `generated/` (ignorado no git) | client TypeScript gerado pelo `prisma generate` a partir do schema. Derivável ⇒ não versiona. |

### `server/src/modules/stock/` — o domínio de estoque

| Arquivo | Camada | Responsabilidade |
|---|---|---|
| `stock.controller.ts` | HTTP | mapeia rota → método do service; só status code e params. Zero regra de negócio. |
| `stock.service.ts` | Regra | **o coração.** Entrada em lote transacional, baixa com checagem de saldo (409), remoção hard/soft automática, congelamento de preço no movimento. |
| `stock.repository.ts` | Dados | métodos finos sobre o Prisma. Todo método recebe `db` (client ou transação) como 1º parâmetro — é assim que o `tx` do service atravessa. Existe principalmente pela testabilidade. |
| `scryfall.service.ts` | Externo | busca dados da carta no Scryfall **do lado do servidor** (o cliente manda só o id; nome/set/imagem vêm da fonte — ninguém cadastra "Black Lotus" apontando pra um Mountain). |
| `stock.module.ts` | Nest | registra controller e providers do módulo. |
| `dto/*.ts` | Contrato | formato de cada requisição, com validação declarativa (class-validator). O ValidationPipe rejeita com 400 antes de chegar ao service. |

## 5. O modelo de dados (4 tabelas)

```
users ──┐ (quem executou / quem vende)
        │
products ← catálogo: O QUE existe (sem preço, sem quantidade)
        │     kind: CARD | SEALED | ACCESSORY
        │     source+externalId: referência ao Scryfall (única)
        ▼
stock_items ← O SALDO: sua cópia física à venda
        │     variante = produto + finish + condition + language (única)
        │     quantity, priceCents (centavos, nunca float)
        ▼
stock_movements ← O EXTRATO: append-only, nunca UPDATE/DELETE
              type IN|OUT|SALE|ADJUST, quantityDelta, balanceAfter,
              unitPriceCents (congelado no momento), actor, supplier, data
```

Decisões que valem lembrar:

- **Id do Scryfall é referência (`externalId`), não chave primária.** Nossas
  chaves são uuids nossos ⇒ rotas uniformes p/ carta e produto manual, e
  outra fonte (ex.: Pokémon) entra sem mudar o schema.
- **`finish` fica na variante, não no produto**: foil e não-foil compartilham
  o mesmo id no Scryfall mas são produtos de preços diferentes.
- **Errou um movimento? Lança um `ADJUST` de correção.** Nunca se edita o
  extrato — ele conta a história inteira, inclusive os erros.
- **Soft delete (`deletedAt`)**: some da loja, permanece no histórico. Hard
  delete só quando o item nunca movimentou (o service decide sozinho).

## 6. As rotas

| Método | Rota | Faz | Erros típicos |
|---|---|---|---|
| POST | `/api/stock/entries` | entrada em lote (transação única) | 400 forma/ids, 404 carta |
| POST | `/api/stock/:id/removals` | baixa: SALE/OUT/ADJUST | **409 saldo insuficiente** |
| GET | `/api/stock` | lista (filtros: `search`, `productId`, paginação) | — |
| GET | `/api/stock/:id` | detalhe do item | 404 |
| PATCH | `/api/stock/:id` | **só preço** (quantidade não tem PATCH) | 404 |
| DELETE | `/api/stock/:id` | hard se sem histórico; senão OUT + soft | 404 |
| GET | `/api/stock/:id/movements` | o extrato do item | 404 |

Exemplo de entrada (o corpo aceita lote; CSV futuro usará esta mesma rota):

```json
POST /api/stock/entries
{
  "supplier": "Distribuidora XYZ",
  "items": [
    { "externalId": "<id-scryfall>", "quantity": 3, "priceCents": 1500 },
    { "externalId": "<id-scryfall>", "finish": "FOIL", "condition": "SP",
      "quantity": 1, "priceCents": 9900 }
  ]
}
```

Defaults por item: `finish` NONFOIL, `condition` NM, `language` "pt",
`quantity` 1. Onde achar o id do Scryfall: na página da carta em
scryfall.com, ou pela busca do próprio site (o `mtg.ts` do frontend já
devolve `card.id`).

Provisório: enquanto não há login, autor e vendedor dos movimentos são o
usuário da loja (`STORE_USER_ID` do `.env`, criado pelo seed).

## 7. Próximos passos — estoque 100% funcional

Em ordem, com o critério de "pronto" de cada um:

1. **Migration do CHECK** (5 min) — rede de segurança no próprio banco
   contra estoque negativo. Instruções no `README.md`, passo 4.
   *Pronto quando:* a migration aplicada aparece em `prisma/migrations/`.

2. **Primeiras cartas reais no estoque** — via `curl`/Insomnia na rota de
   entries, com ids do Scryfall de cartas que você tem na mão e preços
   reais em centavos. *Pronto quando:* `GET /api/stock` lista os itens e o
   Prisma Studio (`npm run db:studio`) mostra os movimentos IN.

3. **Estoque visível no catálogo** (frontend) — a ponte que falta entre o
   backend e o site: a `CardPage` consultar `GET /api/stock?productId=...`
   (ou por externalId) e exibir "Em estoque: 3 · R$ 15,00". Sem isso o
   carrinho não tem o que mostrar. *Pronto quando:* uma carta com estoque
   exibe preço e quantidade na página dela.

4. **Tela de digitação rápida** (admin) — foco fixo no campo de busca,
   Enter adiciona com defaults, "Salvar tudo" manda o lote pra
   `/stock/entries`. Elimina o curl do dia a dia. *Pronto quando:* você
   cadastra 10 cartas em ~2 minutos sem sair do teclado.

5. **Auth (Parte 4)** — login via Supabase Auth, AuthGuard validando o JWT,
   `actorId` real no lugar do `STORE_USER_ID`, e a tela de admin protegida.
   Necessário antes de qualquer coisa ir pra internet. *Pronto quando:* as
   rotas de escrita recusam requisições sem token.

## 8. Roadmap combinado (visão de produto)

```
[feito] backend de estoque ─→ [7.1–7.2] itens precificados
     ─→ [7.3] catálogo mostra estoque/preço
     ─→ [7.4] admin de cadastro    ─→ [7.5] auth
     ─→ CARRINHO (UI completa e responsiva, mobile-first)
     ─→ só então: API de e-commerce (checkout/pagamento)
```

Nota de arquitetura pro carrinho, decidida desde já: o carrinho será
**estado do frontend** (itens + quantidades escolhidas), validado contra o
estoque no momento do checkout — a baixa (`SALE`) só acontece na confirmação
da compra, nunca ao adicionar ao carrinho. Reserva de item (segurar unidades
por X minutos) fica adiada até existir checkout real; está anotada como
limitação consciente.

## 9. Limitações conscientes (dívida registrada)

- Sem retry no conflito de upsert concorrente (P2002) — irrelevante com um
  operador; revisitar se surgir segundo vendedor.
- Sem chave de idempotência no lote — duplo clique se resolve no frontend;
  chave entra junto com o checkout.
- `npm audit` acusa 2 highs no `find-my-way` (DDoS via HTTP/2) — não usamos
  HTTP/2; aguardando correção upstream do Nest. Não rodar `audit fix --force`.
- Free tier do Supabase pausa o projeto após ~7 dias sem requisição —
  despausar no painel.
