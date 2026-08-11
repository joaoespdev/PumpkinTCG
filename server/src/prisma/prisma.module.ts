import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

// @Global: o PrismaService fica disponível para injeção em qualquer módulo
// sem precisar importar PrismaModule em cada um. Banco é dependência
// transversal — é o caso de uso legítimo de módulo global.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
