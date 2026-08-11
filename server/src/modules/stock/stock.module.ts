import { Module } from "@nestjs/common";
import { ScryfallService } from "./scryfall.service";
import { StockController } from "./stock.controller";
import { StockRepository } from "./stock.repository";
import { StockService } from "./stock.service";

// PrismaService não aparece aqui: vem do PrismaModule, que é @Global.
@Module({
  controllers: [StockController],
  providers: [StockService, StockRepository, ScryfallService],
})
export class StockModule {}
