import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CreateEntryDto } from "./dto/create-entry.dto";
import { CreateRemovalDto } from "./dto/create-removal.dto";
import { ListStockQuery } from "./dto/list-stock.query";
import { UpdatePriceDto } from "./dto/update-price.dto";
import { StockService } from "./stock.service";

// ============================================================================
// Controller: só HTTP — rota, status, validação (via DTO + ValidationPipe).
// Regra de negócio mora no service.
//
// "entries" e "removals" são substantivos: você CRIA um movimento, não
// "executa uma ação". É o que impede existir endpoint que mexe no saldo
// sem deixar rastro no extrato.
// ============================================================================

@Controller("stock")
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // Dar entrada (aceita lote — o modo de digitação rápida manda tudo aqui)
  @Post("entries")
  @HttpCode(201)
  createEntries(@Body() dto: CreateEntryDto) {
    return this.stockService.createEntries(dto);
  }

  // Dar baixa: venda, perda, devolução, ajuste
  @Post(":id/removals")
  @HttpCode(201)
  createRemoval(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateRemovalDto
  ) {
    return this.stockService.createRemoval(id, dto);
  }

  @Get()
  list(@Query() query: ListStockQuery) {
    return this.stockService.list(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.stockService.findOne(id);
  }

  // Altera SÓ preço. Quantidade não tem PATCH — só movimento.
  @Patch(":id")
  updatePrice(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePriceDto
  ) {
    return this.stockService.updatePrice(id, dto.priceCents);
  }

  // Hard delete se nunca movimentou; senão OUT + soft delete. O service
  // decide olhando os dados — sem ?force=true na URL.
  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.stockService.remove(id);
  }

  // O extrato do item
  @Get(":id/movements")
  listMovements(@Param("id", ParseUUIDPipe) id: string) {
    return this.stockService.listMovements(id);
  }
}
