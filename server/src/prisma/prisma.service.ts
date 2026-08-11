import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// ============================================================================
// PrismaClient como provider injetável do Nest.
//
// Atenção Prisma 7: o driver adapter no super() é OBRIGATÓRIO. O exemplo
// clássico dos tutoriais (super() vazio) é do Prisma 6 e não conecta.
//
// A URL aqui é a COM POOLING (porta 6543) — o runtime abre muitas conexões
// curtas e o pooler do Supabase existe exatamente pra isso. A URL direta
// (5432) fica só no prisma.config.ts, para as migrations.
// ============================================================================
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL não definida — confira o server/.env");
    }
    super({ adapter: new PrismaPg({ connectionString }) });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
