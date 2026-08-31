-- Rede de segurança no próprio banco contra estoque negativo.
--
-- O Prisma não expressa CHECK no schema.prisma, então esta migration é
-- escrita à mão. Como o Prisma ignora CHECKs ao comparar o schema com o
-- histórico, ele NÃO vai tentar remover a constraint em migrations futuras.
--
-- A validação de saldo no StockService continua sendo a primeira camada
-- (devolve 409 com mensagem amigável). Esta é a última: pega qualquer
-- escrita que não passe pelo service (seed, script, Prisma Studio, painel
-- do Supabase, rota nova com bug).

ALTER TABLE "stock_items"
  ADD CONSTRAINT "stock_items_quantity_nao_negativa"
  CHECK ("quantity" >= 0);
