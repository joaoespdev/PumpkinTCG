import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";
import { Condition, Finish } from "../../../generated/prisma/client";

// Um item do lote de entrada. Identifica o produto de UMA de duas formas:
//   externalId — id da impressão no Scryfall (cartas)
//   productId  — produto já existente no catálogo (manuais)
// Exatamente um dos dois; o service valida.
export class EntryItemDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  externalId?: string;

  // Defaults do modo de digitação rápida: não-foil, NM, português, 1 unidade.
  @IsOptional()
  @IsEnum(Finish)
  finish?: Finish;

  @IsOptional()
  @IsEnum(Condition)
  condition?: Condition;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsInt()
  @Min(0)
  priceCents: number;
}

export class CreateEntryDto {
  // De onde veio o lote. Texto livre e opcional.
  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  note?: string;

  // Array mesmo com 1 item: o lote inteiro entra numa transação só,
  // e o futuro importador de CSV chama esta mesma rota.
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EntryItemDto)
  items: EntryItemDto[];
}
