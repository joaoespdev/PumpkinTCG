import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import { MovementType } from "../../../generated/prisma/client";

export class CreateRemovalDto {
  // Sempre POSITIVA. Quem decide o sinal é o type, não o cliente —
  // assim ninguém manda -5 por engano e infla o estoque.
  @IsInt()
  @Min(1)
  quantity: number;

  // SALE | OUT | ADJUST. "IN" é recusado pelo service (use /stock/entries).
  @IsEnum(MovementType)
  type: MovementType;

  // Preço da baixa (ex.: vendeu com desconto). Se omitido, congela o
  // preço atual do item.
  @IsOptional()
  @IsInt()
  @Min(0)
  unitPriceCents?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
