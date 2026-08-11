import { IsInt, Min } from "class-validator";

// PATCH /stock/:id altera SÓ o preço. Quantidade nunca muda por edição
// direta — só criando um movimento (entries/removals). É a regra que
// mantém o extrato confiável.
export class UpdatePriceDto {
  @IsInt()
  @Min(0)
  priceCents: number;
}
