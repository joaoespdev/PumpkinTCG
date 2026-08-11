// ============================================================================
// Seed: dados mínimos para o sistema funcionar.
// Cria o usuário da loja — enquanto o auth não existe (Parte 4), ele é o
// vendedor e o autor de todos os movimentos. O id é fixo de propósito,
// para o .env.example já vir preenchido.
// Rodar com: npm run db:seed
// ============================================================================
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const STORE_USER_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  const user = await prisma.user.upsert({
    where: { id: STORE_USER_ID },
    update: {},
    create: {
      id: STORE_USER_ID,
      email: "loja@tcgpumpkin.local",
      name: "Loja TCGPumpkin",
      role: "ADMIN",
    },
  });

  console.log(`Usuário da loja pronto: ${user.name} (${user.id})`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
