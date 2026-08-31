import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class ListStockQuery {
  @IsOptional()
  @IsUUID()
  productId?: string;

  // Id da impressão no Scryfall. Existe porque o frontend conhece a carta
  // por este id (é o que está na URL /card/:id) e não pelo productId
  // interno — sem este filtro ele precisaria de uma consulta só para
  // traduzir um id no outro.
  @IsOptional()
  @IsUUID()
  externalId?: string;

  // Busca por trecho do nome do produto.
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;
}
