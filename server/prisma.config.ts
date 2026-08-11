// ============================================================================
// Configuração do Prisma CLI (Prisma 7+).
//
// No Prisma 7 a URL de conexão saiu do schema.prisma e veio para cá.
// Tutoriais que mostram `url = env("DATABASE_URL")` dentro do bloco
// datasource são do Prisma 6 — não funcionam mais.
//
// Atenção à URL usada aqui: migrations exigem a conexão DIRETA (porta 5432).
// A URL com pooling (porta 6543) não suporta os comandos que alteram
// estrutura de tabela. O runtime do app usa a com pooling (ver db lá).
// ============================================================================
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"),
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
