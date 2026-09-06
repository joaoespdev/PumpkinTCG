import { formatBRL } from "./money";

// ============================================================================
// Camada de apresentação das leituras: acrescenta a versão legível dos
// campos de dinheiro.
//
// ACRESCENTA, nunca substitui. O inteiro em centavos continua sendo a fonte
// da verdade (float com dinheiro acumula erro de centavo); o texto existe só
// para quem lê a resposta — no Postman, num log, ou direto na interface.
//
// Genérico no tipo de entrada para não precisar repetir os tipos do Prisma:
// o que vier junto (o `product` incluído, por exemplo) atravessa intacto.
// ============================================================================

export function presentStockItem<T extends { priceCents: number }>(item: T) {
  return { ...item, price: formatBRL(item.priceCents) };
}

export function presentMovement<T extends { unitPriceCents: number }>(
  movement: T,
) {
  return { ...movement, unitPrice: formatBRL(movement.unitPriceCents) };
}
