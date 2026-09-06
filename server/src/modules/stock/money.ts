// ============================================================================
// Formatação de dinheiro.
//
// Função pura, sem Nest e sem Prisma: dá para testar isolada e reusar em
// qualquer lugar. Não usa toLocaleString de propósito — aquilo depende dos
// dados de ICU do Node, que variam por build; aqui o resultado é sempre o
// mesmo em qualquer máquina.
// ============================================================================

// 27990 -> "R$ 279,90"   |   -500 -> "-R$ 5,00"   |   1234567 -> "R$ 12.345,67"
export function formatBRL(cents: number): string {
  const sinal = cents < 0 ? "-" : "";
  const absoluto = Math.abs(Math.trunc(cents));

  const reais = Math.trunc(absoluto / 100).toString();
  const centavos = (absoluto % 100).toString().padStart(2, "0");

  // Ponto a cada 3 dígitos, da direita para a esquerda.
  const comMilhar = reais.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${sinal}R$ ${comMilhar},${centavos}`;
}
