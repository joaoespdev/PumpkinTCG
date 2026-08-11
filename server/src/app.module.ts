import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { StockModule } from "./modules/stock/stock.module";

@Module({
  imports: [
    // isGlobal: qualquer módulo pode injetar ConfigService sem importar nada.
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    StockModule,
  ],
})
export class AppModule {}
